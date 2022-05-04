import { UserInputError } from 'apollo-server-express'
import BookModel from '../../../../models/book'
import { CurrentUser } from '../../../../types/User'
import { pubsub } from '../../../shared/resolvers'

const editBook = async (
    parent,
    args: {
        id: string
        title: string
        published: Date
        author: string
        genres: string[]
        pages: number
        cover: string
        readState: string
    },
    { currentUser }: { currentUser: CurrentUser }
) => {
    if (!currentUser) {
        throw new UserInputError('You must be logged in to edit a Book')
    }

    const book = BookModel.findByIdAndUpdate(
        args.id,
        { ...args },
        function (err, docs) {
            if (err) {
                throw new UserInputError('Book not found')
            } else {
                console.log('Updated Book: ', docs)
            }
        }
    )

    await pubsub.publish('BOOK_EDITED', {
        bookEdited: book.populate('author'),
    })

    return book.populate('author')
}
export default editBook
