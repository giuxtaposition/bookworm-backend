import {gql} from 'apollo-server-core'

const types = gql`
  type User {
    username: String!
    favoriteGenre: String
    name: String
    email: String
    bio: String
    profilePhoto: File
    coverPhoto: File
    id: ID!
  }
`

export default types
