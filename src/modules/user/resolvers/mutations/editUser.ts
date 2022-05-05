import { AuthenticationError } from 'apollo-server-express'
import { UpdateQuery } from 'mongoose'
import UserModel from '../../../../models/user'
import { CurrentUser, UserDocument } from '../../../../types/User'
import { pubsub } from '../../../shared/resolvers'

const editUser = async (
    root,
    args: UpdateQuery<UserDocument>,
    { currentUser }: { currentUser: CurrentUser }
) => {
    if (!currentUser) {
        throw new AuthenticationError('Must Login')
    }

    try {
        const user = await UserModel.findByIdAndUpdate(currentUser.id, {
            ...args,
        }).populate(['profilePhoto', 'coverPhoto'])

        await pubsub.publish('USER_PROFILE_EDITED', {
            userProfileUpdated: user,
        })

        return user
    } catch (error) {
        console.error(error)
    }
}

export default editUser
