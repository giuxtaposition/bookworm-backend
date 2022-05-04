import { makeExecutableSchema } from '@graphql-tools/schema'
import { ApolloServerPluginDrainHttpServer, Config } from 'apollo-server-core'
import { ApolloServer, ExpressContext } from 'apollo-server-express'
import cors from 'cors'
import express from 'express'
import { ExecutionArgs } from 'graphql'
import { graphqlUploadExpress } from 'graphql-upload'
import { Context, SubscribeMessage } from 'graphql-ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import { createServer } from 'http'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { connect } from 'mongoose'
import { WebSocketServer } from 'ws'
import resolvers from './graphql/resolvers'
import typeDefs from './graphql/typeDefs'
import UserModel from './models/user'
import config from './utils/config'

const findUser = async (authToken: string) => {
    if (!config.JWT_SECRET) {
        throw new Error(
            'JWT_SECRET must be specified in the environment variables.'
        )
    }
    const decodedToken = jwt.verify(authToken, config.JWT_SECRET) as JwtPayload

    const currentUser = await UserModel.findById(decodedToken.id)
        .populate('books', {
            googleId: 1,
        })
        .populate('profilePhoto')
        .populate('coverPhoto')
        .exec()

    return currentUser
}

const getDynamicContext = async (
    ctx: Context,
    _msg: SubscribeMessage,
    _args: ExecutionArgs
) => {
    if (ctx.connectionParams?.authentication) {
        const currentUser = await findUser(
            ctx.connectionParams?.authentication as string
        )

        return { currentUser }
    }

    return { currentUser: null }
}

const connectToDB = async () => {
    console.log('connecting to', config.MONGODB_URI)

    try {
        await connect(config.MONGODB_URI)
        console.log('connected to MongoDB')
    } catch (error) {
        console.log('error connection to MongoDB:', (error as Error).message)
    }
}

async function startApolloServer() {
    const app = express()
    app.use(cors())
    app.use(express.json())
    app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }))
    app.use('/images', express.static('images'))

    const httpServer = createServer(app)

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql',
    })
    const serverCleanup = useServer(
        {
            schema,
            context: (ctx, msg, args) => {
                return getDynamicContext(ctx, msg, args)
            },
        },
        wsServer
    )

    const server = new ApolloServer({
        schema,
        context: async ({ req }) => {
            if (req) {
                const auth = req.headers.authorization
                const userLanguage = req.headers['accept-language']?.slice(0, 2)

                const url = `${req.protocol}://${req.get('host') ?? ''}`

                if (auth && auth.toLowerCase().startsWith('bearer')) {
                    const currentUser = await findUser(auth.substring(7))

                    return { currentUser, url, userLanguage }
                }

                return {
                    currentUser: null,
                    url,
                    userLanguage,
                }
            }
        },
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
            {
                serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose()
                        },
                    }
                },
            },
        ],
    } as Config<ExpressContext>)

    await server.start()

    server.applyMiddleware({ app, path: '/graphql' })

    await new Promise<void>(resolve =>
        httpServer.listen({ port: config.PORT }, resolve)
    )
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
}

void connectToDB()
void startApolloServer()
