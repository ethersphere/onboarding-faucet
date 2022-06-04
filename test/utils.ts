import { JsonRpcProvider } from '@ethersproject/providers'

export const rpcUrl = process.env.RPC_URL ?? 'http://127.0.0.1:9545'
export const provider = new JsonRpcProvider(rpcUrl)

export async function nextBlock(): Promise<void> {
  return provider.send('evm_mine', [Date.now()])
}
