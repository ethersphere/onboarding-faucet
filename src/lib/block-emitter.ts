import type { JsonRpcProvider } from '@ethersproject/providers'
import { TypedEmitter } from 'tiny-typed-emitter'
import { logger } from './logger'
import { Semaphore } from './semaphore'

type BlockEmitterEvents = {
  block: (block: { number: number; hash: string }) => void
}

export class BlockEmitter extends TypedEmitter<BlockEmitterEvents> {
  provider: JsonRpcProvider
  lastProcessedBlock: number | null = null
  semaphore = new Semaphore('block emitter', 1)
  // should be but it still fails to compile... ReturnType<typeof setInterval>
  interval?: any = null // eslint-disable-line

  constructor(provider: JsonRpcProvider) {
    super()
    this.provider = provider
  }

  async handleBlock(blockNumber: number): Promise<void> {
    const { hash } = await this.provider.getBlock(blockNumber)

    this.emit('block', {
      number: blockNumber,
      hash,
    })
    logger.debug(`emitted new block ${blockNumber}`)

    this.lastProcessedBlock = blockNumber
  }

  async handleBlocks(blockNumber: number): Promise<void> {
    // We have not processed any block yet, lets just start from current one
    if (this.lastProcessedBlock === null) {
      this.lastProcessedBlock = blockNumber - 1
    }
    logger.debug(`checking blocks ${this.lastProcessedBlock + 1} - ${blockNumber}`)

    // In case blocks were missed (due to RPC issues for example), this makes sure
    // that we always emit them in the right order and without missing any
    for (let current = this.lastProcessedBlock + 1; current <= blockNumber; current++) {
      await this.handleBlock(current)
    }
  }

  async check() {
    const lock = await this.semaphore.acquire()
    try {
      const number = await this.provider.getBlockNumber()
      await this.handleBlocks(number)
    } catch (error) {
      logger.error('failed to check blocks')
    }
    lock.release()
  }

  start() {
    this.interval = setInterval(this.check.bind(this), 5000) // TODO: this should be configurable
    this.check()
  }

  async stop() {
    clearInterval(this.interval)
    this.interval = null
  }
}
