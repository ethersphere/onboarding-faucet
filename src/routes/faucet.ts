import { Request, Response, Router } from 'express'
import { getBuggyHash } from '../lib/buggy-hash'
import { getAddress } from '@ethersproject/address'
import type { Wallet } from '@ethersproject/wallet'
import type { Provider } from '@ethersproject/abstract-provider'
import type { BlockEmitter } from '../lib/block-emitter'
import type { Logger } from 'winston'

export type FaucetRoutesConfig = {
  wallet: Wallet
  blockEmitter: BlockEmitter
  logger: Logger
}

export type OverlayTx = {
  blockHash: string
  transactionHash: string
  nextBlockHash: string
  nextBlockHashBee: string
}

export class HasTransactionsError extends Error {}
export class BlockTooRecent extends Error {}

function transformAddress(address: string): string {
  if (address.toLowerCase().startsWith('0x')) {
    return address.slice(2)
  }

  return address
}

async function hasBalance(provider: Provider, address: string): Promise<boolean> {
  const balance = await provider.getBalance(address)

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

    throw err
  }
}

async function createOverlayTx(wallet: Wallet, blockEmitter: BlockEmitter, address: string): Promise<OverlayTx> {
  if (await hasBalance(wallet.provider, address)) {
    throw new HasTransactionsError()
  }

  const gasPrice = await wallet.getGasPrice()
  const tx = await wallet.sendTransaction({
    to: address,
    value: 0,
    data: '0x' + address.padStart(64, '0').toLowerCase(),
    gasPrice,
  })
  const { blockNumber, blockHash, transactionHash } = await tx.wait()
  const nextBlockNumber = blockNumber + 1

  // Hopefully the new block doesn't appear before this listener is set up
  // If so, we might need to cache a few blocks in BlockEmitter, or move this call
  // up and cache them locally
  const nextBlockHash = await getNextBlockHash(wallet, blockEmitter, nextBlockNumber)
  const nextBlockHashBee = await getBuggyHash(nextBlockNumber)

  return {
    blockHash,
    transactionHash,
    nextBlockHash,
    nextBlockHashBee,
  }
}

export function createFaucetRoutes({ wallet, blockEmitter, logger }: FaucetRoutesConfig): Router {
  const router = Router()

  router.post('/:address', async (req: Request<{ address: string }>, res: Response) => {
    let address
    try {
      address = getAddress(req.params.address)
    } catch (_) {
      res.status(400).json({ error: 'invalid address' })

      return
    }

    try {
      res.json(await createOverlayTx(wallet, blockEmitter, transformAddress(address)))
    } catch (err) {
      logger.error('createOverlayTx', err)
      res.sendStatus(500)
    }
  })

  return router
}
