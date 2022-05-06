import {hash} from 'bcrypt'
import {HydratedDocument} from 'mongoose'
import UserModel from '../../models/user'
import {CurrentUser, UserDocument} from '../../types/User'

export let currentUser: CurrentUser

export const createCurrentUser = async () => {
  const passwordHash = await hash('testPassword', 10)

  const user: HydratedDocument<UserDocument> = new UserModel({
    username: 'testCurrentUser',
    passwordHash: passwordHash,
    id: 'testCurrentUserId',
  })

  const userInDB = await user.save()

  currentUser = await userInDB.populate(['profilePhoto', 'coverPhoto', 'books'])
}

export const mockedCurrentUser = new UserModel({
  username: 'testCurrentUser',
  passwordHash: 'testPasswordHash',
  id: 'testCurrentUserId',
})
