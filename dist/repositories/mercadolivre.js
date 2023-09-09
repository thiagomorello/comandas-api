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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MercadoLivre = void 0;
const axios_1 = __importDefault(require("axios"));
const database_1 = require("./database");
const axios_rate_limit_1 = __importDefault(require("axios-rate-limit"));
class MercadoLivre {
    constructor(accessToken, refreshToken, integrationId) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.integrationId = integrationId;
        this.client = (0, axios_rate_limit_1.default)(axios_1.default.create({
            baseURL: 'https://api.mercadolibre.com',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }), { maxRequests: 1, perMilliseconds: 500 });
        this.client.interceptors.response.use((response) => response, (error) => __awaiter(this, void 0, void 0, function* () {
            if (error.response.status === 401 || error.response.status === 403) {
                const newTokenData = yield this.refreshAccessToken(this.refreshToken);
                if (!newTokenData.access_token) {
                    error = Object.assign(Object.assign({}, error), { doNotRetry: true });
                    return Promise.reject(error);
                }
                error.config.headers.Authorization = `Bearer ${newTokenData.access_token}`;
                return this.client.request(error.config);
            }
            return Promise.reject(error);
        }));
    }
    getIfSellerIsCrossDocking() {
        return __awaiter(this, void 0, void 0, function* () {
            const seller = yield this.client
                .get('/users/me')
                .then((res) => res.data)
                .catch((error) => {
                var _a;
                console.log('Error getting seller data');
                console.log('Error: ', (_a = error.response) === null || _a === void 0 ? void 0 : _a.data);
                return { isError: true };
            });
            if (seller.isError)
                return false;
            const shippingPreferentes = yield this.client
                .get('/users/' + seller.id + '/shipping_preferences')
                .then((res) => res.data);
            const me2 = shippingPreferentes.logistics.find((logistic) => {
                return logistic.mode === 'me2';
            });
            if (!me2)
                return false;
            const crossDocking = me2.types.find((type) => {
                return type.type === 'cross_docking';
            });
            return !!crossDocking;
        });
    }
    refreshAccessToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const newTokenData = yield this.client
                .post('/oauth/token', {
                grant_type: 'refresh_token',
                client_id: process.env.MERCADOLIVRE_CLIENT_ID,
                client_secret: process.env.MERCADOLIVRE_CLIENT_SECRET,
                refresh_token: refreshToken,
            })
                .then((response) => response.data)
                .catch((err) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                console.log('Error refreshing token');
                console.log('Error: ', (_a = err.response) === null || _a === void 0 ? void 0 : _a.data);
                const errorResponse = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data;
                if (errorResponse.error === 'invalid_grant' ||
                    errorResponse.error === 'not_found' ||
                    errorResponse.error === '') {
                    yield database_1.database.integrations.update({
                        where: {
                            id: this.integrationId,
                        },
                        data: {
                            status: 0,
                        },
                    });
                }
                return { isError: true };
            }));
            if (newTokenData.isError) {
                const integration = yield database_1.database.integrations.findUnique({
                    where: {
                        id: this.integrationId,
                    },
                });
                console.log('Integration: ', integration.params);
            }
            if (!newTokenData.isError) {
                const newParams = yield database_1.database.integrations.update({
                    where: {
                        id: this.integrationId,
                    },
                    data: {
                        params: JSON.stringify(Object.assign({}, newTokenData)),
                    },
                });
                return newTokenData;
            }
            return false;
        });
    }
    getOrder(resource) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.client
                .get(resource)
                .then((res) => res.data)
                .catch((err) => {
                return { isError: true, error: err };
            });
            return order;
        });
    }
}
exports.MercadoLivre = MercadoLivre;
//# sourceMappingURL=mercadolivre.js.map