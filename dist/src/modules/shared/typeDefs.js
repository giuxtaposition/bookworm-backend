"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_core_1 = require("apollo-server-core");
exports.default = (0, apollo_server_core_1.gql) `
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
`;
