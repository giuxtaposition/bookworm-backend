import { HydratedDocument, Types } from 'mongoose'
import Book, { BookDocument } from './Book'
import File from './File'

export default interface User {
    username: string
    name: string
    email: string
    bio: string
    favoriteGenre: string
    profilePhoto?: File
    coverPhoto?: File
    books: Book[]
    passwordHash: string
}

export interface UserDocument
    extends Omit<User, 'books' | 'profilePhoto' | 'coverPhoto'> {
    profilePhoto?: Types.ObjectId
    coverPhoto?: Types.ObjectId
    books?: Types.ObjectId[]
}

export type CurrentUser = Omit<
    HydratedDocument<UserDocument>,
    'books' | 'profilePhoto' | 'coverPhoto'
> & {
    books?: BookDocument[]
    profilePhoto?: File
    coverPhoto?: File
}
