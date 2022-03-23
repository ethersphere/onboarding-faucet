export interface AppConfig {
  rpcUrl: string
  privateKey: string
}

export interface ServerConfig {
  hostname: string
  port: number
}

export type EnvironmentVariables = Partial<{
  // Logging
  LOG_LEVEL: string

  // Ethereum
  RPC_URL: string
  PRIVATE_KEY: string

  // Server
  PORT: string
  HOSTNAME: string
}>

export const SUPPORTED_LEVELS = ['critical', 'error', 'warn', 'info', 'verbose', 'debug'] as const
export type SupportedLevels = typeof SUPPORTED_LEVELS[number]

export const DEFAULT_LOG_LEVEL = 'info'
export const DEFAULT_RPC_URL = 'https://rpc.gnosischain.com/'
export const DEFAULT_HOSTNAME = 'localhost'
export const DEFAULT_PORT = 3000

export const logLevel =
  process.env.LOG_LEVEL && SUPPORTED_LEVELS.includes(process.env.LOG_LEVEL as SupportedLevels)
    ? process.env.LOG_LEVEL
    : DEFAULT_LOG_LEVEL

export function getAppConfig({ RPC_URL, PRIVATE_KEY }: EnvironmentVariables = {}): AppConfig {
  if (!PRIVATE_KEY) {
    throw new Error('config: please specify the PRIVATE_KEY to use')
  }

  return {
    rpcUrl: RPC_URL || DEFAULT_RPC_URL,
    privateKey: PRIVATE_KEY,
  }
}

export function getServerConfig({ PORT, HOSTNAME }: EnvironmentVariables = {}): ServerConfig {
  return { hostname: HOSTNAME || DEFAULT_HOSTNAME, port: Number(PORT || DEFAULT_PORT) }
}
