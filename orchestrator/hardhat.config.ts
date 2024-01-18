import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-ethers'

const FDP_PLAY_URL = process.env.FDP_PLAY_URL || 'http://localhost:9545'

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    fdpPlay: {
      url: 'http://localhost:9545',
      chainId: 4020,
      gasPrice: 10000000000, //10 gwei
      accounts: ['0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'],
    },
  },
  etherscan: {
    apiKey: {
      fdpPlay: 'hello_there!',
    },
    customChains: [
      {
        network: 'fdpPlay',
        chainId: 4020,
        urls: {
          apiURL: `${FDP_PLAY_URL}/api`,
          browserURL: `${FDP_PLAY_URL}`,
        },
      },
    ],
  },
}

export default config
