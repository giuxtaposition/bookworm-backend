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
      authorCount: Int!
      allAuthors: [Author!]
    }
  `,
    types_1.default,
];
