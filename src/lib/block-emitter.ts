import type { JsonRpcProvider } from '@ethersproject/providers'
import { TypedEmitter } from 'tiny-typed-emitter'

// Lib
import { sleep } from './utils'

type BlockEmitterEvents = {
  block: (block: { number: number; hash: string }) => void
}

export class BlockEmitter extends TypedEmitter<BlockEmitterEvents> {
  provider: JsonRpcProvider
  lastBlock = Infinity
  handlingBlocks = false
  // should be but it still fails to compile... ReturnType<typeof setInterval>
  interval?: any = null // eslint-disable-line

  constructor(provider: JsonRpcProvider) {
    super()
    this.provider = provider
  }

  async handleBlock(number: number): Promise<void> {
    const { hash } = await this.provider.getBlock(number)

    this.emit('block', {
      number,
      hash,
    })

    this.lastBlock = number
  }

  async handleBlocks(number: number): Promise<boolean> {
    if (this.handlingBlocks) {
      return number <= this.lastBlock
    }

    this.handlingBlocks = true

    // In case blocks were missed (due to RPC issues for example), this makes sure
    // that we always emit them in the right order and without missing any
    for (let current = this.lastBlock; current <= Math.max(number, this.lastBlock); current++) {
      await this.handleBlock(number)
    }

    this.handlingBlocks = false

    return true
  }

  async check() {
    let done
    const number = await this.provider.getBlockNumber()
    do {
      done = await this.handleBlocks(number)

      if (!done) {
        await sleep(100)
      }
    } while (!done && this.interval !== null)
  }

  start() {
    this.interval = setInterval(this.check, 5000) // TODO: this should be configurable
    this.check()
  }

  async stop() {
    clearInterval(this.interval)
    this.interval = null
  }
}
