export interface AppConfig {
  rpcUrl: string
  wsRpcUrl: string
  privateKey: string
  bzzAddress: string
}

export interface ServerConfig {
  hostname: string
  port: number
}

export interface FundingConfig {
  bzzAmount: bigint
  nativeAmount: bigint
}

export type EnvironmentVariables = Partial<{
  // Logging
  LOG_LEVEL: string

  // Ethereum
  RPC_URL: string
  WS_RPC_URL: string
  PRIVATE_KEY: string

  // Server
  PORT: string
  HOSTNAME: string

  // BZZ
  BZZ_ADDRESS: string

  // Funding
  FUND_BZZ_AMOUNT: string
  FUND_NATIVE_AMOUNT: string
}>

export const SUPPORTED_LEVELS = ['critical', 'error', 'warn', 'info', 'verbose', 'debug'] as const
export type SupportedLevels = typeof SUPPORTED_LEVELS[number]

export const DEFAULT_LOG_LEVEL = 'info'
export const DEFAULT_RPC_URL = 'https://rpc.gnosischain.com'
export const DEFAULT_WS_RPC_URL = 'wss://rpc.gnosischain.com/wss'
export const DEFAULT_HOSTNAME = 'localhost'
export const DEFAULT_PORT = 3000

export const DEFAULT_BZZ_ADDRESS = '0xdBF3Ea6F5beE45c02255B2c26a16F300502F68da'

export const logLevel =
  process.env.LOG_LEVEL && SUPPORTED_LEVELS.includes(process.env.LOG_LEVEL as SupportedLevels)
    ? process.env.LOG_LEVEL
    : DEFAULT_LOG_LEVEL

export function getAppConfig({ RPC_URL, PRIVATE_KEY, WS_RPC_URL, BZZ_ADDRESS }: EnvironmentVariables = {}): AppConfig {
  if (!PRIVATE_KEY) {
    throw new Error('config: please specify the PRIVATE_KEY to use')
  }

  return {
    rpcUrl: RPC_URL || DEFAULT_RPC_URL,
    wsRpcUrl: WS_RPC_URL || DEFAULT_WS_RPC_URL,
    privateKey: PRIVATE_KEY,
    bzzAddress: BZZ_ADDRESS || DEFAULT_BZZ_ADDRESS,
  }
}

export function getServerConfig({ PORT, HOSTNAME }: EnvironmentVariables = {}): ServerConfig {
  return { hostname: HOSTNAME || DEFAULT_HOSTNAME, port: Number(PORT || DEFAULT_PORT) }
}

export function getFundingConfig({ FUND_BZZ_AMOUNT, FUND_NATIVE_AMOUNT }: EnvironmentVariables = {}): FundingConfig {
  return {
    bzzAmount: BigInt(FUND_BZZ_AMOUNT || '0'),
    nativeAmount: BigInt(FUND_NATIVE_AMOUNT || '0'),
  }
}
