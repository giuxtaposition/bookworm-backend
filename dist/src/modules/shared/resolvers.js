"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pubsub = exports.deleteFile = exports.processUpload = void 0;
const fs_1 = __importDefault(require("fs"));
const graphql_1 = require("graphql");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const graphql_upload_1 = require("graphql-upload");
const moment_1 = __importDefault(require("moment"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const dateScalar = new graphql_1.GraphQLScalarType({
    name: 'Date',
    parseValue(value) {
        return (0, moment_1.default)(value, 'DD/MM/YYYY');
    },
    serialize(value) {
        return (0, moment_1.default)(value).format('DD/MM/YYYY');
    },
});
const dateTimeScalar = new graphql_1.GraphQLScalarType({
    name: 'DateTime',
    parseValue(value) {
        return (0, moment_1.default)(value, 'DD/MM/YYYY-HH:mm:ss');
    },
    serialize(value) {
        return (0, moment_1.default)(value).format('DD/MM/YYYY-HH:mm:ss');
    },
});
const processUpload = async (file, pathName, fileName) => {
    const filePath = 'images/' + pathName + fileName + path_1.default.extname(file.filename);
    if (!fs_1.default.existsSync('images/' + pathName)) {
        fs_1.default.mkdir('images/' + pathName, { recursive: true }, err => {
            if (err)
                throw err;
        });
    }
    const stream = file.createReadStream();
    return new Promise((resolve, reject) => {
        stream
            .pipe(fs_1.default.createWriteStream(filePath))
            .on('finish', () => {
            resolve({
                id: (0, uuid_1.v4)(),
                mimetype: file.mimetype,
                filename: file.filename,
                encoding: file.encoding,
                location: filePath,
            });
        })
            .on('error', err => {
            console.log('Error Event Emitted');
            console.log(err);
            reject();
        });
    });
};
exports.processUpload = processUpload;
const deleteFile = (filePath) => {
    try {
        fs_1.default.unlinkSync(path_1.default.resolve(filePath));
    }
    catch (err) {
        console.error(err);
    }
};
exports.deleteFile = deleteFile;
exports.default = {
    Date: dateScalar,
    DateTime: dateTimeScalar,
    Upload: graphql_upload_1.GraphQLUpload,
    File: {
        location: (parent, _, { url }) => {
            return parent.location && `${url}/${parent.location}`;
        },
    },
};
exports.pubsub = new graphql_subscriptions_1.PubSub();
