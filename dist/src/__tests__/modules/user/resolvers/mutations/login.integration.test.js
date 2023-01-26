"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const login_1 = __importDefault(require("../../../../../modules/user/resolvers/mutations/login"));
const dbUtils_1 = require("../../../../helpers/dbUtils");
beforeAll(async () => {
    await (0, dbUtils_1.connectToDB)();
    await (0, dbUtils_1.populateDB)();
});
afterAll(async () => {
    await (0, dbUtils_1.disconnectFromDB)();
});
test('can login', async () => {
    const authToken = await (0, login_1.default)(undefined, {
        username: 'testCurrentUser',
        password: 'testPassword',
    });
    expect(authToken).toBeDefined();
});
