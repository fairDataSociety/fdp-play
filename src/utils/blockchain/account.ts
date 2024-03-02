import { BigNumber } from 'ethers'
import { JsonRpc } from './jsonrpc'

type ReqSendTransaction = {
  // optional when creating new contract
  to: string
  // in wei
  value: string | BigNumber
}

export class Account {
  // FIXME: create GitHub issue about this prettier problem
  // eslint-disable-next-line
  constructor(private signer: Signer, private rpcClient: JsonRpc) {}

  // returns back the hash of the transaction
  async sendTransaction(params: ReqSendTransaction): Promise<string> {
    const tx = await this.rpcClient.post({
      method: 'eth_sendTransaction',
      params: [
        {
          from: this.signer,
          to: params.to,
          value: params.value,
        },
      ],
      id: 2,
    })

    return tx.result as string
  }
}
