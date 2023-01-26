"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const book_1 = __importDefault(require("../../../../models/book"));
const allBooks = async (_, args, { currentUser }) => {
    if (!currentUser) {
        throw new apollo_server_express_1.AuthenticationError('not authenticated');
    }
    return await book_1.default.find({
        ...args,
        user: currentUser,
    })
        .populate({ path: 'author', options: { lean: true } })
        .exec();
};
exports.default = allBooks;
