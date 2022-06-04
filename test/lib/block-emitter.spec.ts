import { BlockEmitter } from '../../src/lib/block-emitter'
import { nextBlock, provider } from '../utils'

const blockEmitter = new BlockEmitter(provider)

// afterAll(async () => {
//   await blockEmitter.stop()
// })

describe('BlockEmitter', () => {
  it('should emit blocks', async () => {
    const promise = new Promise(resolve =>
      blockEmitter.once('block', ({ number }) => {
        resolve(number)
      }),
    )
    await nextBlock()
    blockEmitter.check()
    const processedBlockNum = await promise
    const blockNum = await provider.getBlockNumber()
    expect(processedBlockNum).toEqual(blockNum)
  })
})
