"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_core_1 = require("apollo-server-core");
const types_1 = __importDefault(require("./types"));
exports.default = [
    (0, apollo_server_core_1.gql) `
    type Query {
      bookCount: Int!
      bookCountByReadState(readState: String!): Int!
      allBooks(author: String, genres: [String], readState: String): [Book!]
      allGenres: [String!]
      searchBooks(filter: String, searchParameter: String!): [searchedBook!]
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
    types_1.default,
];
