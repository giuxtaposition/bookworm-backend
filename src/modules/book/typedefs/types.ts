import { gql } from 'apollo-server-express'

const types = gql`
    type searchedBook {
        title: String!
        published: Date
        language: String
        description: String
        author: String!
        genres: [String!]
        pages: Int
        cover: String
        id: ID!
        inLibrary: Boolean
    }

    type Book {
        title: String!
        published: Date
        author: Author
        genres: [String!]
        pages: Int
        insertion: DateTime
        cover: String
        readState: String!
        id: ID!
        googleId: String!
    }
`

export default types
