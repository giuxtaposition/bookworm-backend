"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const fileSchema = new mongoose_1.Schema({
    mimetype: {
        type: String,
    },
    encoding: {
        type: String,
    },
    filename: {
        type: String,
    },
    location: {
        type: String,
    },
});
const FileModel = (0, mongoose_1.model)('File', fileSchema);
exports.default = FileModel;
