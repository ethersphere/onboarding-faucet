import express, { Application } from 'express'
import type { AppConfig } from './lib/config'
import type { Logger } from 'winston'
import { register } from './lib/metrics'
import { createFaucetRoutes } from './routes/faucet'
import { Wallet } from '@ethersproject/wallet'
import { JsonRpcProvider } from '@ethersproject/providers'
import { createBlockEmitter } from './lib/block-emitter'

export const createApp = ({ rpcUrl, wsRpcUrl, privateKey }: AppConfig, logger: Logger): Application => {
  // Create Express Server
  const app = express()

  // Setup ethers wallet
  const provider = new JsonRpcProvider(rpcUrl)
  const wallet = new Wallet(privateKey, provider)

  // Block emitter
  const blockEmitter = createBlockEmitter({ rpcUrl: wsRpcUrl })

  // Faucet route
  app.use('/faucet', createFaucetRoutes({ wallet, blockEmitter, logger }))

  // Health, metrics, assets, default endpoints
  app.get('/health', (_req, res) => res.send('OK'))
  app.get('/metrics', async (_req, res) => {
    res.write(await register.metrics())
    res.end()
  })
  app.use(express.static('public'))
  app.use((_req, res) => res.sendStatus(404))

  return app
}
