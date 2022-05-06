import {AuthenticationError, UserInputError} from 'apollo-server-express'
import {FileUpload} from 'graphql-upload'
import FileModel from '../../../../models/file'
import {CurrentUser} from '../../../../types/User'
import {deleteFile, processUpload, pubsub} from '../../../shared/resolvers'

const editUserProfilePhoto = async (
  root: unknown,
  args: {profilePhoto: FileUpload},
  {currentUser}: {currentUser: CurrentUser},
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

  const exists = await FileModel.findOneAndUpdate(
    {location: profilePhoto.location},
    {...file},
  )

  //If not create new one
  if (!exists) {
    const profilePhotoFile = new FileModel({...profilePhoto})
    await profilePhotoFile.save()

    currentUser.profilePhoto = profilePhotoFile
    await currentUser.save()
  } else {
    currentUser.profilePhoto = exists
    await currentUser.save()
  }

  await pubsub.publish('USER_PROFILE_EDITED', {
    userProfileUpdated: currentUser,
  })

  return currentUser
}

export default editUserProfilePhoto
