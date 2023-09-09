import * as dotenv from 'dotenv'
import axios, { AxiosInstance } from 'axios'

const proxyHost: any = process.env.PROXY_HOST
const proxyPort = Number(process.env.PROXY_PORT)
const proxyAuth = process.env.PROXY_USER + ':' + process.env.PROXY_PASS

dotenv.config()

export class Bling {
  private token: string
  private client: AxiosInstance

  constructor(token: string) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    this.token = token
    this.client = axios.create({
      baseURL: 'https://bling.com.br/Api/v2/',
      params: {
        apikey: token,
      },

      proxy: {
        host: proxyHost,
        port: proxyPort,
        protocol: 'https',
      },
      headers: {
        'Proxy-Authorization':
          'Basic ' + Buffer.from(proxyAuth).toString('base64'),
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        Pragma: 'no-cache',
      },
    })

    this.client.interceptors.response.use(
      (response) => {
        // Retorne a resposta normalmente se a requisição for bem-sucedida
        return response
      },
      async (error: any) => {
        if (
          error.response?.status === 403 ||
          error.response?.status === 503 ||
          error.response?.status === 429 ||
          error.response?.status === 500 ||
          !error.response?.status
        ) {
          return this.client.request(error.config)
        }
        if (error?.response?.status === 401) {
          if (error.response?.data?.retorno?.errors?.erro?.cod === 3) {
            return { error: 'API Key Inválida', code: 401 }
          }
        }
        return Promise.reject(error)
      },
    )
  }
}
