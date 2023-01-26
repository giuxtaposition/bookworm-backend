"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const me_1 = __importDefault(require("../../../../../modules/user/resolvers/queries/me"));
const dbUtils_1 = require("../../../../helpers/dbUtils");
const userUtils_1 = require("../../../../helpers/userUtils");
beforeAll(async () => {
    await (0, dbUtils_1.connectToDB)();
    await (0, dbUtils_1.populateDB)();
});
afterAll(async () => {
    await (0, dbUtils_1.disconnectFromDB)();
});
test('me query', () => {
    const user = (0, me_1.default)(undefined, undefined, {
        currentUser: userUtils_1.currentUser,
    });
    expect(user).toBeDefined();
    expect(user?.id).toEqual(userUtils_1.currentUser.id);
});
