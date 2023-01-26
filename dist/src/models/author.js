"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const authorSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        minlength: 4,
    },
});
const AuthorModel = (0, mongoose_1.model)('Author', authorSchema);
exports.default = AuthorModel;
