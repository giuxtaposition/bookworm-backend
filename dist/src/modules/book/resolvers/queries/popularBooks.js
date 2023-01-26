"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../../../../utils/config"));
const popularBooks = async () => {
    const url = `https://api.nytimes.com/svc/books/v3/lists.json?list-name=hardcover-fiction&api-key=
        ${config_1.default.NYT_API_KEY}`;
    try {
        const books = [];
        const nytimesBestSellers = (await axios_1.default.get(url)).data
            .results;
        for (const bestSeller of nytimesBestSellers) {
            const search = await axios_1.default.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${bestSeller.isbns[0].isbn10}&key=${config_1.default.BOOKS_API_KEY}`);
            const searchedBook = search.data.items[0];
            if (searchedBook) {
                let bookCover = searchedBook.volumeInfo.imageLinks
                    ? searchedBook.volumeInfo.imageLinks.thumbnail
                    : '';
                if (bookCover !== 'https:' && bookCover !== '') {
                    bookCover = 'https' + bookCover.slice(4);
                }
                books.push({
                    title: searchedBook.volumeInfo.title,
                    author: searchedBook.volumeInfo.authors[0],
                    description: searchedBook.volumeInfo.description,
                    cover: bookCover,
                    pages: searchedBook.volumeInfo.pageCount,
                    published: searchedBook.volumeInfo.publishedDate,
                    genres: searchedBook.volumeInfo.categories,
                    language: searchedBook.volumeInfo.language,
                    id: searchedBook.id,
                    inLibrary: false,
                });
            }
        }
        return books;
    }
    catch (error) {
        console.error(error);
    }
};
exports.default = popularBooks;
