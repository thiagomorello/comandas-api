"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bling = void 0;
const dotenv = __importStar(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const xmljs = __importStar(require("xml-js"));
const proxyHost = process.env.PROXY_HOST;
const proxyPort = Number(process.env.PROXY_PORT);
const proxyAuth = process.env.PROXY_USER + ':' + process.env.PROXY_PASS;
dotenv.config();
class Bling {
    constructor(token) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        this.token = token;
        this.client = axios_1.default.create({
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
                'Proxy-Authorization': 'Basic ' + Buffer.from(proxyAuth).toString('base64'),
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'pt-BR,pt;q=0.9',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
                Pragma: 'no-cache',
            },
        });
        this.client.interceptors.response.use((response) => {
            // Retorne a resposta normalmente se a requisição for bem-sucedida
            return response;
        }, (error) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 403 ||
                ((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 503 ||
                ((_c = error.response) === null || _c === void 0 ? void 0 : _c.status) === 429 ||
                ((_d = error.response) === null || _d === void 0 ? void 0 : _d.status) === 500 ||
                !((_e = error.response) === null || _e === void 0 ? void 0 : _e.status)) {
                return this.client.request(error.config);
            }
            if (((_f = error === null || error === void 0 ? void 0 : error.response) === null || _f === void 0 ? void 0 : _f.status) === 401) {
                if (((_l = (_k = (_j = (_h = (_g = error.response) === null || _g === void 0 ? void 0 : _g.data) === null || _h === void 0 ? void 0 : _h.retorno) === null || _j === void 0 ? void 0 : _j.errors) === null || _k === void 0 ? void 0 : _k.erro) === null || _l === void 0 ? void 0 : _l.cod) === 3) {
                    return { error: 'API Key Inválida', code: 401 };
                }
            }
            return Promise.reject(error);
        }));
    }
    createProduct({ product }) {
        return __awaiter(this, void 0, void 0, function* () {
            const plusImgs = product.plusimgs.split(',');
            const imgs = [product.img, ...plusImgs];
            const rimgs = imgs.map((img) => {
                return 'https://app.wedropbr.com.br/img/1000x1000/13/' + img;
            });
            const blingProduct = {
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
            };
            const xml = `<?xml version="1.0" encoding="UTF-8"?>` +
                xmljs.js2xml(blingProduct, { compact: true, spaces: 1 });
            const params = {
                xml: String(xml),
                apikey: this.token,
            };
            const createdProduct = yield this.client
                .postForm('/produto/json', params)
                .then((response) => {
                return response.data;
            });
            return createdProduct;
        });
    }
    createOrderOnWeDropBling({ data }) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const order = {
                pedido: {
                    loja: process.env.WEDROP_BLING_STORE_ID,
                    cliente: {
                        nome: data.integration.mode === 'J'
                            ? data.integration.seller_info.razao
                            : data.integration.seller_info.nome,
                        nat_operacao: 'Venda de Mercadorias',
                        contribuinte: ((_a = data.integration.seller_info) === null || _a === void 0 ? void 0 : _a.contribuinte)
                            ? (_b = data.integration.seller_info) === null || _b === void 0 ? void 0 : _b.contribuinte
                            : 9,
                        tipoPessoa: data.integration.mode,
                        endereco: data.integration.seller_info.rua,
                        cpf_cnpj: data.integration.mode === 'J'
                            ? data.integration.seller_info.cnpj
                            : data.integration.seller_info.cpf,
                        ie: (_c = data.integration.seller_info) === null || _c === void 0 ? void 0 : _c.ie,
                        numero: data.integration.seller_info.num,
                        complemento: data.integration.seller_info.complemento,
                        bairro: data.integration.seller_info.bairro,
                        cep: data.integration.seller_info.cep,
                        cidade: data.integration.seller_info.cidade,
                        uf: data.integration.seller_info.estado,
                        email: data.user.email,
                    },
                    itens: data.products.map((product) => {
                        const price = Number(product.product.price) - Number(product.product.price) * 0.5;
                        return {
                            item: {
                                codigo: product.product.sku,
                                descricao: product.product.name,
                                qtde: product.qtd,
                                un: 'un',
                                vlr_unit: price.toFixed(2),
                            },
                        };
                    }),
                    vlr_frete: 0,
                    vlr_desconto: 0,
                    obs: `Pedido criado pelo WeDrop - Código do Pedido: ${data.order.id} - Código do Cliente: ${data.order.user_id}`,
                },
            };
            const xml = `<?xml version="1.0" encoding="UTF-8"?>` +
                xmljs.js2xml(order, { compact: true, spaces: 1 });
            if (data.integration.mode === 'J') {
                const params = {
                    xml: String(xml),
                    apikey: this.token,
                    gerarnfe: 'true',
                };
                const updatedOrder = yield this.client
                    .postForm('/pedido/json', params)
                    .then((blingResponse) => {
                    const xmlSituacao = `<?xml version="1.0" encoding="UTF-8"?>` +
                        xmljs.js2xml({
                            pedido: {
                                idSituacao: 9,
                            },
                        }, { compact: true, spaces: 1 });
                    if (blingResponse.data.retorno.erros) {
                        if (blingResponse.data.retorno.erros) {
                            if (blingResponse.data.retorno.erros[0].erro.cod === 30) {
                                const suplierOrder = blingResponse.data.retorno.erros[0].erro.msg
                                    .split('(')[1]
                                    .replace(')', '') * 1;
                                if (suplierOrder === 0 || !suplierOrder) {
                                    return {
                                        erro: true,
                                        erros: blingResponse.data.retorno.erros,
                                    };
                                }
                                this.client.putForm(`/pedido/${suplierOrder}/json`, {
                                    apikey: this.token,
                                    xml: xmlSituacao,
                                });
                                return {
                                    pedido: {
                                        numero: suplierOrder,
                                    },
                                };
                            }
                            return {
                                erro: true,
                                erros: blingResponse.data.retorno.erros,
                            };
                        }
                    }
                    const blingOrder = blingResponse.data.retorno.pedidos[0];
                    if (!blingOrder.notaFiscal) {
                        this.client.putForm(`/pedido/${blingOrder.numero}/json`, {
                            apikey: this.token,
                            xml: xmlSituacao,
                        });
                        return blingOrder;
                    }
                    this.client.postForm('/notafiscal/json', {
                        apikey: this.token,
                        number: blingOrder.notaFiscal.numero,
                        serie: blingOrder.notaFiscal.serie,
                        sendEmail: 'true',
                    });
                    return blingOrder;
                });
                return updatedOrder;
            }
            else {
                const params = {
                    xml: xml,
                    apikey: this.token,
                };
                const updatedOrder = yield this.client
                    .postForm('/pedido/json', params)
                    .then((blingResponse) => {
                    const xmlSituacao = `<?xml version="1.0" encoding="UTF-8"?>` +
                        xmljs.js2xml({
                            pedido: {
                                idSituacao: 9,
                            },
                        }, { compact: true, spaces: 1 });
                    if (blingResponse.data.retorno.erros) {
                        if (blingResponse.data.retorno.erros[0].erro.cod === 30) {
                            const suplierOrder = blingResponse.data.retorno.erros[0].erro.msg
                                .split('(')[1]
                                .replace(')', '');
                            this.client.putForm(`/pedido/${suplierOrder}/json`, {
                                apikey: this.token,
                                xml: xmlSituacao,
                            });
                            return {
                                pedido: {
                                    numero: suplierOrder,
                                },
                            };
                        }
                        return {
                            erro: true,
                            erros: blingResponse.data.retorno.erros,
                        };
                    }
                    const blingOrder = blingResponse.data.retorno.pedidos[0];
                    this.client.putForm(`/pedido/${blingOrder.pedido.numero}/json`, {
                        apikey: this.token,
                        xml: xmlSituacao,
                    });
                    return blingOrder;
                });
                return updatedOrder;
            }
        });
    }
    updateStock({ sku, stock }) {
        return __awaiter(this, void 0, void 0, function* () {
            const xml = xmljs.js2xml({
                produto: {
                    estoque: stock,
                },
            }, { compact: true, spaces: 4 });
            const response = yield this.client
                .postForm(`/produto/${sku}/json`, {
                xml,
                apikey: this.token,
            })
                .then((response) => {
                console.log(response.data);
                return response.data;
            })
                .catch((error) => {
                return {
                    erro: true,
                    status: error.code,
                    message: 'Error on update stock from Bling',
                    error,
                };
            });
            return response;
        });
    }
    createProductVariationFromProducts({ item }) {
        return __awaiter(this, void 0, void 0, function* () {
            const variations = yield Promise.all(item.variations.map((variation) => {
                return {
                    nome: variation.title,
                    codigo: variation.id,
                    vlr_unit: item.price,
                    clonarDadosPai: 'N',
                };
            }));
            const blingProduct = {
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
            };
            const xml = `<?xml version="1.0" encoding="UTF-8"?>` +
                xmljs.js2xml(blingProduct, { compact: true, spaces: 1 });
            const params = {
                xml: String(xml),
                apikey: this.token,
            };
            const createdProduct = yield this.client
                .postForm('/produto/json', params)
                .then((response) => {
                return response.data;
            });
            if (createdProduct.retorno.produtos) {
                yield this.mapProductToProductStore({ item });
                const createdVariations = yield Promise.all(item.variations.map((variation) => __awaiter(this, void 0, void 0, function* () {
                    const blingVariation = {
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
                    };
                    const xmlVar = `<?xml version="1.0" encoding="UTF-8"?>` +
                        xmljs.js2xml(blingVariation, { compact: true, spaces: 1 });
                    const params = {
                        xml: String(xmlVar),
                        apikey: this.token,
                    };
                    const t0 = yield this.client
                        .postForm('/produto/' + variation.id + '/json', params)
                        .then((response) => __awaiter(this, void 0, void 0, function* () {
                        return { product: response === null || response === void 0 ? void 0 : response.data };
                    }));
                    const t1 = yield this.mapVariationToProduct({ item: variation });
                    const t2 = yield this.mapProductToProductStore({
                        item: variation,
                    });
                    return { product: t0, t1, t2 };
                })));
                return { createdProduct, createdVariations };
            }
            else {
                return {
                    error: true,
                    message: 'Erro ao criar produto no Bling',
                    data: createdProduct,
                };
            }
        });
    }
    waitASecond() {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve) => {
                setTimeout(() => {
                    return resolve(true);
                }, 1000);
            });
        });
    }
    createProductFromProduct({ item }) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    mapVariationToProduct({ item }) {
        return __awaiter(this, void 0, void 0, function* () {
            const varBlingProduct = {
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
            };
            const xmlVarBlingProduct = '<?xml version="1.0" encoding="UTF-8"?>' +
                xmljs.js2xml(varBlingProduct, {
                    compact: true,
                    spaces: 1,
                });
            const res = yield this.client.postForm(`/produto/${item.id}/json`, {
                apikey: this.token,
                xml: xmlVarBlingProduct,
            });
            return res.data;
        });
    }
    mapProductToProductStore({ item }) {
        return __awaiter(this, void 0, void 0, function* () {
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
            };
            const xmlProdutoLoja = '<?xml version="1.0" encoding="UTF-8"?>' +
                xmljs.js2xml(produtoLoja, {
                    compact: true,
                    spaces: 1,
                });
            const res = yield this.client
                .postForm('/produtoLoja/' + item.storeBlingId + '/' + item.id + '/json', {
                xml: xmlProdutoLoja,
            })
                .then((res) => res.data);
            return res;
        });
    }
}
exports.Bling = Bling;
//# sourceMappingURL=bling.js.map