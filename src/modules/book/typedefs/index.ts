import { gql } from 'apollo-server-core'
import types from './types'

export default [
    gql`
        type Query {
            bookCount: Int!
            bookCountByReadState(readState: String!): Int!
            allBooks(
                author: String
                genres: [String]
                readState: String
            ): [Book!]
            allGenres: [String!]
            searchBooks(
                filter: String
                searchParameter: String!
            ): [searchedBook!]
            searchBook(id: ID!): searchedBook!
            popularBooks: [searchedBook!]
        }
        type Mutation {
            addBook(
                title: String!
                published: Date
                author: String
                genres: [String!]
                pages: Int
                cover: String
                readState: String!
                id: ID!
            ): Book

            editBook(
                title: String!
                published: Date
                author: String
                genres: [String!]
                pages: Int
                cover: String
                readState: String!
                id: ID!
            ): Book

            deleteBook(id: ID!): Book
        }
        type Subscription {
            bookAdded: Book!
            bookEdited: Book!
            bookDeleted: Book!
        }
    `,
    types,
]
