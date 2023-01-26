"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverTeardown = exports.serverSetup = void 0;
const server_1 = require("../../server");
let cachedHttpServer;
let cachedApolloServer;
let cachedWsServer;
const serverSetup = async () => {
    try {
        const { httpServer, server, wsServer } = await (0, server_1.startServer)();
        cachedHttpServer = httpServer;
        cachedApolloServer = server;
        cachedWsServer = wsServer;
    }
    catch (error) {
        console.error(error);
    }
};
exports.serverSetup = serverSetup;
const serverTeardown = async () => {
    cachedWsServer.close();
    await cachedApolloServer.stop();
    cachedHttpServer.close();
};
exports.serverTeardown = serverTeardown;
