import { Request, Response, Router } from 'express'
import { getAddress } from '@ethersproject/address'

// Lib
import { getBuggyHash } from '../lib/buggy-hash'
import { auth } from '../middlewares/auth'
import { Semaphore } from '../lib/semaphore'
import { logger } from '../lib/logger'

// Metrics
import {
  nativeFundCounter,
  nativeFundFailedCounter,
  overlayCreationCounter,
  overlayCreationFailedCounter,
  tokenFundCounter,
  tokenFundFailedCounter,
} from '../metrics/faucet'

// Types
import type { Wallet } from '@ethersproject/wallet'
import type { Provider, TransactionReceipt } from '@ethersproject/abstract-provider'
import type { BlockEmitter } from '../lib/block-emitter'
import type { Logger } from 'winston'
import type { Contract } from '@ethersproject/contracts'
import type { FundingConfig } from '../lib/config'
import type { BigNumber } from '@ethersproject/bignumber'

// Allows only single operation to run
const semaphore = new Semaphore('wallet semaphore', 1)

export type FaucetRoutesConfig = {
  wallet: Wallet
  blockEmitter: BlockEmitter
  logger: Logger
  bzz: Contract
  funding: FundingConfig
}

export type OverlayTx = {
  blockHash: string
  transactionHash: string
  nextBlockHash: string
  nextBlockHashBee: string
}

async function getGasPrice(wallet: Wallet): Promise<BigNumber> {
  const gasPrice = await wallet.getGasPrice()

  return gasPrice.mul(12).div(10)
}

// Errors
export class HasTransactionsError extends Error {}
export class BlockTooRecent extends Error {}

function transformAddress(address: string): string {
  if (address.toLowerCase().startsWith('0x')) {
    return address.slice(2)
  }

  return address
}

async function hasBalance(provider: Provider, address: string): Promise<boolean> {
  logger.debug(`checking balance of ${address}`)
  const balance = await provider.getBalance(address)
  logger.info(`balance of ${address} is ${balance}`)

  return balance.gt(0)
}

async function getNextBlockHash(wallet: Wallet, blockEmitter: BlockEmitter, blockNumber: number): Promise<string> {
  try {
    return await new Promise(resolve => {
      const handler = ({ number, hash }: { number: number; hash: string }) => {
        if (number > blockNumber) {
          throw new BlockTooRecent()
        }

        if (number === blockNumber) {
          blockEmitter.off('block', handler)
          resolve(hash)
        }
      }

      blockEmitter.on('block', handler)
    })
  } catch (err) {
    if (err instanceof BlockTooRecent) {
      const nextBlock = await wallet.provider.getBlock(blockNumber)

      return nextBlock.hash
    }
    logger.debug(`getNextBlockHash failed to get blockhash for blockNumber ${blockNumber}`)

    throw err
  }
}

async function createOverlayTx(wallet: Wallet, blockEmitter: BlockEmitter, address: string): Promise<OverlayTx> {
  if (await hasBalance(wallet.provider, address)) {
    logger.info(`address ${address} already has balance`)
    throw new HasTransactionsError()
  }

  const gasPrice = await getGasPrice(wallet)
  const tx = await wallet.sendTransaction({
    to: address,
    value: 0,
    data: '0x' + address.padStart(64, '0').toLowerCase(),
    gasPrice,
  })
  logger.info(`sending transaction to ${address}`)
  const { blockNumber, blockHash, transactionHash } = await tx.wait()

  logger.debug(`createOverlayTx after waiting for tx ${tx.hash}`)
  const nextBlockNumber = blockNumber + 1

  // Hopefully the new block doesn't appear before this listener is set up
  // If so, we might need to cache a few blocks in BlockEmitter, or move this call
  // up and cache them locally
  logger.debug(`createOverlayTx before await getNextBlockHash nextBlockNumber: ${nextBlockNumber}`)
  const nextBlockHash = await getNextBlockHash(wallet, blockEmitter, nextBlockNumber)
  logger.debug(`createOverlayTx before await getBuggyHash nextBlockNumber: ${nextBlockNumber}`)
  const nextBlockHashBee = await getBuggyHash(nextBlockNumber)
  logger.debug(
    `createOverlayTx after await getBuggyHash nextBlockNumber: ${nextBlockNumber} nextBlockHashBee: ${nextBlockHashBee}`,
  )

  return {
    blockHash,
    transactionHash,
    nextBlockHash,
    nextBlockHashBee,
  }
}

