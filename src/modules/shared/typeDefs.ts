import {gql} from 'apollo-server-core'

export default gql`
  scalar Date
  scalar DateTime
  scalar Upload

  type File {
    id: ID!
    mimetype: String
    encoding: String
    filename: String
    location: String
  }

  type Token {
    value: String!
  }
`
