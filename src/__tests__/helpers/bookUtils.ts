import {Types} from 'mongoose'
import {v4 as uuid} from 'uuid'
import BookModel from '../../models/book'
import {BookDocument} from '../../types/Book'

const createBookInDB = async (
  book: BookDocument = testBook,
): Promise<BookDocument> => {
  const bookModel = new BookModel(book)
  return await bookModel.save()
}

const testBook: BookDocument = {
  title: 'testBook',
  user: new Types.ObjectId(),
  published: new Date(),
  pages: 0,
  insertion: new Date(),
  genres: [],
  cover: 'aCoverLink',
  readState: 'read',
  googleId: uuid(),
  id: uuid(),
}

export {createBookInDB, testBook}
