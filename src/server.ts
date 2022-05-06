import {makeExecutableSchema} from '@graphql-tools/schema'
import {ApolloServerPluginDrainHttpServer, Config} from 'apollo-server-core'
import {ApolloServer, ExpressContext} from 'apollo-server-express'
import cors from 'cors'
import express from 'express'
import {graphqlUploadExpress} from 'graphql-upload'
import {Context} from 'graphql-ws'
import {useServer} from 'graphql-ws/lib/use/ws'
import {createServer} from 'http'
import jwt, {JwtPayload} from 'jsonwebtoken'
import {WebSocketServer} from 'ws'
import UserModel from './models/user'
import schema from './modules'
import {BookDocument} from './types/Book'
import File from './types/File'
import {CurrentUser} from './types/User'
import config from './utils/config'

export async function startServer() {
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use(graphqlUploadExpress({maxFileSize: 10000000, maxFiles: 1}))
  app.use('/images', express.static('images'))

  const httpServer = createServer(app)

  const executableSchema = makeExecutableSchema(schema)

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  })

  const serverCleanup = useServer(
    {
      schema: executableSchema,
      context: ctx => {
        return getDynamicContext(ctx)
      },
    },
    wsServer,
  )

  const server = new ApolloServer({
    schema: executableSchema,
    context: async ({req}) => {
      if (req) {
        const auth = req.headers.authorization
        const userLanguage = req.headers['accept-language']?.slice(0, 2)

        const url = `${req.protocol}://${req.get('host') ?? ''}`

        if (auth && auth.toLowerCase().startsWith('bearer')) {
          const currentUser = await findUser(auth.substring(7))

          return {currentUser, url, userLanguage}
        }

        return {
          currentUser: null,
          url,
          userLanguage,
        }
      }
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({httpServer}),
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

  server.applyMiddleware({app, path: '/graphql'})

  await new Promise<void>(resolve =>
    httpServer.listen({port: config.PORT}, resolve),
  )
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  return {httpServer, server, wsServer}
}

const findUser = async (authToken: string): Promise<CurrentUser> => {
  const decodedToken = jwt.verify(authToken, config.JWT_SECRET) as JwtPayload

  const currentUser = await UserModel.findById(decodedToken.id)
    .populate<{books: BookDocument[]}>('books', {
      googleId: 1,
    })
    .populate<{profilePhoto: File}>('profilePhoto')
    .populate<{coverPhoto: File}>('coverPhoto')
    .exec()

  if (!currentUser) {
    throw new Error('User not found')
  }

  return currentUser
}

const getDynamicContext = async (ctx: Context) => {
  if (ctx.connectionParams?.authentication) {
    const currentUser = await findUser(
      ctx.connectionParams?.authentication as string,
    )

    return {currentUser}
  }

  return {currentUser: null}
}
