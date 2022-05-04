import { AuthenticationError, UserInputError } from 'apollo-server-express'
import { FileUpload } from 'graphql-upload'
import FileModel from '../../../../models/file'
import UserModel from '../../../../models/user'
import { CurrentUser } from '../../../../types/User'
import { deleteFile, processUpload, pubsub } from '../../../shared/resolvers'

const editUserCoverPhoto = async (
    root,
    args: { coverPhoto: FileUpload },
    { currentUser }: { currentUser: CurrentUser }
) => {
    if (!currentUser) {
        throw new AuthenticationError('Must Login')
    }

    if (currentUser.coverPhoto) {
        deleteFile(currentUser.coverPhoto.location)
    }

    const file = args.coverPhoto

    if (!(file.mimetype === 'image/png' || file.mimetype === 'image/jpeg')) {
        throw new UserInputError('Must be an image')
    }

    const pathname = `user/${currentUser.username}/`

    const coverPhoto = await processUpload(file, pathname, 'coverPhoto')

    //Check if user has already a coverPhoto
    //If exists, replace old one
    const exists = await FileModel.findOneAndUpdate(
        { location: coverPhoto.location },
        { ...coverPhoto },
        function (error) {
            if (error) {
                throw new Error("Couldn't save cover Picture")
            }
        }
    )

    //If not create new one
    if (!exists) {
        const coverPhotoFile = new FileModel({ ...coverPhoto })
        await coverPhotoFile.save()

        currentUser.coverPhoto = coverPhotoFile
        await currentUser.save()
    } else {
        //If already exists save updated one to  user
        currentUser.coverPhoto = exists
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

export default editUserCoverPhoto
