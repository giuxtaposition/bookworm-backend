"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../../../../utils/config"));
const inLibrary_1 = __importDefault(require("../utils/inLibrary"));
const searchBooks = async (__parent, args, { userLanguage, currentUser }) => {
    let languageFilter = '&langRestrict=en';
    if (userLanguage) {
        languageFilter = '&langRestrict=' + userLanguage;
    }
    let filter = '';
    if (args.filter === 'title') {
        filter = '+intitle:';
    }
    if (args.filter === 'author') {
        filter = '+inauthor:';
    }
    if (args.filter === 'isbn') {
        filter = '+isbn:';
    }
    const searchParams = args.searchParameter.replace(/\s/g, '+');
    const url = encodeURI(`https://www.googleapis.com/books/v1/volumes?q=${filter}${searchParams}&key=${config_1.default.BOOKS_API_KEY}${languageFilter}&printType=books&maxResults=40`);
    try {
        const searchResults = (await axios_1.default.get(url)).data.items;
        const booksToReturn = [];
        for (const book of searchResults) {
            let bookCover = book.volumeInfo.imageLinks
                ? book.volumeInfo.imageLinks.thumbnail
                : '';
            if (bookCover !== 'https:' && bookCover !== '') {
                bookCover = 'https' + bookCover.slice(4);
            }
            const author = book.volumeInfo.authors instanceof Array
                ? book.volumeInfo.authors[0]
                : book.volumeInfo.authors;
            booksToReturn.push({
                title: book.volumeInfo.title,
                author: author ?? '',
                cover: bookCover,
                pages: book.volumeInfo.pageCount,
                published: book.volumeInfo.publishedDate,
                genres: book.volumeInfo.categories,
                id: book.id,
                inLibrary: (0, inLibrary_1.default)(book.id, currentUser),
            });
        }
        return booksToReturn;
    }
    catch (error) {
        console.error(error);
        return [];
    }
};
exports.default = searchBooks;
