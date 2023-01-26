"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testBook = exports.createBookInDB = void 0;
const mongoose_1 = require("mongoose");
const uuid_1 = require("uuid");
const book_1 = __importDefault(require("../../models/book"));
const createBookInDB = async (book = testBook) => {
    const bookModel = new book_1.default(book);
    return await bookModel.save();
};
exports.createBookInDB = createBookInDB;
const testBook = {
    title: 'testBook',
    user: new mongoose_1.Types.ObjectId(),
    published: new Date(),
    pages: 0,
    insertion: new Date(),
    genres: [],
    cover: 'aCoverLink',
    readState: 'read',
    googleId: (0, uuid_1.v4)(),
    id: (0, uuid_1.v4)(),
};
exports.testBook = testBook;
