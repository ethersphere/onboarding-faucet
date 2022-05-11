import express, { Application } from 'express'
import type { Logger } from 'winston'
import { Wallet } from '@ethersproject/wallet'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'

// Lib
import { createBlockEmitter } from './lib/block-emitter'
import { register } from './lib/metrics'

// Routes
import { createFaucetRoutes } from './routes/faucet'

// Types
import { AppConfig, EnvironmentVariables, getFundingConfig } from './lib/config'

// ABI
import abi from './data/abi.json'

export const createApp = ({ rpcUrl, wsRpcUrl, privateKey, bzzAddress }: AppConfig, logger: Logger): Application => {
  // Create Express Server
  const app = express()

  // Setup ethers wallet
  const provider = new JsonRpcProvider({ url: rpcUrl, timeout: 1000 })
  const wallet = new Wallet(privateKey, provider)
  const bzz = new Contract(bzzAddress, abi, wallet)

  // Block emitter
  const blockEmitter = createBlockEmitter({ rpcUrl: wsRpcUrl })

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
    try {
      await provider.getBlockNumber()
      res.sendStatus(200)
    } catch (err) {
      logger.error('health', err)
      res.sendStatus(500)
    }
  })

  app.get('/metrics', async (_req, res) => {
    res.write(await register.metrics())
    res.end()
  })

  app.use(express.static('public'))
  app.use((_req, res) => res.sendStatus(404))

  return app
}
