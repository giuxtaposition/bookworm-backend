import {gql} from 'apollo-server-core'
import types from './types'

export default [
  gql`
    type Query {
      authorCount: Int!
      allAuthors: [Author!]
    }
  `,
  types,
]
