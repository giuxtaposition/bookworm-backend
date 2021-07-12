const { gql } = require('apollo-server-express')

module.exports = gql`
  scalar Date
  scalar DateTime
  scalar Upload

  type Query {
    bookCount: Int!
    bookCountByReadState(readState: String!): Int!
    authorCount: Int!
    allBooks(author: String, genres: [String]): [Book!]
    allAuthors: [Author!]
    me: User
    allGenres: [String!]
    searchBooks(filter: String, searchParameter: String!): [searchedBook!]
    popularBooks: [Book!]
  }

  type searchedBook {
    title: String!
    published: Date
    author: [String!]
    genres: [String!]
    pages: Int
    cover: String
    id: ID!
  }

  type Book {
    title: String!
    published: Date
    author: Author!
    genres: [String!]
    pages: Int
    insertion: DateTime
    cover: String
    readState: String!
    id: ID!
    googleId: String!
  }

  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int
  }

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

  type Mutation {
    addBook(
      title: String!
      published: Date
      author: String!
      genres: [String!]
      pages: Int
      cover: String
      readState: String!
      id: ID!
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

    deleteBook(id: ID!): Book

    createUser(
      username: String!
      favoriteGenre: String
      password: String!
    ): User

    login(username: String!, password: String!): Token

    editUser(
      name: String
      email: String
      bio: String
      favoriteGenre: String
    ): User

    editUserProfilePhoto(profilePhoto: Upload!): User

    editUserCoverPhoto(coverPhoto: Upload!): User
  }

  type Subscription {
    bookAdded: Book!
    bookEdited: Book!
    bookDeleted: Book!
    coverPhotoUpdated: User!
    profilePhotoUpdated: User!
    userProfileUpdated: User!
  }
`
