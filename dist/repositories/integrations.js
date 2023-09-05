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
exports.integrations = void 0;
const database_1 = require("./database");
function getIntegrations() {
    return __awaiter(this, void 0, void 0, function* () {
        const integrations = database_1.database.integrations
            .findMany({
            where: {
                status: 1,
            },
        })
            .then((response) => {
            const integrations = response.map((integration) => {
                // check if integration.params is a valid json string
                // if not, return null
                // if yes, return the parsed json
                if (integration.params) {
                    try {
                        const params = JSON.parse(integration.params);
                        return Object.assign(Object.assign({}, integration), { params });
                    }
                    catch (error) {
                        return Object.assign(Object.assign({}, integration), { params: null, error: true });
                    }
                }
                return Object.assign(Object.assign({}, integration), { params: null, error: true });
            });
            return integrations;
        });
        return integrations;
    });
}
const integrations = getIntegrations().then((res) => res);
exports.integrations = integrations;
//# sourceMappingURL=integrations.js.map