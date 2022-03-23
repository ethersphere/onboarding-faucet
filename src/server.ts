import express, { Application } from 'express'
import type { AppConfig } from './config'
import { register } from './metrics'
import { createFaucetRoutes } from './faucet'
import { Wallet } from '@ethersproject/wallet'
import { JsonRpcProvider } from '@ethersproject/providers'

export const createApp = ({ rpcUrl, privateKey }: AppConfig): Application => {
  // Create Express Server
  const app = express()

  // Setup ethers wallet
  const provider = new JsonRpcProvider(rpcUrl)
  const wallet = new Wallet(privateKey, provider)

  // Faucet route
  app.use('/faucet', createFaucetRoutes({ wallet }))

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
