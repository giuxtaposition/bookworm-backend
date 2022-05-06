import {AuthenticationError, UserInputError} from 'apollo-server-express'
import {FileUpload} from 'graphql-upload'
import FileModel from '../../../../models/file'
import {CurrentUser} from '../../../../types/User'
import {deleteFile, processUpload, pubsub} from '../../../shared/resolvers'

const editUserCoverPhoto = async (
  root: void,
  args: {coverPhoto: FileUpload},
  {currentUser}: {currentUser: CurrentUser},
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

  const exists = await FileModel.findOneAndUpdate(
    {location: coverPhoto.location},
    {...coverPhoto},
  )

  if (!exists) {
    const coverPhotoFile = new FileModel({...coverPhoto})
    await coverPhotoFile.save()

    currentUser.coverPhoto = coverPhotoFile
    await currentUser.save()
  } else {
    currentUser.coverPhoto = exists
    await currentUser.save()
  }

  await pubsub.publish('USER_PROFILE_EDITED', {
    userProfileUpdated: currentUser,
  })
  return currentUser
}

export default editUserCoverPhoto
