"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const resolvers_1 = require("../../shared/resolvers");
const createUser_1 = __importDefault(require("./mutations/createUser"));
const deleteUserProfilePhoto_1 = __importDefault(require("./mutations/deleteUserProfilePhoto"));
const editUser_1 = __importDefault(require("./mutations/editUser"));
const editUserCoverPhoto_1 = __importDefault(require("./mutations/editUserCoverPhoto"));
const editUserProfilePhoto_1 = __importDefault(require("./mutations/editUserProfilePhoto"));
const login_1 = __importDefault(require("./mutations/login"));
const me_1 = __importDefault(require("./queries/me"));
const userResolvers = {
    Query: {
        me: me_1.default,
    },
    Mutation: {
        createUser: createUser_1.default,
        deleteUserProfilePhoto: deleteUserProfilePhoto_1.default,
        editUser: editUser_1.default,
        editUserCoverPhoto: editUserCoverPhoto_1.default,
        editUserProfilePhoto: editUserProfilePhoto_1.default,
        login: login_1.default,
    },
    Subscription: {
        userProfileUpdated: {
            subscribe: () => resolvers_1.pubsub.asyncIterator(['USER_PROFILE_EDITED']),
        },
    },
};
exports.default = userResolvers;
