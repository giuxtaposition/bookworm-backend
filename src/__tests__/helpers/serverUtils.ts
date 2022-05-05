import { ApolloServer, ExpressContext } from 'apollo-server-express'
import { DocumentNode, print } from 'graphql'
import { Server } from 'http'
import request from 'supertest'
import WebSocket from 'ws'
import { startServer } from '../../server'

let cachedHttpServer: Server
let cachedApolloServer: ApolloServer<ExpressContext>
let cachedWsServer: WebSocket.Server<WebSocket.WebSocket>

export const sendTestRequest = async (
    query: DocumentNode,
    {
        variables = {},
        headers = {},
    }: {
        variables?: unknown
        headers?: { [key: string]: string }
    } = {}
): Promise<unknown> => {
    const requestBuilder = request(cachedHttpServer).post('/graphql')

    Object.entries(headers).forEach(([key, value]) => {
        void requestBuilder.set(key, value)
    })
    const { text } = await requestBuilder.send({
        variables,
        query: print(query),
    })
    return JSON.parse(text) as unknown
}

export const serverSetup = async () => {
    try {
        const { httpServer, server, wsServer } = await startServer()
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
