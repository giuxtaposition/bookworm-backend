import {UserInputError} from 'apollo-server-express'
import {hash} from 'bcrypt'
import {HydratedDocument} from 'mongoose'
import UserModel from '../../../../models/user'
import {UserDocument} from '../../../../types/User'

interface createUserArgs {
  username: string
  password: string
}

const createUser = async (
  _root: void,
  args: createUserArgs,
): Promise<HydratedDocument<UserDocument>> => {
  const {username, password} = args

  if (await UserModel.findOne({username})) {
    throw new UserInputError('Username already taken')
  }

  const saltRounds = 10
  const passwordHash = await hash(password, saltRounds)

  const user = new UserModel({
    username,
    passwordHash,
  })

  try {
    await user.save()
  } catch (error) {
    throw new UserInputError((error as Error).message, {
      invalidArgs: args,
    })
  }

  return user
}
export default createUser
