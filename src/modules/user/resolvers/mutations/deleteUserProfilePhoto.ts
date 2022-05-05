import { AuthenticationError } from 'apollo-server-express'
import UserModel from '../../../../models/user'
import { CurrentUser } from '../../../../types/User'
import { deleteFile, pubsub } from '../../../shared/resolvers'

const deleteUserProfilePhoto = async (
    _,
    __,
    { currentUser }: { currentUser: CurrentUser }
) => {
    if (!currentUser) {
        throw new AuthenticationError('Must Login')
    }

    if (!currentUser.profilePhoto) {
        throw new AuthenticationError('No profile photo to delete')
    }

    deleteFile(currentUser.profilePhoto.location)

    const user = await UserModel.findOneAndUpdate(
        {
            _id: currentUser.id as string,
        },
        { profilePhoto: null },
        {
            new: true,
        }
    )
        .populate('profilePhoto')
        .populate('coverPhoto')
        .exec()

    void pubsub.publish('USER_PROFILE_EDITED', {
        userProfileUpdated: user,
    })

    return user
}
export default deleteUserProfilePhoto
