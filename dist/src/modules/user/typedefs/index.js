"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const types_1 = __importDefault(require("./types"));
exports.default = [
    (0, apollo_server_express_1.gql) `
    type Query {
      me: User!
    }
    type Mutation {
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

      deleteUserProfilePhoto: User
    }
    type Subscription {
      userProfileUpdated: User!
    }
  `,
    types_1.default,
];
