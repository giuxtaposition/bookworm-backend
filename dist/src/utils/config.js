"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const PORT = process.env.PORT;
const MONGODB_URI = process.env.NODE_ENV !== 'production'
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const BOOKS_API_KEY = process.env.BOOKS_API_KEY;
const NYT_API_KEY = process.env.NYT_API_KEY;
if (!MONGODB_URI || !JWT_SECRET || !BOOKS_API_KEY || !NYT_API_KEY || !PORT) {
    throw new Error('Missing environment variables.');
}
const config = {
    MONGODB_URI,
    PORT,
    JWT_SECRET,
    BOOKS_API_KEY,
    NYT_API_KEY,
};
exports.default = config;
