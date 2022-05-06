import authorModule from './author'
import bookModule from './book'
import sharedModule from './shared'
import userModule from './user'

export default {
  typeDefs: [
    bookModule.typeDefs,
    authorModule.typeDefs,
    userModule.typeDefs,
    sharedModule.typeDefs,
  ],
  resolvers: [
    bookModule.resolvers,
    authorModule.resolvers,
    userModule.resolvers,
    sharedModule.resolvers,
  ],
}
