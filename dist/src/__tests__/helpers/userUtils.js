"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockedCurrentUser = exports.createCurrentUser = exports.currentUser = void 0;
const bcrypt_1 = require("bcrypt");
const user_1 = __importDefault(require("../../models/user"));
const createCurrentUser = async () => {
    const passwordHash = await (0, bcrypt_1.hash)('testPassword', 10);
    const user = new user_1.default({
        username: 'testCurrentUser',
        passwordHash: passwordHash,
        id: 'testCurrentUserId',
    });
    const userInDB = await user.save();
    exports.currentUser = await userInDB.populate(['profilePhoto', 'coverPhoto', 'books']);
};
exports.createCurrentUser = createCurrentUser;
exports.mockedCurrentUser = new user_1.default({
    username: 'testCurrentUser',
    passwordHash: 'testPasswordHash',
    id: 'testCurrentUserId',
});
