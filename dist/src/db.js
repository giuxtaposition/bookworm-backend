"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDB = void 0;
const mongoose_1 = require("mongoose");
const config_1 = __importDefault(require("./utils/config"));
const connectToDB = async () => {
    console.log('connecting to', config_1.default.MONGODB_URI);
    try {
        const db = await (0, mongoose_1.connect)(config_1.default.MONGODB_URI);
        console.log('connected to MongoDB');
        return db;
    }
    catch (error) {
        console.log('error connection to MongoDB:', error.message);
    }
};
exports.connectToDB = connectToDB;
