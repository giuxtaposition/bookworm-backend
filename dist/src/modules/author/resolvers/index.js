"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const author_1 = __importDefault(require("../../../models/author"));
const book_1 = __importDefault(require("../../../models/book"));
const allAuthors_1 = __importDefault(require("./queries/allAuthors"));
const authorCount_1 = __importDefault(require("./queries/authorCount"));
const authorResolvers = {
    Query: {
        allAuthors: allAuthors_1.default,
        authorCount: authorCount_1.default,
    },
    Author: {
        bookCount: async (root) => {
            const foundAuthor = await author_1.default.findOne({ name: root.name });
            if (!foundAuthor) {
                throw new Error('Author not found');
            }
            const foundBooks = await book_1.default.find({
                author: foundAuthor.id,
            });
            return foundBooks.length;
        },
    },
};
exports.default = authorResolvers;
