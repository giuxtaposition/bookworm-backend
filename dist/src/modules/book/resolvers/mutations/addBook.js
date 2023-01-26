"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const uuid_1 = require("uuid");
const author_1 = __importDefault(require("../../../../models/author"));
const book_1 = __importDefault(require("../../../../models/book"));
const user_1 = __importDefault(require("../../../../models/user"));
const resolvers_1 = require("../../../shared/resolvers");
const inLibrary_1 = __importDefault(require("../utils/inLibrary"));
const addBook = async (_parent, args, { currentUser }) => {
    if ((0, inLibrary_1.default)(args.id, currentUser)) {
        throw new apollo_server_express_1.UserInputError('Book is already in  library', {
            invalidArgs: args.id,
        });
    }
    if (!currentUser) {
        throw new apollo_server_express_1.AuthenticationError('not authenticated');
    }
    let author = await author_1.default.findOne({
        name: args.author,
    });
    // Check if author in server
    if (!author) {
        //If not add new author
        author = new author_1.default({
            name: args.author,
            id: (0, uuid_1.v4)(),
        });
        try {
            await author.save();
        }
        catch (error) {
            throw new apollo_server_express_1.UserInputError(error.message, {
                invalidArgs: args,
            });
        }
    }
    const book = new book_1.default({
        ...args,
        id: (0, uuid_1.v4)(),
        googleId: args.id,
        author,
        user: currentUser,
        insertion: new Date(),
    });
    try {
        await book.save();
    }
    catch (error) {
        throw new apollo_server_express_1.UserInputError(error.message, {
            invalidArgs: args,
        });
    }
    // update user books with new book
    await user_1.default.updateOne({ _id: currentUser.id }, { $push: { books: book } });
    await resolvers_1.pubsub.publish('BOOK_ADDED', { bookAdded: book });
    return book;
};
exports.default = addBook;
