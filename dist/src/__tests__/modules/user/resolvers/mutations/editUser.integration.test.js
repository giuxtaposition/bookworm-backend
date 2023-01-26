"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("../../../../../models/user"));
const editUser_1 = __importDefault(require("../../../../../modules/user/resolvers/mutations/editUser"));
const dbUtils_1 = require("../../../../helpers/dbUtils");
const userUtils_1 = require("../../../../helpers/userUtils");
beforeAll(async () => {
    await (0, dbUtils_1.connectToDB)();
    await (0, userUtils_1.createCurrentUser)();
});
afterAll(async () => {
    await (0, dbUtils_1.disconnectFromDB)();
});
test('can edit user', async () => {
    await (0, editUser_1.default)(undefined, {
        bio: 'test bio',
        favoriteGenre: 'fantasy',
    }, { currentUser: userUtils_1.currentUser });
    const userInDb = await user_1.default.findOne({
        id: userUtils_1.currentUser.id,
    });
    expect(userInDb?.bio).toBe('test bio');
    expect(userInDb?.favoriteGenre).toBe('fantasy');
});
