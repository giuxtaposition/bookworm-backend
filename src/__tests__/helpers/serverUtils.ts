import {ApolloServer, ExpressContext} from 'apollo-server-express'
import {Server} from 'http'
import WebSocket from 'ws'
import {startServer} from '../../server'

let cachedHttpServer: Server
let cachedApolloServer: ApolloServer<ExpressContext>
let cachedWsServer: WebSocket.Server<WebSocket.WebSocket>

export const serverSetup = async () => {
  try {
    const {httpServer, server, wsServer} = await startServer()
    cachedHttpServer = httpServer
    cachedApolloServer = server
    cachedWsServer = wsServer
  } catch (error) {
    console.error(error)
  }
}

export const serverTeardown = async () => {
  cachedWsServer.close()
  await cachedApolloServer.stop()
  cachedHttpServer.close()
}
