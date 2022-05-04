import AuthorModel from '../../../models/author'
import BookModel from '../../../models/book'
import allAuthors from './queries/allAuthors'
import authorCount from './queries/authorCount'

const authorResolvers = {
    Query: {
        allAuthors,
        authorCount,
    },
    Author: {
        bookCount: async (root: { name: string }) => {
            const foundAuthor = await AuthorModel.findOne({ name: root.name })

            if (!foundAuthor) {
                throw new Error('Author not found')
            }

            const foundBooks = await BookModel.find({
                author: foundAuthor.id as string,
            })
            return foundBooks.length
        },
    },
}
export default authorResolvers
