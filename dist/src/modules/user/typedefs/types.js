"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_core_1 = require("apollo-server-core");
const types = (0, apollo_server_core_1.gql) `
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
`;
exports.default = types;
