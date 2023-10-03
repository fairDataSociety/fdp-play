/* eslint-disable no-console */
const ERC20PresetMinterPauser = artifacts.require('ERC20PresetMinterPauser')
const FS = require('fs')
const Path = require('path')
const { saveContractAddresses } = require('../src/utils')

const NETWORK_ID = 4020

function prefixedAddressParamToByteCode(address) {
  // the first 2 chars removal removes 0x prefix
  return address.substring(2).toLowerCase().padStart(64, '0')
}

function intToByteCode(intParam) {
  return Number(intParam).toString(16).padStart(64, '0')
}

function getSimpleSwapFactoryBin(tokenAddress) {
  const binPath = Path.join(__dirname, '..', 'contracts', 'SimpleSwapFactory.bytecode')
  const bin = FS.readFileSync(binPath, 'utf8').toString()
  tokenAddress = prefixedAddressParamToByteCode(tokenAddress)

  //add tokenaddress for param to the end of the bytecode
  return bin + tokenAddress
}

function getPostageStampBin(tokenAddress, adminAddress, minimumBucketDepth = 16) {
  const binPath = Path.join(__dirname, '..', 'contracts', 'PostageStamp.bytecode')
  const bin = FS.readFileSync(binPath, 'utf8').toString()
  tokenAddress = prefixedAddressParamToByteCode(tokenAddress)
  adminAddress = prefixedAddressParamToByteCode(adminAddress)
  minimumBucketDepth = intToByteCode(minimumBucketDepth)

  //add tokenaddress for param to the end of the bytecode
  return bin + tokenAddress + minimumBucketDepth + adminAddress
}

function getPostagePriceOracleBin(tokenAddress, adminAddress) {
  const binPath = Path.join(__dirname, '..', 'contracts', 'PostagePriceOracle.bytecode')
  const bin = FS.readFileSync(binPath, 'utf8').toString().trim()
  tokenAddress = prefixedAddressParamToByteCode(tokenAddress)
  adminAddress = prefixedAddressParamToByteCode(adminAddress)

  //add tokenaddress for param to the end of the bytecode
  return bin + tokenAddress + adminAddress
}

function getSwapPriceOracleBin(price, chequeValueDeduction) {
  const binPath = Path.join(__dirname, '..', 'contracts', 'SwapPriceOracle.bytecode')
  const bin = FS.readFileSync(binPath, 'utf8').toString().trim()
  const priceAbi = intToByteCode(price)
  const chequeValueAbi = intToByteCode(chequeValueDeduction)

  //add tokenaddress for param to the end of the bytecode
  return bin + priceAbi + chequeValueAbi
}

function getStakeRegistryBin(tokenAddress, adminAddress) {
  const binPath = Path.join(__dirname, '..', 'contracts', 'StakeRegistry.bytecode')
  const bin = FS.readFileSync(binPath, 'utf8').toString().trim()
  tokenAddress = prefixedAddressParamToByteCode(tokenAddress)
  adminAddress = prefixedAddressParamToByteCode(adminAddress)
  const networkIdAbi = intToByteCode(NETWORK_ID)

  //add tokenaddress and encoded network ID for param to the end of the bytecode
  return bin + tokenAddress + networkIdAbi + adminAddress
}

function getRedistributionBin(stakingAddress, postageContractAddress, oracleContractAddress, adminAddress) {
  const binPath = Path.join(__dirname, '..', 'contracts', 'Redistribution.bytecode')
  const bin = FS.readFileSync(binPath, 'utf8').toString().trim()
  stakingAddress = prefixedAddressParamToByteCode(stakingAddress)
  postageContractAddress = prefixedAddressParamToByteCode(postageContractAddress)
  oracleContractAddress = prefixedAddressParamToByteCode(oracleContractAddress)
  adminAddress = prefixedAddressParamToByteCode(adminAddress)

  //add staking address, postage address and oracle contract address for param to the end of the bytecode
  return bin + stakingAddress + postageContractAddress + oracleContractAddress + adminAddress
}

/** Returns back contract hash */
async function createContract(contractName, data, creatorAccount) {
  const transaction = await web3.eth.sendTransaction({
    data: data,
    gasLimit: 6721975,
    gasPrice: web3.utils.toWei('10', 'gwei'),
    from: creatorAccount,
  })

  if (!transaction.status) {
    console.error(`${contractName} contract creation Error`, error)
    throw new Error(`Error happened at creating ${contractName} contract creation`)
  }
  console.log(
    `${contractName} contract creation was successful!\n` +
      `\tTransaction ID: ${transaction.transactionHash}\n` +
      `\tContract ID: ${transaction.contractAddress}`,
  )

  return transaction.contractAddress
}

/**
 *
 * @param {string} creatorAccount
 * @param {number} price current price in PLUR per accounting unit
 * @param {number} chequeValueDeduction value deducted from first received cheque from a peer in PLUR
 */
async function createSwapPriceOracleContract(creatorAccount, price = 100000, chequeValueDeduction = 100) {
  return createContract('SwapPriceOracle', getSwapPriceOracleBin(price, chequeValueDeduction), creatorAccount)
}

async function createPostagePriceOracleContract(creatorAccount, erc20ContractAddress) {
  return createContract('PostagePriceOracle', getPostagePriceOracleBin(erc20ContractAddress, creatorAccount), creatorAccount)
}

async function createSimpleSwapFactoryContract(creatorAccount, erc20ContractAddress) {
  return createContract('SimpleSwapFactory', getSimpleSwapFactoryBin(erc20ContractAddress), creatorAccount)
}

async function createPostageStampContract(creatorAccount, erc20ContractAddress) {
  return createContract('PostageStamp', getPostageStampBin(erc20ContractAddress, creatorAccount), creatorAccount)
}

async function createStakeRegistryContract(creatorAccount, erc20ContractAddress) {
  return createContract('StakeRegistry', getStakeRegistryBin(erc20ContractAddress, creatorAccount), creatorAccount)
}

async function createRedistributionContract(
  creatorAccount,
  stakeRegistryAddress,
  postageStampAddress,
  postagePriceOracleAddress,
) {
  return createContract(
    'Redistribution',
    getRedistributionBin(stakeRegistryAddress, postageStampAddress, postagePriceOracleAddress, creatorAccount),
    creatorAccount,
  )
}

module.exports = function (deployer, network, accounts) {
  deployer.deploy(ERC20PresetMinterPauser, 'Swarm Token', 'BZZ').then(async () => {
    const creatorAccount = accounts[0]
    const erc20Address = ERC20PresetMinterPauser.address
    const swapPriceOracleAddress = await createSwapPriceOracleContract(creatorAccount)
    const swapFactoryAddress = await createSimpleSwapFactoryContract(creatorAccount, erc20Address)
    const postageStampAddress = await createPostageStampContract(creatorAccount, erc20Address)
    const postagePriceOracleAddress = await createPostagePriceOracleContract(creatorAccount, erc20Address)
    const stakeRegistryAddress = await createStakeRegistryContract(creatorAccount, erc20Address)
    const redistributionAddress = await createRedistributionContract(
      creatorAccount,
      stakeRegistryAddress,
      postageStampAddress,
      postagePriceOracleAddress,
    )

    saveContractAddresses({
      bzzToken: erc20Address,
      swapPriceOrcale: swapPriceOracleAddress,
      swapFactory: swapFactoryAddress,
      postage: postageStampAddress,
      postagePriceOracle: postagePriceOracleAddress,
      stakeRegistry: stakeRegistryAddress,
      redistribution: redistributionAddress,
    })
  })
}
