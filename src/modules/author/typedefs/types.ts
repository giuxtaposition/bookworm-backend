import { gql } from 'apollo-server-core'

const types = gql`
    type Author {
        name: String!
        id: ID!
        born: Int
        bookCount: Int
    }
`

export default types
