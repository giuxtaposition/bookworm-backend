import { UserInputError } from 'apollo-server-express'
import { hash } from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import UserModel from '../../../../models/user'

const createUser = async (
    root,
    args: { username: string; password: string }
) => {
    const { username, password } = args

    if (await UserModel.findOne({ username })) {
        throw new UserInputError('Username already taken')
    }

    const saltRounds = 10
    const passwordHash = await hash(password, saltRounds)

    const user = new UserModel({
        username,
        passwordHash,
        id: uuidv4(),
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
