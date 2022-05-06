import {AuthenticationError, UserInputError} from 'apollo-server-express'
import {v4 as uuidv4} from 'uuid'
import AuthorModel from '../../../../models/author'
import BookModel from '../../../../models/book'
import UserModel from '../../../../models/user'
import {CurrentUser} from '../../../../types/User'
import {pubsub} from '../../../shared/resolvers'
import inLibrary from '../utils/inLibrary'

export interface AddBookArgs {
  id: string
  author: string
  title: string
  published: Date
  genres: string[]
  pages: number
  cover: string
  readState: string
}

const addBook = async (
  _parent: void,
  args: AddBookArgs,
  {currentUser}: {currentUser: CurrentUser},
) => {
  if (inLibrary(args.id, currentUser)) {
    throw new UserInputError('Book is already in  library', {
      invalidArgs: args.id,
    })
  }

  if (!currentUser) {
    throw new AuthenticationError('not authenticated')
  }

  let author = await AuthorModel.findOne({
    name: args.author,
  })
  // Check if author in server
  if (!author) {
    //If not add new author
    author = new AuthorModel({
      name: args.author,
      id: uuidv4(),
    })
    try {
      await author.save()
    } catch (error) {
      throw new UserInputError((error as Error).message, {
        invalidArgs: args,
      })
    }
  }

  const book = new BookModel({
    ...args,
    id: uuidv4(),
    googleId: args.id,
    author,
    user: currentUser,
    insertion: new Date(),
  })

  try {
    await book.save()
  } catch (error) {
    throw new UserInputError((error as Error).message, {
      invalidArgs: args,
    })
  }
  // update user books with new book
  await UserModel.updateOne(
    {_id: currentUser.id as string},
    {$push: {books: book}},
  )

  await pubsub.publish('BOOK_ADDED', {bookAdded: book})

  return book
}

export default addBook
