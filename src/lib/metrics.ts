import client from 'prom-client'

export const register = new client.Registry()

export const createCounter = <T extends string>(config: client.CounterConfiguration<T>): client.Counter<T> => {
  const counter = new client.Counter<T>(config)
  register.registerMetric(counter)

  return counter
}
