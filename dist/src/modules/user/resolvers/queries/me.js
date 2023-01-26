"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const me = (_, __, { currentUser }) => {
    if (!currentUser) {
        throw new apollo_server_express_1.AuthenticationError('not authenticated');
    }
    return currentUser;
};
exports.default = me;
