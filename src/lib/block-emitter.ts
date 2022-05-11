import { Web3Provider } from '@ethersproject/providers'
import Web3WsProvider from 'web3-providers-ws'
import { TypedEmitter } from 'tiny-typed-emitter'
import type { WebsocketProvider } from 'web3-providers-ws'

// Lib
import { sleep } from './utils'

type BlockEmitterEvents = {
  block: (block: { number: number; hash: string }) => void
}

export class BlockEmitter extends TypedEmitter<BlockEmitterEvents> {}

export const createBlockEmitter = ({ rpcUrl }: { rpcUrl: string }): BlockEmitter => {
  const emitter = new BlockEmitter()

  // NOTE: Seems like `web3-providers-ws`'s types are incorrect?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wsProvider = new (Web3WsProvider as any)(rpcUrl, {
    timeout: 30000,
    clientConfig: {
      keepalive: true,
      keepaliveInterval: 60000,
    },
    reconnect: {
      auto: true,
      delay: 5000,
    },
  }) as WebsocketProvider

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provider = new (Web3Provider as any)(wsProvider) as Web3Provider
  let lastBlock = Infinity
  let handlingBlocks = false

  const handleBlock = async (number: number): Promise<void> => {
    const { hash } = await provider.getBlock(number)

    emitter.emit('block', {
      number,
      hash,
    })

    lastBlock = number
  }

  const handleBlocks = async (number: number): Promise<boolean> => {
    if (handlingBlocks) {
      return number <= lastBlock
    }

    handlingBlocks = true

    // In case blocks were missed (due to RPC issues for example), this makes sure
    // that we always emit them in the right order and without missing any
    for (let current = lastBlock; current <= Math.max(number, lastBlock); current++) {
      await handleBlock(number)
    }

    handlingBlocks = false

    return true
  }

  provider.on('block', async (number: number) => {
    let done
    do {
      done = await handleBlocks(number)

      if (!done) {
        await sleep(100)
      }
    } while (!done)
  })

  return emitter
}
