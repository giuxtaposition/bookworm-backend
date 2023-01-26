"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../../../../utils/config"));
const inLibrary_1 = __importDefault(require("../utils/inLibrary"));
const searchBook = async (_parent, args, { currentUser }) => {
    const url = encodeURI(`https://www.googleapis.com/books/v1/volumes/${args.id}?key=${config_1.default.BOOKS_API_KEY}`);
    try {
        const searchResult = (await axios_1.default.get(url)).data;
        let bookCover = searchResult.volumeInfo.imageLinks
            ? searchResult.volumeInfo.imageLinks.thumbnail
            : '';
        if (bookCover !== 'https:' && bookCover !== '') {
            bookCover = 'https' + bookCover.slice(4);
        }
        const author = searchResult.volumeInfo.authors?.length
            ? searchResult.volumeInfo.authors[0]
            : searchResult.volumeInfo.authors;
        return {
            title: searchResult.volumeInfo.title,
            author: author,
            description: searchResult.volumeInfo.description,
            cover: bookCover,
            pages: searchResult.volumeInfo.pageCount,
            published: searchResult.volumeInfo.publishedDate,
            genres: searchResult.volumeInfo.categories,
            language: searchResult.volumeInfo.language,
            id: searchResult.id,
            inLibrary: (0, inLibrary_1.default)(searchResult.id, currentUser),
        };
    }
    catch (error) {
        console.error(error);
    }
};
exports.default = searchBook;
