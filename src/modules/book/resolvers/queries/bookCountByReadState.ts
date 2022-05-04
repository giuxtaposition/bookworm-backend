import { AuthenticationError } from 'apollo-server-express'
import BookModel from '../../../../models/book'
import { CurrentUser } from '../../../../types/User'

const bookCountByReadState = async (
    _,
    args: { readState: string },
    { currentUser }: { currentUser: CurrentUser }
) => {
    if (!currentUser) {
        throw new AuthenticationError('not authenticated')
    }

    const number = await BookModel.find({
        readState: args.readState,
        user: currentUser,
    }).countDocuments()

    return number
}

export default bookCountByReadState
