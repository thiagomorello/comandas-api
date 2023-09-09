"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.slackApi = void 0;
const axios_1 = __importDefault(require("axios"));
const slackApi = axios_1.default.create({
    baseURL: 'https://hooks.slack.com/services',
});
exports.slackApi = slackApi;
//# sourceMappingURL=slack.js.map