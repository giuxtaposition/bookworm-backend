"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const book_1 = __importDefault(require("../../../../models/book"));
const resolvers_1 = require("../../../shared/resolvers");
const editBook = async (_parent, args, { currentUser }) => {
    if (!currentUser) {
        throw new apollo_server_express_1.UserInputError('You must be logged in to edit a Book');
    }
    const book = book_1.default.findByIdAndUpdate(args.id, { ...args }, function (err, docs) {
        if (err) {
            throw new apollo_server_express_1.UserInputError('Book not found');
        }
        else {
            console.log('Updated Book: ', docs);
        }
    });
    await resolvers_1.pubsub.publish('BOOK_EDITED', {
        bookEdited: book.populate('author'),
    });
    return book.populate('author');
};
exports.default = editBook;
