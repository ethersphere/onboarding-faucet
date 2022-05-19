# onboarding-faucet

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fethersphere%2Fonboarding-faucet.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fethersphere%2Fonboarding-faucet?ref=badge_shield)
[![](https://img.shields.io/badge/made%20by-Swarm-blue.svg?style=flat-square)](https://swarm.ethereum.org/)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D6.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D12.0.0-orange.svg?style=flat-square)

This faucet aims to create transactions that can be used for the overlay address verification of
[bee](https://github.com/ethersphere/bee) nodes.

## Install

```sh
git clone https://github.com/ethersphere/onboarding-faucet.git
cd onboarding-faucet
```

## Usage

### Example

#### No funding

```sh
export PRIVATE_KEY=...

npm run start
```

#### Funding

```sh
export PRIVATE_KEY=...
export FUND_BZZ_AMOUNT=1000000000000000 # 0.1 BZZ
export FUND_NATIVE_AMOUNT=10000000000000000 # 0.01 ETH

npm run start
```

### Environment variables

| Name               | Default Value                                | Description                                                                                                |
| ------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| LOG_LEVEL          | `info`                                       | Log level (`critical`, `error`, `warn`, `info`, `verbose`, `debug`).                                       |
| RPC_URL            | `https://rpc.gnosischain.com`                | URL of the RPC provider.                                                                                   |
| WS_RPC_URL         | `wss://rpc.gnosischain.com/wss`              | URL of the WebSocket RPC provider.                                                                         |
| PRIVATE_KEY        | `undefined`                                  | Private key used to create transactions and send tokens.                                                   |
| PORT               | `3000`                                       | Port used by the faucet's http server.                                                                     |
| HOSTNAME           | `localhost`                                  | Hostname on which the faucet's http server listens to.                                                     |
| BZZ_ADDRESS        | `0xdBF3Ea6F5beE45c02255B2c26a16F300502F68da` | Address of the BZZ contract.                                                                               |
| FUND_BZZ_AMOUNT    | `0`                                          | Amount of BZZ to send on the funding route.                                                                |
| FUND_NATIVE_AMOUNT | `0`                                          | Amount of native tokens (`ETH`, `xDAI`) to send on the funding route.                                      |
| AUTH_TOKEN         | `undefined`                                  | Authentication secret, disabled if not set (this secret is checked in the request header `authorization`). |

## API

| Endpoint                            | Response code | Response text                                                                                             |
| ----------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| `POST /faucet/overlay/:address`     | `200`         | `{ blockHash: 'string', transactionHash: 'string', nextBlockHash: 'string', nextBlockHashBee: 'string' }` |
|                                     | `400`         | `{ error: 'invalid address' }`                                                                            |
|                                     | `500`         | `Internal Server Error`                                                                                   |
| `POST /faucet/fund/bzz/:address`    | `200`         | `require("@ethersproject/abstract-provider").TransactionReceipt`                                          |
|                                     | `400`         | `{ error: 'invalid address' }`                                                                            |
|                                     | `500`         | `Internal Server Error`                                                                                   |
|                                     | `503`         | `{ error: 'amount not configured' }`                                                                      |
| `POST /faucet/fund/native/:address` | `200`         | `require("@ethersproject/abstract-provider").TransactionReceipt`                                          |
|                                     | `400`         | `{ error: 'invalid address' }`                                                                            |
|                                     | `500`         | `Internal Server Error`                                                                                   |
|                                     | `503`         | `{ error: 'amount not configured' }`                                                                      |

## Contribute

There are some ways you can make this module better:

- Consult our [open issues](https://github.com/ethersphere/onboarding-faucet/issues) and take on one of them
- Join us in our [Discord chat](https://discord.gg/wdghaQsGq5) in the #develop-on-swarm channel if you have questions or
  want to give feedback

## Maintainers

- [filoozom](https://github.com/filoozom)
- [Cafe137](https://github.com/Cafe137)

## License

[BSD-3-Clause](./LICENSE)

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fethersphere%2Fonboarding-faucet.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fethersphere%2Fonboarding-faucet?ref=badge_large)
