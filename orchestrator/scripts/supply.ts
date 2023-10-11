/* eslint-disable no-console */
import { ethers } from 'hardhat'
import beeAddresses from '../bee-eth-addresses.json'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'

function getRawTokenAmount(amount: string, decimals = 18) {
  const amountBn = BigInt(amount)
  const rawAmount = amountBn * 10n ** BigInt(decimals)

  return rawAmount
}

/** Supply given address with Ether */
async function supplyEther(supplierAccount: HardhatEthersSigner, recepientAddress: string, etherAmount = '1') {
  try {
    const transaction = await supplierAccount.sendTransaction({
      gasLimit: 6721975,
      gasPrice: ethers.parseUnits('10', 'gwei'),
      value: ethers.parseUnits(etherAmount, 'ether'),
      from: supplierAccount,
      to: recepientAddress,
    })

    await transaction.wait()
    const receipt = await supplierAccount.provider.getTransactionReceipt(transaction.hash)

    if (!receipt) throw Error('No receipt')

    console.log(
      `Supplying address ${recepientAddress} with Ether from account ${supplierAccount.address} was successful! \n` +
        `\tGiven Ether Amount: ${etherAmount}\n` +
        `\tTransaction ID: ${transaction.hash}`,
    )
    console.log('-'.repeat(process.stdout.columns))
  } catch (e) {
    console.error('Supply Ether Error', e)
    throw new Error(`Error happened at supplying address ${recepientAddress} from account ${supplierAccount.address}`)
  }
}

/** Supply given address with the given Token amount */
async function mintToken(supplierAccount: HardhatEthersSigner, recepientAddress: string, tokenAmount = '100') {
  const instance = await ethers.getContractAt('ERC20PresetMinterPauser', supplierAccount)
  const rawTokenAmount = getRawTokenAmount(tokenAmount)
  try {
    const transaction = await instance.mint(recepientAddress, rawTokenAmount, {
      from: supplierAccount,
      gasLimit: 6721975,
    })

    console.log(
      `Supplying address ${recepientAddress} with Token from account ${supplierAccount.address} was successful! \n` +
        `\tGiven Token Amount: ${tokenAmount}\n` +
        `\tTransaction ID: ${transaction.hash}`,
    )
    console.log('-'.repeat(process.stdout.columns))
  } catch (e) {
    console.error('Supply Token Error', e)
    throw new Error(`Error happened at supplying address ${recepientAddress} from account ${supplierAccount.address}`)
  }
}

/** Supply ERC20 tokens to all configured Bee client overlay addresses */
async function supplyTokenForBees(supplierAccount: HardhatEthersSigner) {
  console.log(`Supply ERC20 tokens to the configured Bee addresses`)
  console.log('='.repeat(process.stdout.columns))

  for (const beeAddress of beeAddresses) {
    await mintToken(supplierAccount, beeAddress)
  }
}

/** Supply ether to all configured Bee client overlay addresses */
async function supplyEtherForBees(supplierAccount: HardhatEthersSigner) {
  console.log('Supply Ether to the configured Bee addresses')
  console.log('='.repeat(process.stdout.columns))

  for (const beeAddress of beeAddresses) {
    await supplyEther(supplierAccount, beeAddress)
  }
}

async function main() {
  const accounts = await ethers.getSigners()
  await supplyTokenForBees(accounts[0])
  await supplyEtherForBees(accounts[0])
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
