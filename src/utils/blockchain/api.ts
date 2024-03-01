import { Account } from './account'
import { JsonRpc } from './jsonrpc'

export class BlockchainApi {
  private rpcClient: JsonRpc
  constructor(rpcAddress: string) {
    this.rpcClient = new JsonRpc(rpcAddress)
  }

  public async chainId(): Promise<number> {
    const balance = await this.rpcClient.post({
      method: 'eth_chainId',
      id: 0,
    })

    return parseInt(balance.result as string, 16)
  }

  /**
   * @param address wallet address
   * @returns balance in wei
   */
  public async getBalance(address: string): Promise<string> {
    const balance = await this.rpcClient.post({
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1,
    })

    return balance.result as string
  }

  public getSigner(signer: Signer): Account {
    return new Account(signer, this.rpcClient)
  }
}
