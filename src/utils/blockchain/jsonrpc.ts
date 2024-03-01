import http from 'http'

interface RpcRequest {
  id: number
  method: string
  params?: unknown[]
  // default is 2.0
  jsonrpc?: string
}

interface RpcResponse {
  id: number
  // default is 2.0
  jsonrpc: string
  result?: unknown
  error?: {
    code: number
    message: string
  }
}

function getHost(addr: string): string {
  addr = addr.startsWith('http://') ? addr.slice('http://'.length) : addr

  return addr.includes(':') ? addr.slice(0, addr.indexOf(':')) : addr
}

function getPort(addr: string): number {
  let port = 80

  if (addr.includes('http://')) addr = addr.slice(addr.indexOf('/') + 2)
  else if (addr.includes('https://')) {
    addr = addr.slice(addr.indexOf('/') + 2)
    port = 443
  }

  if (addr.includes(':')) port = Number(addr.slice(addr.indexOf(':') + 1))

  if (Number.isNaN(port)) throw new Error('port number is wrong in rpc address')

  return port
}

export class JsonRpc {
  constructor(private rpcAddress: string) {}

  public async post(payload: RpcRequest, path = '/'): Promise<RpcResponse> {
    payload.jsonrpc ||= '2.0'

    return new Promise<RpcResponse>((resolve, reject) => {
      const stringifiedPayload = JSON.stringify(payload)
      const req = http.request(
        {
          host: getHost(this.rpcAddress),
          port: getPort(this.rpcAddress),
          method: 'POST',
          path,
          headers: {
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(stringifiedPayload),
          },
        },
        res => {
          let data = ''

          // A chunk of data has been received.
          res.on('data', chunk => {
            data += chunk
          })

          // The whole response has been received.
          res.on('end', () => {
            try {
              const jsonData = JSON.parse(data) as RpcResponse

              if (jsonData.error) {
                reject(`jsonrpc: ${jsonData.error.code} - ${jsonData.error.message}`)
              }

              if (!jsonData.result) {
                reject('jsonrpc: result is not defined')
              }
              resolve(jsonData)
            } catch (e) {
              throw new Error('jsonrpc: cannot parse data to json')
            }
          })
        },
      )

      // Handle errors
      req.on('error', error => {
        reject(error)
      })

      // Write the JSON data to the request
      req.write(stringifiedPayload)

      // End the request
      req.end()
    })
  }
}
