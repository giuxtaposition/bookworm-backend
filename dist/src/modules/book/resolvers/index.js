"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const resolvers_1 = require("../../shared/resolvers");
const addBook_1 = __importDefault(require("./mutations/addBook"));
const deleteBook_1 = __importDefault(require("./mutations/deleteBook"));
const editBook_1 = __importDefault(require("./mutations/editBook"));
const allBooks_1 = __importDefault(require("./queries/allBooks"));
const allGenres_1 = __importDefault(require("./queries/allGenres"));
const bookCount_1 = __importDefault(require("./queries/bookCount"));
const bookCountByReadState_1 = __importDefault(require("./queries/bookCountByReadState"));
const popularBooks_1 = __importDefault(require("./queries/popularBooks"));
const searchBook_1 = __importDefault(require("./queries/searchBook"));
const searchBooks_1 = __importDefault(require("./queries/searchBooks"));
const bookResolvers = {
    Query: {
        allBooks: allBooks_1.default,
        allGenres: allGenres_1.default,
        bookCount: bookCount_1.default,
        bookCountByReadState: bookCountByReadState_1.default,
        popularBooks: popularBooks_1.default,
        searchBook: searchBook_1.default,
        searchBooks: searchBooks_1.default,
    },
    Mutation: {
        addBook: addBook_1.default,
        deleteBook: deleteBook_1.default,
        editBook: editBook_1.default,
    },
    Subscription: {
        bookAdded: {
            subscribe: () => resolvers_1.pubsub.asyncIterator(['BOOK_ADDED']),
        },
        bookDeleted: {
            subscribe: () => resolvers_1.pubsub.asyncIterator(['BOOK_DELETED']),
        },
        bookEdited: {
            subscribe: () => resolvers_1.pubsub.asyncIterator(['BOOK_EDITED']),
        },
    },
};
exports.default = bookResolvers;
