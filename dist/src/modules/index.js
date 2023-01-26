"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const author_1 = __importDefault(require("./author"));
const book_1 = __importDefault(require("./book"));
const shared_1 = __importDefault(require("./shared"));
const user_1 = __importDefault(require("./user"));
exports.default = {
    typeDefs: [
        book_1.default.typeDefs,
        author_1.default.typeDefs,
        user_1.default.typeDefs,
        shared_1.default.typeDefs,
    ],
    resolvers: [
        book_1.default.resolvers,
        author_1.default.resolvers,
        user_1.default.resolvers,
        shared_1.default.resolvers,
    ],
};
