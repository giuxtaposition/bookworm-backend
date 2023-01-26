"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("../../../../../models/user"));
const createUser_1 = __importDefault(require("../../../../../modules/user/resolvers/mutations/createUser"));
const dbUtils_1 = require("../../../../helpers/dbUtils");
beforeAll(async () => {
    await (0, dbUtils_1.connectToDB)();
});
afterAll(async () => {
    await (0, dbUtils_1.disconnectFromDB)();
});
test('can create new user', async () => {
    const returnedUser = await (0, createUser_1.default)(undefined, {
        username: 'testCurrentUser',
        password: 'testPassword',
    });
    const userInDb = await user_1.default.findOne({ id: returnedUser.id });
    expect(userInDb).toBeDefined();
    expect(userInDb?.username).toBe('testCurrentUser');
    expect(userInDb?.passwordHash).toBeTruthy();
    expect(returnedUser).toEqual(expect.objectContaining({
        id: userInDb?.id,
        username: userInDb?.username,
        name: userInDb?.name,
    }));
});
