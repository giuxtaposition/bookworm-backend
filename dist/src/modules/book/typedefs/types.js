"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const types = (0, apollo_server_express_1.gql) `
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
`;
exports.default = types;
