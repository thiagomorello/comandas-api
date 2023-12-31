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
exports.MercadoPago = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
class MercadoPago {
    constructor() {
        this.client = axios_1.default.create({
            baseURL: 'https://api.mercadopago.com',
            headers: {
                Authorization: `Bearer ${process.env.MERCADOPAGO_TOKEN}`,
            },
        });
    }
    createCustomer(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.mp.customers.create(data);
            return response;
        });
    }
    createPixPayment(paymentData) {
        return __awaiter(this, void 0, void 0, function* () {
            paymentData.statement_descriptor = 'WeDrop';
            const pixResponse = yield this.client
                .post('/v1/payments', paymentData)
                .then((response) => response.data);
            return pixResponse;
        });
    }
    createPayment(paymentData) {
        return __awaiter(this, void 0, void 0, function* () {
            paymentData.statement_descriptor = 'WeDrop';
            const cardResponse = yield this.client
                .post('/v1/payments', paymentData)
                .then((response) => response.data);
            return cardResponse;
        });
    }
    getPayment({ id }) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client
                .get(`/v1/payments/${id}`)
                .then((response) => response.data);
            return response;
        });
    }
}
exports.MercadoPago = MercadoPago;
//# sourceMappingURL=mercadopago.js.map