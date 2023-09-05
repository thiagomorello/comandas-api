import * as dotenv from 'dotenv'
import axios, { AxiosInstance } from 'axios'
import * as xmljs from 'xml-js'

import rateLimit from 'axios-rate-limit'
import { IProduct } from 'bling-erp-api/lib/entities/products'

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

  async createProduct({ product }: any) {
    const plusImgs = product.plusimgs.split(',')
    const imgs = [product.img, ...plusImgs]

    const rimgs = imgs.map((img: any) => {
      return 'https://app.wedropbr.com.br/img/1000x1000/13/' + img
    })

    const blingProduct: any = {
      produto: {
        codigo: product.sku,
        descricao: product.name,
        vlr_unit: product.price,
        condicao: 'Novo',
        peso_bruto: product.weight,
        peso_liq: product.weight,
        altura: product.height,
        largura: product.width,
        profundidade: product.length,
        class_fiscal: product.ncm,
        gtin: product.ean,
        imagens: {
          url: rimgs,
        },
        producao: 'T',
        unidadeMedida: 'Centimetros',
        itensPorCaixa: 1,
        estoque: product.stock,
        marca: product.brand,
        gtinEmbalagem: product.ean,
        descricaoCurta: product.description,
        freteGratis: 'N',
        garantia: 0,
        preco_custo: product.price,
        un: 'un',
        origem: '0',
        tipo: 'P',
      },
    }

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>` +
      xmljs.js2xml(blingProduct, { compact: true, spaces: 1 })

    const params = {
      xml: String(xml) as string,
      apikey: this.token as string,
    }

    const createdProduct = await this.client
      .postForm('/produto/json', params)
      .then((response: any) => {
        return response.data
      })
    return createdProduct
  }

  async createOrderOnWeDropBling({ data }: any) {
    const order = {
      pedido: {
        loja: process.env.WEDROP_BLING_STORE_ID,
        cliente: {
          nome:
            data.integration.mode === 'J'
              ? data.integration.seller_info.razao
              : data.integration.seller_info.nome,
          nat_operacao: 'Venda de Mercadorias',
          contribuinte: data.integration.seller_info?.contribuinte
            ? data.integration.seller_info?.contribuinte
            : 9,
          tipoPessoa: data.integration.mode,
          endereco: data.integration.seller_info.rua,
          cpf_cnpj:
            data.integration.mode === 'J'
              ? data.integration.seller_info.cnpj
              : data.integration.seller_info.cpf,
          ie: data.integration.seller_info?.ie,
          numero: data.integration.seller_info.num,
          complemento: data.integration.seller_info.complemento,
          bairro: data.integration.seller_info.bairro,
          cep: data.integration.seller_info.cep,
          cidade: data.integration.seller_info.cidade,
          uf: data.integration.seller_info.estado,
          email: data.user.email,
        },
        itens: data.products.map((product: any) => {
          const price: number =
            Number(product.product.price) - Number(product.product.price) * 0.5
          return {
            item: {
              codigo: product.product.sku,
              descricao: product.product.name,
              qtde: product.qtd,
              un: 'un',
              vlr_unit: price.toFixed(2),
            },
          }
        }),
        vlr_frete: 0,
        vlr_desconto: 0,
        obs: `Pedido criado pelo WeDrop - Código do Pedido: ${data.order.id} - Código do Cliente: ${data.order.user_id}`,
      },
    }

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>` +
      xmljs.js2xml(order, { compact: true, spaces: 1 })
    if (data.integration.mode === 'J') {
      const params = {
        xml: String(xml) as string,
        apikey: this.token as string,
        gerarnfe: 'true',
      }
      const updatedOrder = await this.client
        .postForm('/pedido/json', params)
        .then((blingResponse: any) => {
          const xmlSituacao =
            `<?xml version="1.0" encoding="UTF-8"?>` +
            xmljs.js2xml(
              {
                pedido: {
                  idSituacao: 9,
                },
              },
              { compact: true, spaces: 1 },
            )

          if (blingResponse.data.retorno.erros) {
            if (blingResponse.data.retorno.erros) {
              if (blingResponse.data.retorno.erros[0].erro.cod === 30) {
                const suplierOrder =
                  blingResponse.data.retorno.erros[0].erro.msg
                    .split('(')[1]
                    .replace(')', '') * 1

                if (suplierOrder === 0 || !suplierOrder) {
                  return {
                    erro: true,
                    erros: blingResponse.data.retorno.erros,
                  }
                }

                this.client.putForm(`/pedido/${suplierOrder}/json`, {
                  apikey: this.token as string,
                  xml: xmlSituacao,
                })

                return {
                  pedido: {
                    numero: suplierOrder,
                  },
                }
              }

              return {
                erro: true,
                erros: blingResponse.data.retorno.erros,
              }
            }
          }
          const blingOrder = blingResponse.data.retorno.pedidos[0]

          if (!blingOrder.notaFiscal) {
            this.client.putForm(`/pedido/${blingOrder.numero}/json`, {
              apikey: this.token as string,
              xml: xmlSituacao,
            })
            return blingOrder
          }

          this.client.postForm('/notafiscal/json', {
            apikey: this.token as string,
            number: blingOrder.notaFiscal.numero as string,
            serie: blingOrder.notaFiscal.serie as string,
            sendEmail: 'true',
          })

          return blingOrder
        })
      return updatedOrder
    } else {
      const params = {
        xml: xml as string,
        apikey: this.token as string,
      }
      const updatedOrder = await this.client
        .postForm('/pedido/json', params)
        .then((blingResponse: any) => {
          const xmlSituacao =
            `<?xml version="1.0" encoding="UTF-8"?>` +
            xmljs.js2xml(
              {
                pedido: {
                  idSituacao: 9,
                },
              },
              { compact: true, spaces: 1 },
            )

          if (blingResponse.data.retorno.erros) {
            if (blingResponse.data.retorno.erros[0].erro.cod === 30) {
              const suplierOrder = blingResponse.data.retorno.erros[0].erro.msg
                .split('(')[1]
                .replace(')', '')

              this.client.putForm(`/pedido/${suplierOrder}/json`, {
                apikey: this.token as string,
                xml: xmlSituacao,
              })

              return {
                pedido: {
                  numero: suplierOrder as string,
                },
              }
            }
            return {
              erro: true,
              erros: blingResponse.data.retorno.erros,
            }
          }
          const blingOrder = blingResponse.data.retorno.pedidos[0]

          this.client.putForm(`/pedido/${blingOrder.pedido.numero}/json`, {
            apikey: this.token as string,
            xml: xmlSituacao,
          })

          return blingOrder
        })
      return updatedOrder
    }
  }

  async updateStock({ sku, stock }: { sku: string; stock: number }) {
    const xml = xmljs.js2xml(
      {
        produto: {
          estoque: stock,
        },
      },
      { compact: true, spaces: 4 },
    )
    const response = await this.client
      .postForm(`/produto/${sku}/json`, {
        xml,
        apikey: this.token,
      })
      .then((response: any) => {
        console.log(response.data)
        return response.data
      })
      .catch((error: any) => {
        return {
          erro: true,
          status: error.code,
          message: 'Error on update stock from Bling',
          error,
        }
      })
    return response
  }

  async createProductVariationFromProducts({ item }: any) {
    const variations = await Promise.all(
      item.variations.map((variation: any) => {
        return {
          nome: variation.title,
          codigo: variation.id as string,
          vlr_unit: item.price,
          clonarDadosPai: 'N',
        }
      }),
    )

    const blingProduct: any = {
      produto: {
        codigo: item.id,
        descricao: item.blingTitle
          ? item.blingTitle
          : item.listingType === 'gold_special'
          ? `[ML - CLÁSSICO]` + item.title
          : `[ML - PREMIUM]` + item.title,
        vlr_unit: item.price,
        condicao: 'Novo',
        variacoes: { variacao: variations },
      },
    }
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>` +
      xmljs.js2xml(blingProduct, { compact: true, spaces: 1 })

    const params = {
      xml: String(xml) as string,
      apikey: this.token as string,
    }

    const createdProduct = await this.client
      .postForm('/produto/json', params)
      .then((response: any) => {
        return response.data
      })

    if (createdProduct.retorno.produtos) {
      await this.mapProductToProductStore({ item } as any)

      const createdVariations = await Promise.all(
        item.variations.map(async (variation: any) => {
          const blingVariation: any = {
            produto: {
              codigo: variation.id,
              descricao: variation.title,
              peso_bruto: variation.weight,
              peso_liq: variation.weight,
              altura: variation.height,
              largura: variation.width,
              profundidade: variation.length,
              vlr_unit: item.price,
              condicao: 'Novo',
              class_fiscal: variation.ncm,
              gtin: variation.ean,
            },
          }

          const xmlVar =
            `<?xml version="1.0" encoding="UTF-8"?>` +
            xmljs.js2xml(blingVariation, { compact: true, spaces: 1 })

          const params = {
            xml: String(xmlVar) as string,
            apikey: this.token as string,
          }

          const t0 = await this.client
            .postForm('/produto/' + variation.id + '/json', params)
            .then(async (response: any) => {
              return { product: response?.data }
            })

          const t1 = await this.mapVariationToProduct({ item: variation })
          const t2 = await this.mapProductToProductStore({
            item: variation,
          })

          return { product: t0, t1, t2 }
        }),
      )
      return { createdProduct, createdVariations }
    } else {
      return {
        error: true,
        message: 'Erro ao criar produto no Bling',
        data: createdProduct,
      }
    }
  }

  async waitASecond() {
    await new Promise((resolve) => {
      setTimeout(() => {
        return resolve(true)
      }, 1000)
    })
  }

  async createProductFromProduct({ item }: any) {}

  async mapVariationToProduct({ item }: any) {
    const varBlingProduct: any = {
      produto: {
        estrutura: {
          tipoEstoque: 'V',
          lancarEstoque: 'P',
          componente: [
            {
              codigo: item.productSku,
              nome: item.name,
              quantidade: 1,
            },
          ],
        },
      },
    }

    const xmlVarBlingProduct =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      xmljs.js2xml(varBlingProduct, {
        compact: true,
        spaces: 1,
      })

    const res = await this.client.postForm(`/produto/${item.id}/json`, {
      apikey: this.token,
      xml: xmlVarBlingProduct,
    })
    return res.data
  }

  async mapProductToProductStore({ item }: any) {
    const produtoLoja = {
      produtosLoja: {
        produtoLoja: [
          {
            idLojaVirtual: item.id,
            preco: {
              preco: item.price,
              precoPromocional: item.price,
            },
          },
        ],
      },
    }

    const xmlProdutoLoja =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      xmljs.js2xml(produtoLoja, {
        compact: true,
        spaces: 1,
      })

    const res = await this.client
      .postForm('/produtoLoja/' + item.storeBlingId + '/' + item.id + '/json', {
        xml: xmlProdutoLoja,
      })
      .then((res) => res.data)

    return res
  }
}
