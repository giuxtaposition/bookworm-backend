"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_core_1 = require("apollo-server-core");
const book_1 = __importDefault(require("../../../../models/book"));
const user_1 = __importDefault(require("../../../../models/user"));
const resolvers_1 = require("../../../shared/resolvers");
const deleteBook = async (__parent, args, { currentUser }) => {
    if (!currentUser) {
        throw new apollo_server_core_1.UserInputError('You must be logged in to delete a Book');
    }
    const book = await book_1.default.findByIdAndDelete(args.id);
    if (!book) {
        throw new apollo_server_core_1.UserInputError('Book already deleted');
    }
    await user_1.default.findOneAndUpdate({ _id: currentUser.id }, {
        $pull: { books: args.id },
    }, { new: true }, function (err, doc) {
        console.log(err, doc);
    });
    await resolvers_1.pubsub.publish('BOOK_DELETED', {
        bookDeleted: book.populate('author'),
    });
    return book;
};
exports.default = deleteBook;
