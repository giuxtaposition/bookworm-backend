import { AuthenticationError, UserInputError } from 'apollo-server-express'
import { FileUpload } from 'graphql-upload'
import FileModel from '../../../../models/file'
import UserModel from '../../../../models/user'
import { CurrentUser } from '../../../../types/User'
import { deleteFile, processUpload, pubsub } from '../../../shared/resolvers'

const editUserProfilePhoto = async (
    root,
    args: { profilePhoto: FileUpload },
    { currentUser }: { currentUser: CurrentUser }
) => {
    if (!currentUser) {
        throw new AuthenticationError('Must Login')
    }

    if (currentUser.profilePhoto) {
        deleteFile(currentUser.profilePhoto.location)
    }

    const file = args.profilePhoto

    if (!(file.mimetype === 'image/png' || file.mimetype === 'image/jpeg')) {
        throw new UserInputError('Must be an image')
    }

    const pathname = `user/${currentUser.username}/`

    const profilePhoto = await processUpload(file, pathname, 'profilePhoto')

    //Check if user has already a profilePhoto
    //If exists, replace old one
    const exists = await FileModel.findOneAndUpdate(
        { location: profilePhoto.location },
        { ...profilePhoto },
        function (error) {
            if (error) {
                throw new Error("Couldn't save profile Picture")
            }
        }
    )

    //If not create new one
    if (!exists) {
        const profilePhotoFile = new FileModel({ ...profilePhoto })
        await profilePhotoFile.save()

        currentUser.profilePhoto = profilePhotoFile
        await currentUser.save()
    } else {
        //If already exists save updated one to  user
        currentUser.profilePhoto = exists
        await currentUser.save()
    }

    const user = await UserModel.findById(currentUser.id)
        .populate('profilePhoto')
        .populate('coverPhoto')
        .exec()

    await pubsub.publish('USER_PROFILE_EDITED', {
        userProfileUpdated: user,
    })

    return user
}

export default editUserProfilePhoto
