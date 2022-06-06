import { fundAddressWithNative } from '../../src/routes/faucet'
import { wallets } from '../utils'

describe('fundAddressWithNative', () => {
  it('should send token to a correct address', async () => {
    const sender = wallets[8]
    const recipient = wallets[9]
    const amount = 100000n

    const recipientInitialBalance = await recipient.getBalance()
    const senderInitialBalance = await sender.getBalance()

    await fundAddressWithNative(sender, recipient.address, amount)

    const recipientFinalBalance = await recipient.getBalance()
    const senderFinalBalance = await sender.getBalance()

    expect(recipientFinalBalance.toBigInt()).toEqual(recipientInitialBalance.add(amount).toBigInt())
    expect(senderFinalBalance.toBigInt()).toBeLessThan(senderInitialBalance.sub(amount).toBigInt())
  })
})
