#!/usr/bin/env node
import { createApp } from './server'
import { getAppConfig, getServerConfig, EnvironmentVariables } from './lib/config'
import { logger, subscribeLogServerRequests } from './lib/logger'

async function main() {
  // Configuration
  const appConfig = getAppConfig(process.env as EnvironmentVariables)
  const { hostname, port } = getServerConfig(process.env as EnvironmentVariables)

  logger.debug('app config', appConfig)
  logger.debug('server config', { hostname: hostname, port })
  logger.info('starting the app')
  const app = createApp(appConfig, logger)

  // Start the app
  const server = app.listen(port, () => {
    logger.info(`starting onboarding-faucet at ${hostname}:${port}`)
  })

  subscribeLogServerRequests(server)
}

main()
