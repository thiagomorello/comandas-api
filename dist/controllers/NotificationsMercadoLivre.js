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
const mercadolivre_1 = require("../repositories/mercadolivre");
const integrations_1 = require("../repositories/integrations");
const socket_1 = require("../repositories/socket");
const database_1 = require("../repositories/database");
exports.default = {
    handle(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user_id, topic, resource } = request.body;
            const integration = (yield integrations_1.integrations).find((integration) => integration.shop_id === Number(user_id));
            if (!integration || integration.error) {
                return response.json(request.body);
            }
            if (topic === 'orders_v2' && integration.params) {
                const orderId = resource.split('/')[2].trim();
                console.log('orderId: ', orderId);
                const orderExists = yield database_1.database.orders.findFirst({
                    where: {
                        channel_order: orderId,
                    },
                    select: {
                        id: true,
                    },
                });
                if (!orderExists) {
                    const ml = new mercadolivre_1.MercadoLivre(integration.params.access_token, integration.params.refresh_token, integration.id);
                    const order = yield ml.getOrder(resource);
                    if (order.isError) {
                        return response.json(request.body);
                    }
                    else {
                        if (order.status === 'paid') {
                            (0, socket_1.emitToUser)(String(integration.user_id), 'sellOnMl', Object.assign(Object.assign({}, order), { integrationId: integration.id }));
                        }
                    }
                    return response.json(request.body);
                }
            }
        });
    },
    test(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const meliIntegrations = (yield integrations_1.integrations).filter((integration) => integration.keyword === 'mercadolivre' && integration.is_cross === 0);
            let updatedIntegrations = 0;
            let position = 0;
            for (const integration of meliIntegrations) {
                const ml = new mercadolivre_1.MercadoLivre(integration.params.access_token, integration.params.refresh_token, integration.id);
                const isCrossDocking = yield ml.getIfSellerIsCrossDocking();
                if (isCrossDocking) {
                    yield database_1.database.integrations.update({
                        where: {
                            id: integration.id,
                        },
                        data: {
                            is_cross: 1,
                        },
                    });
                    updatedIntegrations++;
                    console.log('Integration updated: ', integration.id);
                }
                else {
                    yield database_1.database.integrations.update({
                        where: {
                            id: integration.id,
                        },
                        data: {
                            is_cross: 2,
                        },
                    });
                }
                position++;
                console.log(position + ' de  ' + meliIntegrations.length + ' integrations testadas');
            }
            return response.json({ updatedIntegrations });
        });
    },
};
//# sourceMappingURL=NotificationsMercadoLivre.js.map