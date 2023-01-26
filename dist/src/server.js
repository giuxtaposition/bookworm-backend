"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
const schema_1 = require("@graphql-tools/schema");
const apollo_server_core_1 = require("apollo-server-core");
const apollo_server_express_1 = require("apollo-server-express");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const graphql_upload_1 = require("graphql-upload");
const ws_1 = require("graphql-ws/lib/use/ws");
const http_1 = require("http");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ws_2 = require("ws");
const user_1 = __importDefault(require("./models/user"));
const modules_1 = __importDefault(require("./modules"));
const config_1 = __importDefault(require("./utils/config"));
async function startServer() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use((0, graphql_upload_1.graphqlUploadExpress)({ maxFileSize: 10000000, maxFiles: 1 }));
    app.use('/images', express_1.default.static('images'));
    const httpServer = (0, http_1.createServer)(app);
    const executableSchema = (0, schema_1.makeExecutableSchema)(modules_1.default);
    const wsServer = new ws_2.WebSocketServer({
        server: httpServer,
        path: '/graphql',
    });
    const serverCleanup = (0, ws_1.useServer)({
        schema: executableSchema,
        context: ctx => {
            return getDynamicContext(ctx);
        },
    }, wsServer);
    const server = new apollo_server_express_1.ApolloServer({
        schema: executableSchema,
        context: async ({ req }) => {
            if (req) {
                const auth = req.headers.authorization;
                const userLanguage = req.headers['accept-language']?.slice(0, 2);
                const url = `${req.protocol}://${req.get('host') ?? ''}`;
                if (auth && auth.toLowerCase().startsWith('bearer')) {
                    const currentUser = await findUser(auth.substring(7));
                    return { currentUser, url, userLanguage };
                }
                return {
                    currentUser: null,
                    url,
                    userLanguage,
                };
            }
        },
        plugins: [
            (0, apollo_server_core_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
            {
                serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose();
                        },
                    };
                },
            },
        ],
    });
    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });
    await new Promise(resolve => httpServer.listen({ port: config_1.default.PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${config_1.default.PORT}${server.graphqlPath}`);
    return { httpServer, server, wsServer };
}
exports.startServer = startServer;
const findUser = async (authToken) => {
    const decodedToken = jsonwebtoken_1.default.verify(authToken, config_1.default.JWT_SECRET);
    const currentUser = await user_1.default.findById(decodedToken.id)
        .populate('books', {
        googleId: 1,
    })
        .populate('profilePhoto')
        .populate('coverPhoto')
        .exec();
    if (!currentUser) {
        throw new Error('User not found');
    }
    return currentUser;
};
const getDynamicContext = async (ctx) => {
    if (ctx.connectionParams?.authentication) {
        const currentUser = await findUser(ctx.connectionParams?.authentication);
        return { currentUser };
    }
    return { currentUser: null };
};
