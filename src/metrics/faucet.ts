// Lib
import { createCounter } from '../lib/metrics'

export const overlayCreationCounter = createCounter({
  name: 'overlay_creation_counter',
  help: 'How many overlay transactions were sent out',
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
