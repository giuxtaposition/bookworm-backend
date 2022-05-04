import mongoose, { model, Schema } from 'mongoose'
import { BookDocument } from '../types/Book'

const bookSchema = new Schema<BookDocument>({
    title: {
        type: String,
        required: true,
    },
    published: {
        type: Date,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Author',
    },
    pages: {
        type: Number,
    },
    insertion: {
        type: Date,
        required: true,
    },
    genres: [{ type: String }],
    cover: {
        type: String,
    },
    readState: {
        type: String,
        required: true,
    },
    googleId: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
})

const BookModel = model<BookDocument>('Book', bookSchema)
export default BookModel
