import express, { Application } from 'express'
import type { Logger } from 'winston'
import { Wallet } from '@ethersproject/wallet'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'

// Lib
import { BlockEmitter } from './lib/block-emitter'
import { register } from './lib/metrics'

// Routes
import { createFaucetRoutes } from './routes/faucet'

// Types
import { AppConfig, EnvironmentVariables, getFundingConfig } from './lib/config'

// ABI
import abi from './data/abi.json'

interface AppliCationWithStop extends Application {
  stop: () => Promise<void>
}

export const createApp = (
  { rpcUrl, privateKey, bzzAddress }: AppConfig,
  logger: Logger,
  timeout = 30_000,
): AppliCationWithStop => {
  // Create Express Server
  const app = express()

  // Setup ethers wallet
  const provider = new JsonRpcProvider(rpcUrl)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wallet = new Wallet(privateKey, provider)
  const bzz = new Contract(bzzAddress, abi, wallet)

  // Block emitter
  const blockEmitter = new BlockEmitter(provider)
  blockEmitter.start()

  // Faucet route
  app.use(
    '/faucet',
    createFaucetRoutes({
      wallet,
      blockEmitter,
      logger,
      bzz,
      funding: getFundingConfig(process.env as EnvironmentVariables),
    }),
  )

  // Health, metrics, assets, default endpoints
  app.get('/health', async (_req, res) => {
    res.sendStatus(200)
  })

  app.get('/readiness', async (_req, res) => {
    try {
      await provider.getBlockNumber()
      res.sendStatus(200)
    } catch (err) {
      logger.error('readiness', err)
      res.sendStatus(502)
    }
  })

  app.get('/metrics', async (_req, res) => {
    res.write(await register.metrics())
    res.end()
  })

  app.use(express.static('public'))
  app.use((_req, res) => res.sendStatus(404))

  const newApp = app as unknown as AppliCationWithStop

  newApp.stop = async () => {
    await blockEmitter.stop()
  }

  return newApp
}
