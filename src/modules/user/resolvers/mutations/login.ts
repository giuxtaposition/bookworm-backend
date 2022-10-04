import {UserInputError} from 'apollo-server-express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import UserModel from '../../../../models/user'
import config from '../../../../utils/config'

const login = async (
  root: void,
  args: {username: string; password: string},
) => {
  if (!args.username || !args.password) {
    throw new UserInputError('Please provide username and password')
  }

  const currentUser = await UserModel.findOne({
    username: args.username,
  })

  const passwordCorrect =
    currentUser === null
      ? false
      : await bcrypt.compare(args.password, currentUser.passwordHash)

  if (!(currentUser && passwordCorrect)) {
    throw new UserInputError('Invalid username or password')
  }

  const userForToken = {
    username: currentUser.username,
    id: currentUser._id,
  }

  return {
    value: jwt.sign(userForToken, config.JWT_SECRET),
  }
}

export default login
