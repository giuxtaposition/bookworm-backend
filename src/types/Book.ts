import { Types } from 'mongoose'
import { Author } from './Author'
import User from './User'

export default interface Book {
    title: string
    published: Date
    author: Author
    pages: number
    insertion: Date
    genres: string[]
    cover: string
    readState: string
    googleId: string
    user: User
}

export interface BookDocument extends Omit<Book, 'author' | 'user'> {
    author: Types.ObjectId
    user: Types.ObjectId
}

export interface SearchedBook
    extends Omit<
        Book,
        'author' | 'user' | 'published' | 'insertion' | 'googleId' | 'readState'
    > {
    author: string
    inLibrary: boolean
    published: string
    id: string
    language: string
    description: string
}