async function fundAddressWithToken(
  wallet: Wallet,
  bzz: Contract,
  address: string,
  amount: bigint,
): Promise<TransactionReceipt> {
  const gasPrice = await getGasPrice(wallet)
  const tx = await bzz.transfer(address, amount, { gasPrice })

  logger.debug(`fundAddressWithToken address ${address} amount ${amount}`)

  return await tx.wait()
}

export async function fundAddressWithNative(
  wallet: Wallet,
  address: string,
  amount: bigint,
): Promise<TransactionReceipt> {
  const gasPrice = await getGasPrice(wallet)
  const tx = await wallet.sendTransaction({
    to: address,
    value: amount,
    gasPrice,
  })

  logger.debug(`fundAddressWithNative address ${address} amount ${amount}`)

  return await tx.wait()
}

export function createFaucetRoutes({ wallet, blockEmitter, logger, bzz, funding }: FaucetRoutesConfig): Router {
  const router = Router()

  router.post('/overlay/:address', async (req: Request<{ address: string }>, res: Response) => {
    logger.info(`POST: /overlay/:address ${req.params.address}`)
    let address
    try {
      address = getAddress(req.params.address)
    } catch (_) {
      res.status(400).json({ error: 'invalid address' })

      return
    }

    // Wait until lock is acquired to do anything
    const lock = await semaphore.acquire()
    try {
      res.json(await createOverlayTx(wallet, blockEmitter, transformAddress(address)))
      overlayCreationCounter.inc()
    } catch (err) {
      overlayCreationFailedCounter.inc()
      logger.error('createOverlayTx', err)
      res.sendStatus(500)
    }
    lock.release()
  })

  router.post('/fund/bzz/:address', auth, async (req: Request<{ address: string }>, res: Response) => {
    logger.info(`POST: fund/bzz/:address ${req.params.address}`)

    if (!funding.bzzAmount) {
      res.status(503).json({ error: 'amount not configured' })

      return
    }

    let address
    try {
      address = getAddress(req.params.address)
    } catch (_) {
      res.status(400).json({ error: 'invalid address' })

      return
    }

    // Wait until lock is acquired to do anything
    const lock = await semaphore.acquire()
    try {
      res.json(await fundAddressWithToken(wallet, bzz, transformAddress(address), funding.bzzAmount))
      tokenFundCounter.inc()
    } catch (err) {
      tokenFundFailedCounter.inc()
      logger.error('fundAddressWithToken', err)
      res.sendStatus(500)
    }
    lock.release()
  })

  router.post('/fund/native/:address', auth, async (req: Request<{ address: string }>, res: Response) => {
    logger.info(`POST: fund/native/:address ${req.params.address}`)

    if (!funding.nativeAmount) {
      res.status(503).json({ error: 'amount not configured' })

      return
    }

    let address
    try {
      address = getAddress(req.params.address)
    } catch (_) {
      res.status(400).json({ error: 'invalid address' })

      return
    }

    // Wait until lock is acquired to do anything
    const lock = await semaphore.acquire()
    try {
      res.json(await fundAddressWithNative(wallet, transformAddress(address), funding.nativeAmount))
      nativeFundCounter.inc()
    } catch (err) {
      nativeFundFailedCounter.inc()
      logger.error('fundAddressWithNative', err)
      res.sendStatus(500)
    }
    lock.release()
  })

  router.get('/balance', auth, async (_, res) => {
    const balance = (await wallet.getBalance()).toString()
    res.json({ balance })
  })

  return router
}
