/* eslint-disable no-console */
import FS from 'fs'
import Path from 'path'
import { ethers } from 'hardhat'
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'

const contractAddressesPath = Path.join(__dirname, '..', 'contract-addresses.json')
const NETWORK_ID = 4020

function saveContractAddresses(jsonData: unknown) {
  FS.writeFileSync(contractAddressesPath, JSON.stringify(jsonData, null, 2))
}

function prefixedAddressParamToByteCode(address: string) {
  // the first 2 chars removal removes 0x prefix
  return address.substring(2).toLowerCase().padStart(64, '0')
}

function intToByteCode(intParam: number) {
  return intParam.toString(16).padStart(64, '0')
}

function getSimpleSwapFactoryBin(tokenAddress: string) {
  const binPath = Path.join(__dirname, '..', 'contracts', 'SimpleSwapFactory.bytecode')
  const bin = FS.readFileSync(binPath, 'utf8').toString()
  tokenAddress = prefixedAddressParamToByteCode(tokenAddress)

  //add tokenaddress for param to the end of the bytecode
  return bin + tokenAddress
}

function getPostageStampBin(tokenAddress: string, adminAddress: string, minimumBucketDepth = 16) {
  const binPath = Path.join(__dirname, '..', 'contracts', 'PostageStamp.bytecode')
  const bin = FS.readFileSync(binPath, 'utf8').toString()
  tokenAddress = prefixedAddressParamToByteCode(tokenAddress)
  adminAddress = prefixedAddressParamToByteCode(adminAddress)
  const minimumBucketDepthParam = intToByteCode(minimumBucketDepth)

  //add tokenaddress for param to the end of the bytecode
  return bin + tokenAddress + minimumBucketDepthParam + adminAddress
}

function getPostagePriceOracleBin(tokenAddress: string, adminAddress: string) {
  const binPath = Path.join(__dirname, '..', 'contracts', 'PostagePriceOracle.bytecode')
  const bin = FS.readFileSync(binPath, 'utf8').toString().trim()
  tokenAddress = prefixedAddressParamToByteCode(tokenAddress)
  adminAddress = prefixedAddressParamToByteCode(adminAddress)

  //add tokenaddress for param to the end of the bytecode
  return bin + tokenAddress + adminAddress
}

function getSwapPriceOracleBin(price: number, chequeValueDeduction: number) {
  const binPath = Path.join(__dirname, '..', 'contracts', 'SwapPriceOracle.bytecode')
  const bin = FS.readFileSync(binPath, 'utf8').toString().trim()
  const priceAbi = intToByteCode(price)
  const chequeValueAbi = intToByteCode(chequeValueDeduction)

  //add tokenaddress for param to the end of the bytecode
  return bin + priceAbi + chequeValueAbi
}

function getStakeRegistryBin(tokenAddress: string, adminAddress: string) {
  const binPath = Path.join(__dirname, '..', 'contracts', 'StakeRegistry.bytecode')
  const bin = FS.readFileSync(binPath, 'utf8').toString().trim()
  tokenAddress = prefixedAddressParamToByteCode(tokenAddress)
  adminAddress = prefixedAddressParamToByteCode(adminAddress)
  const networkIdAbi = intToByteCode(NETWORK_ID)

  //add tokenaddress and encoded network ID for param to the end of the bytecode
  return bin + tokenAddress + networkIdAbi + adminAddress
}

function getRedistributionBin(
  stakingAddress: string,
  postageContractAddress: string,
  oracleContractAddress: string,
  adminAddress: string,
) {
  const binPath = Path.join(__dirname, '..', 'contracts', 'Redistribution.bytecode')
  const bin = FS.readFileSync(binPath, 'utf8').toString().trim()
  stakingAddress = prefixedAddressParamToByteCode(stakingAddress)
  postageContractAddress = prefixedAddressParamToByteCode(postageContractAddress)
  oracleContractAddress = prefixedAddressParamToByteCode(oracleContractAddress)
  adminAddress = prefixedAddressParamToByteCode(adminAddress)

  //add staking address, postage address and oracle contract address for param to the end of the bytecode
  return bin + stakingAddress + postageContractAddress + oracleContractAddress + adminAddress
}

function printContractAddress(contractName: string, contractAddress: string, txAddress: string) {
  console.log(
    `${contractName} contract creation was successful!\n` +
      `\tTransaction ID: ${txAddress}\n` +
      `\tContract ID: ${contractAddress}`,
  )
}

/** Returns back contract hash */
async function createContract(
  contractName: string,
  data: string,
  creatorAccount: HardhatEthersSigner,
): Promise<string> {
  try {
    const transaction = await creatorAccount.sendTransaction({
      data,
      gasLimit: 6721975,
      gasPrice: ethers.parseUnits('10', 'gwei'),
      from: creatorAccount,
    })
    await transaction.wait()
    const receipt = await creatorAccount.provider.getTransactionReceipt(transaction.hash)

    if (!receipt || !receipt.contractAddress) throw Error('No receipt')

    printContractAddress(contractName, receipt.contractAddress, receipt.hash)

    return receipt.contractAddress
  } catch (e) {
    console.error(`${contractName} contract creation Error`, e)
    throw new Error(`Error happened at creating ${contractName} contract creation`)
  }
}

/**
 *
 * @param creatorAccount
 * @param price current price in PLUR per accounting unit
 * @param chequeValueDeduction value deducted from first received cheque from a peer in PLUR
 */
async function createSwapPriceOracleContract(
  creatorAccount: HardhatEthersSigner,
  price = 100000,
  chequeValueDeduction = 100,
) {
  return createContract('SwapPriceOracle', getSwapPriceOracleBin(price, chequeValueDeduction), creatorAccount)
}

async function createPostagePriceOracleContract(creatorAccount: HardhatEthersSigner, erc20ContractAddress: string) {
  return createContract(
    'PostagePriceOracle',
    getPostagePriceOracleBin(erc20ContractAddress, creatorAccount.address),
    creatorAccount,
  )
}

async function createSimpleSwapFactoryContract(creatorAccount: HardhatEthersSigner, erc20ContractAddress: string) {
  return createContract('SimpleSwapFactory', getSimpleSwapFactoryBin(erc20ContractAddress), creatorAccount)
}

async function createPostageStampContract(creatorAccount: HardhatEthersSigner, erc20ContractAddress: string) {
  return createContract(
    'PostageStamp',
    getPostageStampBin(erc20ContractAddress, creatorAccount.address),
    creatorAccount,
  )
}

async function createStakeRegistryContract(creatorAccount: HardhatEthersSigner, erc20ContractAddress: string) {
  return createContract(
    'StakeRegistry',
    getStakeRegistryBin(erc20ContractAddress, creatorAccount.address),
    creatorAccount,
  )
}

async function createRedistributionContract(
  creatorAccount: HardhatEthersSigner,
  stakeRegistryAddress: string,
  postageStampAddress: string,
  postagePriceOracleAddress: string,
) {
  return createContract(
    'Redistribution',
    getRedistributionBin(stakeRegistryAddress, postageStampAddress, postagePriceOracleAddress, creatorAccount.address),
    creatorAccount,
  )
}

async function main() {
  const accounts = await ethers.getSigners()
  const creatorAccount = accounts[0]
  const erc20Token = await ethers.deployContract('ERC20PresetMinterPauser', ['Swarm Token', 'BZZ'])
  await erc20Token.waitForDeployment()
  const erc20Address = erc20Token.target.toString()
  printContractAddress('ERC20Token', erc20Address, erc20Token.deploymentTransaction()!.hash)

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
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
