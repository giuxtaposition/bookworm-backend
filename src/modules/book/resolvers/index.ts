import {pubsub} from '../../shared/resolvers'
import addBook from './mutations/addBook'
import deleteBook from './mutations/deleteBook'
import editBook from './mutations/editBook'
import allBooks from './queries/allBooks'
import allGenres from './queries/allGenres'
import bookCount from './queries/bookCount'
import bookCountByReadState from './queries/bookCountByReadState'
import popularBooks from './queries/popularBooks'
import searchBook from './queries/searchBook'
import searchBooks from './queries/searchBooks'

const bookResolvers = {
  Query: {
    allBooks,
    allGenres,
    bookCount,
    bookCountByReadState,
    popularBooks,
    searchBook,
    searchBooks,
  },
  Mutation: {
    addBook,
    deleteBook,
    editBook,
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED']),
    },
    bookDeleted: {
      subscribe: () => pubsub.asyncIterator(['BOOK_DELETED']),
    },
    bookEdited: {
      subscribe: () => pubsub.asyncIterator(['BOOK_EDITED']),
    },
  },
}
export default bookResolvers
