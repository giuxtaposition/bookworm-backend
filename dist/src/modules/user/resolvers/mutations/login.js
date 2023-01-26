"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = __importDefault(require("../../../../models/user"));
const config_1 = __importDefault(require("../../../../utils/config"));
const login = async (root, args) => {
    if (!args.username || !args.password) {
        throw new apollo_server_express_1.UserInputError('Please provide username and password');
    }
    const currentUser = await user_1.default.findOne({
        username: args.username,
    });
    const passwordCorrect = currentUser === null
        ? false
        : await bcrypt_1.default.compare(args.password, currentUser.passwordHash);
    if (!(currentUser && passwordCorrect)) {
        throw new apollo_server_express_1.UserInputError('Invalid username or password');
    }
    const userForToken = {
        username: currentUser.username,
        id: currentUser._id,
    };
    return {
        value: jsonwebtoken_1.default.sign(userForToken, config_1.default.JWT_SECRET),
    };
};
exports.default = login;
