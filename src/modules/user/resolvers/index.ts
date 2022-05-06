import {pubsub} from '../../shared/resolvers'
import createUser from './mutations/createUser'
import deleteUserProfilePhoto from './mutations/deleteUserProfilePhoto'
import editUser from './mutations/editUser'
import editUserCoverPhoto from './mutations/editUserCoverPhoto'
import editUserProfilePhoto from './mutations/editUserProfilePhoto'
import login from './mutations/login'
import me from './queries/me'

const userResolvers = {
  Query: {
    me,
  },
  Mutation: {
    createUser,
    deleteUserProfilePhoto,
    editUser,
    editUserCoverPhoto,
    editUserProfilePhoto,
    login,
  },
  Subscription: {
    userProfileUpdated: {
      subscribe: () => pubsub.asyncIterator(['USER_PROFILE_EDITED']),
    },
  },
}
export default userResolvers
