"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const file_1 = __importDefault(require("../../../../models/file"));
const resolvers_1 = require("../../../shared/resolvers");
const editUserProfilePhoto = async (root, args, { currentUser }) => {
    if (!currentUser) {
        throw new apollo_server_express_1.AuthenticationError('Must Login');
    }
    if (currentUser.profilePhoto) {
        (0, resolvers_1.deleteFile)(currentUser.profilePhoto.location);
    }
    const file = args.profilePhoto;
    if (!(file.mimetype === 'image/png' || file.mimetype === 'image/jpeg')) {
        throw new apollo_server_express_1.UserInputError('Must be an image');
    }
    const pathname = `user/${currentUser.username}/`;
    const profilePhoto = await (0, resolvers_1.processUpload)(file, pathname, 'profilePhoto');
    const exists = await file_1.default.findOneAndUpdate({ location: profilePhoto.location }, { ...file });
    //If not create new one
    if (!exists) {
        const profilePhotoFile = new file_1.default({ ...profilePhoto });
        await profilePhotoFile.save();
        currentUser.profilePhoto = profilePhotoFile;
        await currentUser.save();
    }
    else {
        currentUser.profilePhoto = exists;
        await currentUser.save();
    }
    await resolvers_1.pubsub.publish('USER_PROFILE_EDITED', {
        userProfileUpdated: currentUser,
    });
    return currentUser;
};
exports.default = editUserProfilePhoto;
