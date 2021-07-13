const http = require('http')
const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const { ApolloServer } = require('apollo-server-express')
const jwt = require('jsonwebtoken')
const typeDefs = require('./graphql/typeDefs')
const resolvers = require('./graphql/resolvers')
const config = require('./utils/config')
const { graphqlUploadExpress } = require('graphql-upload')

const User = require('./models/user')

console.log('connecting to', config.MONGODB_URI)

mongoose
  .connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch(error => {
    console.log('error connection to MongoDB:', error.message)
  })

mongoose.set('debug', true)

async function startApolloServer() {
  app.use(cors())
  app.use(express.json())
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }))
  app.use('/images', express.static('images'))

  const server = new ApolloServer({
    uploads: false,
    typeDefs,
    resolvers,
    context: async ({ req, connection }) => {
      if (req) {
        const auth = req ? req.headers.authorization : null
        const userLanguage = req ? req.headers['accept-language'] : null
        let currentUser = undefined
        if (auth && auth.toLowerCase().startsWith('bearer')) {
          const decodedToken = jwt.verify(auth.substring(7), config.JWT_SECRET)
          currentUser = await User.findById(decodedToken.id).populate('books', {
            googleId: 1,
          })
        }
        return {
          currentUser: currentUser,
          url: req.protocol + '://' + req.get('host'),
          userLanguage: userLanguage.slice(0, 2),
        }
      }
      if (connection) {
        const token = connection.context.authorization
          ? connection.context.authorization
          : ''
        let currentUser = undefined

        if (token) {
          const decodedToken = jwt.verify(token, config.JWT_SECRET)
          currentUser = await User.findById(decodedToken.id).populate('books', {
            googleId: 1,
          })
        }

        return {
          currentUser: currentUser,
          url: connection.context.url,
        }
      }
    },
  })
  await server.start()

  server.applyMiddleware({ app })

  const httpServer = http.createServer(app)
  server.installSubscriptionHandlers(httpServer)

  await new Promise(resolve => httpServer.listen(config.PORT, resolve))
  console.log(
    `🚀 Server ready at http://localhost:${config.PORT}${server.graphqlPath}`
  )
  console.log(
    `🚀 Subscriptions ready at ws://localhost:${config.PORT}${server.subscriptionsPath}`
  )
  return { server, app, httpServer }
}

startApolloServer()
