import {AuthenticationError} from 'apollo-server-express'
import BookModel from '../../../../models/book'
import {CurrentUser} from '../../../../types/User'

const bookCount = async (
  _: void,
  __: void,
  {currentUser}: {currentUser: CurrentUser},
) => {
  if (!currentUser) {
    throw new AuthenticationError('not authenticated')
  }
  return await BookModel.find({user: currentUser}).countDocuments()
}

export default bookCount
