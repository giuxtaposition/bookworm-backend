"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const user_1 = __importDefault(require("../../../../models/user"));
const resolvers_1 = require("../../../shared/resolvers");
const deleteUserProfilePhoto = async (_, __, { currentUser }) => {
    if (!currentUser) {
        throw new apollo_server_express_1.AuthenticationError('Must Login');
    }
    if (!currentUser.profilePhoto) {
        throw new apollo_server_express_1.AuthenticationError('No profile photo to delete');
    }
    (0, resolvers_1.deleteFile)(currentUser.profilePhoto.location);
    const user = await user_1.default.findOneAndUpdate({
        _id: currentUser.id,
    }, { profilePhoto: null }, {
        new: true,
    })
        .populate('profilePhoto')
        .populate('coverPhoto')
        .exec();
    void resolvers_1.pubsub.publish('USER_PROFILE_EDITED', {
        userProfileUpdated: user,
    });
    return user;
};
exports.default = deleteUserProfilePhoto;
