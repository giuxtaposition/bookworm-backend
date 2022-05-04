import { UserInputError } from 'apollo-server-express'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import UserModel from '../../../../models/user'

const createUser = async (
    root,
    args: { username: string; password: string }
) => {
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(args.password, saltRounds)

    const currentUser = new UserModel({
        username: args.username,
        passwordHash,
        id: uuidv4(),
    })

    const savedUser = await currentUser.save().catch(error => {
        throw new UserInputError((error as Error).message, {
            invalidArgs: args,
        })
    })

    return savedUser
}
export default createUser
