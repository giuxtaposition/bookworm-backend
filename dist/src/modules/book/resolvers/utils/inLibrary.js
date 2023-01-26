"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inLibrary = (bookId, currentUser) => {
    if (currentUser) {
        const bookFound = currentUser.books?.find(bookInLIbrary => bookInLIbrary.googleId === bookId);
        return bookFound ? true : false;
    }
    return false;
};
exports.default = inLibrary;
