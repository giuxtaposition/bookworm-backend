"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const file_1 = __importDefault(require("../../../../models/file"));
const resolvers_1 = require("../../../shared/resolvers");
const editUserCoverPhoto = async (root, args, { currentUser }) => {
    if (!currentUser) {
        throw new apollo_server_express_1.AuthenticationError('Must Login');
    }
    if (currentUser.coverPhoto) {
        (0, resolvers_1.deleteFile)(currentUser.coverPhoto.location);
    }
    const file = args.coverPhoto;
    if (!(file.mimetype === 'image/png' || file.mimetype === 'image/jpeg')) {
        throw new apollo_server_express_1.UserInputError('Must be an image');
    }
    const pathname = `user/${currentUser.username}/`;
    const coverPhoto = await (0, resolvers_1.processUpload)(file, pathname, 'coverPhoto');
    const exists = await file_1.default.findOneAndUpdate({ location: coverPhoto.location }, { ...coverPhoto });
    if (!exists) {
        const coverPhotoFile = new file_1.default({ ...coverPhoto });
        await coverPhotoFile.save();
        currentUser.coverPhoto = coverPhotoFile;
        await currentUser.save();
    }
    else {
        currentUser.coverPhoto = exists;
        await currentUser.save();
    }
    await resolvers_1.pubsub.publish('USER_PROFILE_EDITED', {
        userProfileUpdated: currentUser,
    });
    return currentUser;
};
exports.default = editUserCoverPhoto;
