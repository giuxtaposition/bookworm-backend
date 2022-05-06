import {UserInputError} from 'apollo-server-express'
import bcrypt from 'bcrypt'
import UserModel from '../../../../../models/user'
import createUser from '../../../../../modules/user/resolvers/mutations/createUser'

describe('can create user', () => {
  test('when username is not already taken', async () => {
    const bcryptSpy = jest.spyOn(bcrypt, 'hash')
    const userModelSaveSpy = jest.spyOn(UserModel.prototype, 'save')
    userModelSaveSpy.mockResolvedValue(true)
    UserModel.findOne = jest.fn().mockResolvedValue(null)

    const createdUser = await createUser(undefined, {
      username: 'testCurrentUser',
      password: 'testPassword',
    })

    expect(bcryptSpy).toHaveBeenCalledWith('testPassword', 10)
    expect(userModelSaveSpy).toHaveBeenCalled()
    expect(createdUser.username).toBe('testCurrentUser')
  })

  test('if username already taken throw error', async () => {
    UserModel.findOne = jest.fn().mockResolvedValue(true)

    await expect(async () => {
      await createUser(undefined, {
        username: 'testCurrentUser',
        password: 'testPassword',
      })
    }).rejects.toThrow(UserInputError)
  })
})
