import { AuthenticationError } from 'apollo-server-express'
import UserModel from '../../../../models/user'
import { CurrentUser } from '../../../../types/User'

const me = async (_, __, { currentUser }: { currentUser: CurrentUser }) => {
    if (!currentUser) {
        throw new AuthenticationError('not authenticated')
    }
    return await UserModel.findById(currentUser.id)
        .populate('profilePhoto')
        .populate('coverPhoto')
        .exec()
}
export default me
