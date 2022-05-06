import {AuthenticationError} from 'apollo-server-express'
import BookModel from '../../../../models/book'
import {CurrentUser} from '../../../../types/User'

const allBooks = async (
  _: undefined,
  args: {author?: string; genres?: string[]; readState?: string},
  {currentUser}: {currentUser: CurrentUser},
) => {
  if (!currentUser) {
    throw new AuthenticationError('not authenticated')
  }

  return await BookModel.find({
    ...args,
    user: currentUser,
  })
    .populate({path: 'author', options: {lean: true}})
    .lean()
    .exec()
}

export default allBooks
