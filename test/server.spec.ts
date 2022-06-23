import { createApp } from '../src/server'
import { logger } from '../src/lib/logger'
import request from 'supertest'
import { mineBlock } from './utils'

const rpcUrl = process.env.RPC_URL ?? 'http://127.0.0.1:9545'
const privateKey = process.env.TEST_PRIVATE_KEY ?? '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
const bzzAddress = process.env.BZZ_ADDRESS ?? ''
const wrongRpcUrl = 'http://localhost:2021'

const app = createApp({ rpcUrl, privateKey, bzzAddress }, logger)
const appWrongRpcUrl = createApp({ rpcUrl: wrongRpcUrl, privateKey, bzzAddress }, logger)

afterAll(async () => {
  app.stop()
  appWrongRpcUrl.stop()
})

describe('GET /health', () => {
  it('should return 200 & OK', async () => {
    await mineBlock()
    const res = await request(app).get(`/health`).expect(200)

    expect(res.text).toEqual('OK')
  })

  it('should return 502 & Bad Gateway with wrong RPC URL', async () => {
    const res = await request(appWrongRpcUrl).get(`/health`).expect(502)

    expect(res.text).toEqual('Bad Gateway')
  })
})

describe('GET /readiness', () => {
  it('should return 200 & OK', async () => {
    await mineBlock()
    const res = await request(app).get(`/readiness`).expect(200)

    expect(res.text).toEqual('OK')
  })
})
