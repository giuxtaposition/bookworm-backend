const { gql } = require('apollo-server-express')

module.exports = gql`
  scalar Date

  type Query {
    bookCount: Int!
    bookCountByReadState(readState: String!): Int!
    authorCount: Int!
    allBooks(author: String, genres: [String]): [Book!]
    allAuthors: [Author!]
    me: User
    allGenres: [String!]
  }

  type Book {
    title: String!
    published: Date
    author: Author!
    genres: [String!]!
    pages: Int
    insertion: Date
    cover: String
    readState: String!
    id: ID!
  }

  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int
  }

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Mutation {
    addBook(
      title: String!
      published: Date
      author: String!
      genres: [String!]
      pages: Int
      cover: String
      readState: String!
    ): Book
    editBook(
      id: ID!
      title: String
      published: Date
      author: String
      genres: [String!]
      pages: Int
      cover: String
      readState: String
    ): Book
    deleteBook(id: ID!): String
    createUser(
      username: String!
      favoriteGenre: String
      password: String!
    ): User
    login(username: String!, password: String!): Token
    addNewFavoriteGenre(favoriteGenre: String!): User
  }

  type Subscription {
    bookAdded: Book!
  }
`
