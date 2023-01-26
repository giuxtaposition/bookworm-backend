"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateDB = exports.clearDB = exports.disconnectFromDB = exports.connectToDB = void 0;
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
const bookUtils_1 = require("./bookUtils");
const userUtils_1 = require("./userUtils");
let mongoServer;
const connectToDB = async () => {
    await mongoose_1.default.disconnect();
    mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    try {
        const db = await mongoose_1.default.connect(mongoUri);
        return db;
    }
    catch (error) {
        console.error(error);
    }
};
exports.connectToDB = connectToDB;
const disconnectFromDB = async () => {
    await mongoose_1.default.connection.dropDatabase();
    await mongoose_1.default.connection.close();
    await mongoServer.stop();
};
exports.disconnectFromDB = disconnectFromDB;
const clearDB = async () => {
    try {
        const collections = mongoose_1.default.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany({});
        }
    }
    catch (error) {
        console.error(error);
    }
};
exports.clearDB = clearDB;
const populateDB = async () => {
    await (0, bookUtils_1.createBookInDB)();
    await (0, userUtils_1.createCurrentUser)();
};
exports.populateDB = populateDB;
