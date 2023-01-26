"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const user_1 = __importDefault(require("../../../../models/user"));
const resolvers_1 = require("../../../shared/resolvers");
const editUser = async (root, args, { currentUser }) => {
    if (!currentUser) {
        throw new apollo_server_express_1.AuthenticationError('Must Login');
    }
    try {
        const user = await user_1.default.findByIdAndUpdate(currentUser.id, {
            ...args,
        }).populate(['profilePhoto', 'coverPhoto']);
        await resolvers_1.pubsub.publish('USER_PROFILE_EDITED', {
            userProfileUpdated: user,
        });
        return user;
    }
    catch (error) {
        console.error(error);
    }
};
exports.default = editUser;
