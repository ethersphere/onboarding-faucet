// Lib
import { createCounter } from '../lib/metrics'

export const overlayCreationCounter = createCounter({
  name: 'overlay_creation_counter',
  help: 'How many overlay transactions were sent out',
})

export const overlayCreationDesktopCallCounter = createCounter({
  name: 'overlay_creation_desktop_call_counter',
  help: 'How many overlay transactions endpoint was called from desktop',
})

export const overlayCreationFaucetWatchCallCounter = createCounter({
  name: 'overlay_creation_faucet_watch_call_counter',
  help: 'How many overlay transactions endpoint was called from faucet watch',
})

export const overlayCreationFailedCounter = createCounter({
  name: 'overlay_creation_failed_counter',
  help: 'How many overlay transactions failed',
})

export const tokenFundCounter = createCounter({
  name: 'token_fund_counter',
  help: 'How many times tokens were funded',
})

export const tokenFundFailedCounter = createCounter({
  name: 'token_fund_failed_counter',
  help: 'How many times token funds failed',
})

export const nativeFundCounter = createCounter({
  name: 'native_fund_counter',
  help: 'How many times the native currency was funded',
})

export const nativeFundFailedCounter = createCounter({
  name: 'native_fund_failed_counter',
  help: 'How many times native currency funds were failed',
})
