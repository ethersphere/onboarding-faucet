import { BlockEmitter } from '../../src/lib/block-emitter'
import { mineBlock, provider } from '../utils'

const blockEmitter = new BlockEmitter(provider)

describe('BlockEmitter', () => {
  it('should emit a block', async () => {
    const promise = new Promise(resolve =>
      blockEmitter.once('block', ({ number }) => {
        resolve(number)
      }),
    )
    await mineBlock()
    blockEmitter.check()
    const processedBlockNum = await promise
    const blockNum = await provider.getBlockNumber()
    expect(processedBlockNum).toEqual(blockNum)
  })
})
