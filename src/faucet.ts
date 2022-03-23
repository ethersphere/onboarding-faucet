import { Request, Response, Router } from 'express'
import type { Wallet } from '@ethersproject/wallet'
import type { Provider } from '@ethersproject/abstract-provider'

export type FaucetRoutesConfig = {
  wallet: Wallet
}

export class HasTransactionsError extends Error {}

function transformAddress(address: string): string {
  if (address.toLowerCase().startsWith('0x')) {
    return address.slice(2)
  }

  return address
}

async function hasBalance(provider: Provider, address: string) {
  const balance = await provider.getBalance(address)

  return balance.gt(0)
}

async function createOverlayTx(wallet: Wallet, address: string) {
  if (await hasBalance(wallet.provider, address)) {
    throw new HasTransactionsError()
  }

  const gasPrice = await wallet.getGasPrice()
  const tx = await wallet.sendTransaction({
    to: address,
    value: 0,
    data: address.padStart(64, '0'),
    gasPrice,
  })
  const { blockHash, transactionHash } = await tx.wait()

  // TODO: Get next block hash

  return {
    blockHash,
    transactionHash,
    nextBlockHash: '',
    nextBlockHashBee: '',
  }
}

export function createFaucetRoutes({ wallet }: FaucetRoutesConfig): Router {
  const router = Router()

  router.post('/:address', async (req: Request<{ address: string }>, res: Response) => {
    try {
      await createOverlayTx(wallet, transformAddress(req.params.address))
    } catch (err) {
      res.send(500)
    }
  })

  return router
}
