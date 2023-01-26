"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_1 = __importDefault(require("../../../../../models/user"));
const createUser_1 = __importDefault(require("../../../../../modules/user/resolvers/mutations/createUser"));
describe('can create user', () => {
    test('when username is not already taken', async () => {
        const bcryptSpy = jest.spyOn(bcrypt_1.default, 'hash');
        const userModelSaveSpy = jest.spyOn(user_1.default.prototype, 'save');
        userModelSaveSpy.mockResolvedValue(true);
        user_1.default.findOne = jest.fn().mockResolvedValue(null);
        const createdUser = await (0, createUser_1.default)(undefined, {
            username: 'testCurrentUser',
            password: 'testPassword',
        });
        expect(bcryptSpy).toHaveBeenCalledWith('testPassword', 10);
        expect(userModelSaveSpy).toHaveBeenCalled();
        expect(createdUser.username).toBe('testCurrentUser');
    });
    test('if username already taken throw error', async () => {
        user_1.default.findOne = jest.fn().mockResolvedValue(true);
        await expect(async () => {
            await (0, createUser_1.default)(undefined, {
                username: 'testCurrentUser',
                password: 'testPassword',
            });
        }).rejects.toThrow(apollo_server_express_1.UserInputError);
    });
});
