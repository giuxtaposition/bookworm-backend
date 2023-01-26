"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const user_1 = __importDefault(require("../../../../../models/user"));
const editUserCoverPhoto_1 = __importDefault(require("../../../../../modules/user/resolvers/mutations/editUserCoverPhoto"));
const dbUtils_1 = require("../../../../helpers/dbUtils");
const userUtils_1 = require("../../../../helpers/userUtils");
beforeAll(async () => {
    await (0, dbUtils_1.connectToDB)();
    await (0, dbUtils_1.populateDB)();
});
afterAll(async () => {
    await (0, dbUtils_1.disconnectFromDB)();
});
test('can edit user cover photo', async () => {
    const file = {
        filename: 'testFile.png',
        mimetype: 'image/png',
        encoding: 'binary',
        createReadStream: () => fs_1.default.createReadStream(path_1.default.join(__dirname, '../../../../helpers/testFile.png')),
    };
    await (0, editUserCoverPhoto_1.default)(undefined, { coverPhoto: file }, { currentUser: userUtils_1.currentUser });
    const userInDb = await user_1.default.findOne({
        id: userUtils_1.currentUser.id,
    }).populate('coverPhoto');
    expect(userInDb?.coverPhoto).toBeDefined();
});
