import {UserInputError} from 'apollo-server-core'
import BookModel from '../../../../models/book'
import UserModel from '../../../../models/user'
import {CurrentUser} from '../../../../types/User'
import {pubsub} from '../../../shared/resolvers'

const deleteBook = async (
  __parent: never,
  args: {id: string},
  {currentUser}: {currentUser: CurrentUser},
) => {
  if (!currentUser) {
    throw new UserInputError('You must be logged in to delete a Book')
  }

  const book = await BookModel.findByIdAndDelete(args.id)
  if (!book) {
    throw new UserInputError('Book already deleted')
  }

  await UserModel.findOneAndUpdate(
    {_id: currentUser.id as string},
    {
      $pull: {books: args.id},
    },
    {new: true},
    function (err, doc) {
      console.log(err, doc)
    },
  )

  await pubsub.publish('BOOK_DELETED', {
    bookDeleted: book.populate('author'),
  })

  return book
}

export default deleteBook
