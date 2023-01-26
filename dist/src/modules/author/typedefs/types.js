"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_core_1 = require("apollo-server-core");
const types = (0, apollo_server_core_1.gql) `
  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int
  }
`;
exports.default = types;
