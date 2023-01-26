"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const book_1 = __importDefault(require("../../../../models/book"));
const allGenres = async () => {
    const allGenresList = await book_1.default.find({}, { genres: 1, _id: 0 });
    const genresList = () => {
        let cleanedUpList = [];
        allGenresList.forEach(genre => {
            genre.genres.forEach((g) => {
                if (!cleanedUpList.includes(g)) {
                    cleanedUpList = cleanedUpList.concat(g);
                }
            });
        });
        return cleanedUpList;
    };
    return genresList();
};
exports.default = allGenres;
