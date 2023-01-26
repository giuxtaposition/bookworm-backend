"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const bcrypt_1 = require("bcrypt");
const user_1 = __importDefault(require("../../../../models/user"));
const createUser = async (_root, args) => {
    const { username, password } = args;
    if (await user_1.default.findOne({ username })) {
        throw new apollo_server_express_1.UserInputError('Username already taken');
    }
    const saltRounds = 10;
    const passwordHash = await (0, bcrypt_1.hash)(password, saltRounds);
    const user = new user_1.default({
        username,
        passwordHash,
    });
    try {
        await user.save();
    }
    catch (error) {
        throw new apollo_server_express_1.UserInputError(error.message, {
            invalidArgs: args,
        });
    }
    return user;
};
exports.default = createUser;
