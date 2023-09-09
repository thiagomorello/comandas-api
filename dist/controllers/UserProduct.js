"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../repositories/database");
const bling_erp_api_1 = require("bling-erp-api");
exports.default = {
    addBling(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email } = request.query;
            if (!email) {
                return response.status(400).json({ message: 'Email is required' });
            }
            const user = yield database_1.database.users.findUnique({
                where: {
                    email: String(email),
                },
            });
            /* const users = await database.users.findMany({
              where: {
                status: 1,
              },
            })
            for (const user of users) { */
            if (!user) {
                return response.status(404).json({ message: 'User not found' });
            }
            const userProducts = yield database_1.database.user_product.findMany({
                where: {
                    user_id: user.id,
                },
            });
            const integrations = yield database_1.database.integrations.findMany({
                where: {
                    status: 1,
                    type: 'erp',
                    user_id: user.id,
                },
            });
            const products = yield database_1.database.products.findMany({
                where: {
                    status: 1,
                },
            });
            const ups = [];
            for (const integration of integrations) {
                const params = JSON.parse(integration.params || '{}');
                if (!params.apikey) {
                    database_1.database.integrations.update({
                        where: {
                            id: integration.id,
                        },
                        data: {
                            status: 0,
                        },
                    });
                    return false;
                }
                const blingConnection = new bling_erp_api_1.Bling(params.apikey);
                const res = yield blingConnection
                    .products()
                    .all()
                    .catch((err) => {
                    console.log(err);
                    return [];
                });
                const skus = yield Promise.all(res.map((product) => product.codigo));
                // filter skus if product exists and add product_id to skus
                yield Promise.all(skus.map((sku) => __awaiter(this, void 0, void 0, function* () {
                    const p = products.find((product) => {
                        if (product.sku === sku) {
                            return product;
                        }
                        return false;
                    });
                    if (p) {
                        const userProduct = userProducts.find((userProduct) => {
                            if (userProduct.product_id === p.id) {
                                return userProduct;
                            }
                            return false;
                        });
                        if (!userProduct) {
                            const up = yield database_1.database.user_product.create({
                                data: {
                                    product_id: p.id,
                                    user_id: user.id,
                                    integration_id: integration.id,
                                },
                            });
                            ups.push(up);
                            return up;
                        }
                        return false;
                    }
                    return false;
                })));
                console.log('Produtos adicionados para o usuário ' + user.id);
            }
            return response.json({ message: 'ok' });
        });
    },
};
//# sourceMappingURL=UserProduct.js.map