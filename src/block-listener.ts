import { Web3Provider } from '@ethersproject/providers'
import { EventEmitter } from 'events'
import { WebsocketProvider } from 'web3-providers-ws'

class BlockEmitter extends EventEmitter {}

export const createBlockListener = ({ rpcUrl }: { rpcUrl: string }): BlockEmitter => {
  const emitter = new BlockEmitter()
  const wsProvider = new WebsocketProvider(rpcUrl, {
    timeout: 30000,
    clientConfig: {
      keepalive: true,
      keepaliveInterval: 60000,
    },
    reconnect: {
      auto: true,
      delay: 5000,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provider = new (Web3Provider as any)(wsProvider) as Web3Provider

  provider.on('block', blockNumber => emitter.emit('block', blockNumber))

  return emitter
}
