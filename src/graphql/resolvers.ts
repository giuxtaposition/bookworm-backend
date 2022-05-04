import { AuthenticationError, UserInputError } from 'apollo-server-express'
import axios from 'axios'
import bcrypt from 'bcrypt'
import fs from 'fs'
import { GraphQLScalarType } from 'graphql'
import { PubSub } from 'graphql-subscriptions'
import { FileUpload, GraphQLUpload } from 'graphql-upload'
import jwt from 'jsonwebtoken'
import moment, { MomentInput } from 'moment'
import { UpdateQuery } from 'mongoose'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import AuthorModel from '../models/author'
import BookModel from '../models/book'
import FileModel from '../models/file'
import UserModel from '../models/user'
import { SearchedBook } from '../types/Book'
import File from '../types/File'
import PopularBookResults from '../types/PopularBookResult'
import SearchResults, { SearchResult } from '../types/SearchResult'
import { CurrentUser, UserDocument } from '../types/User'
import config from '../utils/config'

export const pubsub = new PubSub()

const dateScalar = new GraphQLScalarType({
    name: 'Date',
    parseValue(value) {
        return moment(value as MomentInput, 'DD/MM/YYYY')
    },
    serialize(value) {
        return moment(value as MomentInput).format('DD/MM/YYYY')
    },
})

const dateTimeScalar = new GraphQLScalarType({
    name: 'DateTime',
    parseValue(value) {
        return moment(value as MomentInput, 'DD/MM/YYYY-HH:mm:ss')
    },
    serialize(value) {
        return moment(value as MomentInput).format('DD/MM/YYYY-HH:mm:ss')
    },
})

const processUpload = async (
    file: FileUpload,
    pathName: string,
    fileName: string
): Promise<File> => {
    const filePath =
        'images/' + pathName + fileName + path.extname(file.filename)
    if (!fs.existsSync('images/' + pathName)) {
        fs.mkdir('images/' + pathName, { recursive: true }, err => {
            if (err) throw err
        })
    }

    const stream = file.createReadStream()

    return new Promise((resolve, reject) => {
        stream
            .pipe(fs.createWriteStream(filePath))
            .on('finish', () => {
                resolve({
                    id: uuidv4(),
                    mimetype: file.mimetype,
                    filename: file.filename,
                    encoding: file.encoding,
                    location: filePath,
                } as File)
            })
            .on('error', err => {
                console.log('Error Event Emitted')
                console.log(err)
                reject()
            })
    })
}

const deleteFile = (filePath: string) => {
    try {
        fs.unlinkSync(path.resolve(filePath))
    } catch (err) {
        console.error(err)
    }
}

const resolvers = {
    Date: dateScalar,
    DateTime: dateTimeScalar,
    Upload: GraphQLUpload,
    File: {
        location: (
            parent: { location: string },
            _,
            { url }: { url: string }
        ) => {
            return parent.location && `${url}/${parent.location}`
        },
    },
    Query: {
        me: async (_, __, { currentUser }: { currentUser: CurrentUser }) => {
            if (!currentUser) {
                throw new AuthenticationError('not authenticated')
            }
            return await UserModel.findById(currentUser.id)
                .populate('profilePhoto')
                .populate('coverPhoto')
                .exec()
        },
        bookCount: async (
            _,
            __,
            { currentUser }: { currentUser: CurrentUser }
        ) => {
            if (!currentUser) {
                throw new AuthenticationError('not authenticated')
            }
            return await BookModel.find({ user: currentUser }).countDocuments()
        },
        authorCount: async () => await AuthorModel.countDocuments(),
        bookCountByReadState: async (
            _,
            args: { readState: string },
            { currentUser }: { currentUser: CurrentUser }
        ) => {
            if (!currentUser) {
                throw new AuthenticationError('not authenticated')
            }

            const number = await BookModel.find({
                readState: args.readState,
                user: currentUser,
            }).countDocuments()

            return number
        },

        allBooks: async (
            _,
            args: { author: string; genres: string[]; readState: string },
            { currentUser }: { currentUser: CurrentUser }
        ) => {
            if (!currentUser) {
                throw new AuthenticationError('not authenticated')
            }

            return await BookModel.find({
                ...args,
                user: currentUser,
            }).populate('author')
        },

        allAuthors: () => AuthorModel.find({}),

        allGenres: async () => {
            const allGenresList = await BookModel.find(
                {},
                { genres: 1, _id: 0 }
            )

            const genresList = () => {
                let cleanedUpList: string[] = []
                allGenresList.forEach(genre => {
                    genre.genres.forEach((g: string) => {
                        if (!cleanedUpList.includes(g)) {
                            cleanedUpList = cleanedUpList.concat(g)
                        }
                    })
                })
                return cleanedUpList
            }

            return genresList()
        },
        searchBooks: async (
            parent,
            args: { filter: string; searchParameter: string },
            {
                userLanguage,
                currentUser,
            }: { userLanguage: string; currentUser: CurrentUser }
        ) => {
            let languageFilter = '&langRestrict=en'

            if (userLanguage) {
                languageFilter = '&langRestrict=' + userLanguage
            }

            let filter = ''
            if (args.filter === 'title') {
                filter = '+intitle:'
            }
            if (args.filter === 'author') {
                filter = '+inauthor:'
            }
            if (args.filter === 'isbn') {
                filter = '+isbn:'
            }

            const apiKey = config.BOOKS_API_KEY

            if (!apiKey) {
                throw new Error('Books API Key not found')
            }

            const searchParams = args.searchParameter.replace(/\s/g, '+')

            const url = encodeURI(
                `https://www.googleapis.com/books/v1/volumes?q=${filter}${searchParams}&key=${apiKey}${languageFilter}&printType=books&maxResults=40`
            )

            try {
                const searchResults = (await axios.get<SearchResults>(url)).data
                    .items
                const booksToReturn: SearchedBook[] = []
                for (const book of searchResults) {
                    let bookCover = book.volumeInfo.imageLinks
                        ? book.volumeInfo.imageLinks.thumbnail
                        : ''

                    if (bookCover !== 'https:' && bookCover !== '') {
                        bookCover = 'https' + bookCover.slice(4)
                    }

                    const author =
                        book.volumeInfo.authors instanceof Array
                            ? book.volumeInfo.authors[0]
                            : book.volumeInfo.authors

                    booksToReturn.push({
                        title: book.volumeInfo.title,
                        author: author ?? '',
                        cover: bookCover,
                        pages: book.volumeInfo.pageCount,
                        published: book.volumeInfo.publishedDate,
                        genres: book.volumeInfo.categories,
                        id: book.id,
                        inLibrary: inLibrary(book, currentUser),
                    } as SearchedBook)
                }

                return []
            } catch (error) {
                console.error(error)
                return []
            }
        },
        searchBook: async (
            parent,
            args: { id: string },
            { currentUser }: { currentUser: CurrentUser }
        ) => {
            const url = encodeURI(
                `https://www.googleapis.com/books/v1/volumes/${args.id}?key=${config.BOOKS_API_KEY}`
            )

            try {
                const searchResult = (await axios.get<SearchResult>(url)).data

                let bookCover = searchResult.volumeInfo.imageLinks
                    ? searchResult.volumeInfo.imageLinks.thumbnail
                    : ''
                if (bookCover !== 'https:' && bookCover !== '') {
                    bookCover = 'https' + bookCover.slice(4)
                }

                const author = searchResult.volumeInfo.authors?.length
                    ? searchResult.volumeInfo.authors[0]
                    : searchResult.volumeInfo.authors

                return {
                    title: searchResult.volumeInfo.title,
                    author: author,
                    description: searchResult.volumeInfo.description,
                    cover: bookCover,
                    pages: searchResult.volumeInfo.pageCount,
                    published: searchResult.volumeInfo.publishedDate,
                    genres: searchResult.volumeInfo.categories,
                    language: searchResult.volumeInfo.language,
                    id: searchResult.id,
                    inLibrary: inLibrary(searchResult, currentUser),
                }
            } catch (error) {
                console.error(error)
            }
        },

        popularBooks: async () => {
            const url = `https://api.nytimes.com/svc/books/v3/lists.json?list-name=hardcover-fiction&api-key=
                ${config.NYT_API_KEY}`

            try {
                const books: SearchedBook[] = []

                const nytimesBestSellers = (
                    await axios.get<PopularBookResults>(url)
                ).data.results

                for (const bestSeller of nytimesBestSellers) {
                    const search = await axios.get<SearchResults>(
                        `https://www.googleapis.com/books/v1/volumes?q=isbn:${bestSeller.isbns[0].isbn10}&key=${config.BOOKS_API_KEY}`
                    )

                    const searchedBook = search.data.items[0]

                    if (searchedBook) {
                        let bookCover = searchedBook.volumeInfo.imageLinks
                            ? searchedBook.volumeInfo.imageLinks.thumbnail
                            : ''
                        if (bookCover !== 'https:' && bookCover !== '') {
                            bookCover = 'https' + bookCover.slice(4)
                        }
                        books.push({
                            title: searchedBook.volumeInfo.title,
                            author: searchedBook.volumeInfo.authors[0],
                            description: searchedBook.volumeInfo.description,
                            cover: bookCover,
                            pages: searchedBook.volumeInfo.pageCount,
                            published: searchedBook.volumeInfo.publishedDate,
                            genres: searchedBook.volumeInfo.categories,
                            language: searchedBook.volumeInfo.language,
                            id: searchedBook.id,
                        } as SearchedBook)
                    }
                }

                return books
            } catch (error) {
                console.error(error)
            }
        },
    },

    Mutation: {
        addBook: async (
            parent,
            args: {
                id: string
                author: string
                title: string
                published: Date
                genres: string[]
                pages: number
                cover: string
                readState: string
            },
            { currentUser }: { currentUser: CurrentUser }
        ) => {
            //Check if book is already in  user library
            const bookInLibrary = currentUser.books.filter(
                book => book.googleId === args.id
            )

            if (bookInLibrary.length) {
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
            if ((await AuthorModel.exists({ name: args.author })) === false) {
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
                { _id: currentUser.id as string },
                { $push: { books: book } }
            )

            await pubsub.publish('BOOK_ADDED', { bookAdded: book })

            return book
        },
        editBook: async (
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
        },
        deleteBook: async (
            parent,
            args: { id: string },
            { currentUser }: { currentUser: CurrentUser }
        ) => {
            if (!currentUser) {
                throw new UserInputError(
                    'You must be logged in to delete a Book'
                )
            }

            const book = await BookModel.findByIdAndDelete(args.id)
            if (!book) {
                throw new UserInputError('Book already deleted')
            }

            await UserModel.findOneAndUpdate(
                { _id: currentUser.id as string },
                {
                    $pull: { books: args.id },
                },
                { new: true },
                function (err, doc) {
                    console.log(err, doc)
                }
            )

            await pubsub.publish('BOOK_DELETED', {
                bookDeleted: book.populate('author'),
            })

            return book
        },
        createUser: async (
            root,
            args: { username: string; password: string }
        ) => {
            const saltRounds = 10
            const passwordHash = await bcrypt.hash(args.password, saltRounds)

            const currentUser = new UserModel({
                username: args.username,
                passwordHash,
                id: uuidv4(),
            })

            const savedUser = await currentUser.save().catch(error => {
                throw new UserInputError((error as Error).message, {
                    invalidArgs: args,
                })
            })

            return savedUser
        },
        login: async (root, args: { username: string; password: string }) => {
            if (!args.username || !args.password) {
                throw new UserInputError('Please provide username and password')
            }

            const currentUser = await UserModel.findOne({
                username: args.username,
            })

            const passwordCorrect =
                currentUser === null
                    ? false
                    : await bcrypt.compare(
                          args.password,
                          currentUser.passwordHash
                      )

            if (!(currentUser && passwordCorrect)) {
                throw new UserInputError('invalid username or password')
            }

            const userForToken = {
                username: currentUser.username,
                id: currentUser._id,
            }

            return {
                value: jwt.sign(userForToken, config.JWT_SECRET),
            }
        },
        editUser: async (
            root,
            args: UpdateQuery<UserDocument>,
            { currentUser }: { currentUser: CurrentUser }
        ) => {
            if (!currentUser) {
                throw new AuthenticationError('Must Login')
            }

            try {
                const user = await UserModel.findByIdAndUpdate(currentUser.id, {
                    ...args,
                })
                    .populate('profilePhoto')
                    .populate('coverPhoto')

                await pubsub.publish('USER_PROFILE_EDITED', {
                    userProfileUpdated: user,
                })

                return user
            } catch (error) {
                console.error(error)
            }
        },
        editUserProfilePhoto: async (
            root,
            args: { profilePhoto: FileUpload },
            { currentUser }: { currentUser: CurrentUser }
        ) => {
            if (!currentUser) {
                throw new AuthenticationError('Must Login')
            }

            if (currentUser.profilePhoto) {
                deleteFile(currentUser.profilePhoto.location)
            }

            const file = args.profilePhoto

            if (
                !(
                    file.mimetype === 'image/png' ||
                    file.mimetype === 'image/jpeg'
                )
            ) {
                throw new UserInputError('Must be an image')
            }

            const pathname = `user/${currentUser.username}/`

            const profilePhoto = await processUpload(
                file,
                pathname,
                'profilePhoto'
            )

            //Check if user has already a profilePhoto
            //If exists, replace old one
            const exists = await FileModel.findOneAndUpdate(
                { location: profilePhoto.location },
                { ...profilePhoto },
                function (error, result) {
                    if (error) {
                        throw new Error("Couldn't save profile Picture")
                    }
                }
            )

            //If not create new one
            if (!exists) {
                const profilePhotoFile = new FileModel({ ...profilePhoto })
                await profilePhotoFile.save()

                currentUser.profilePhoto = profilePhotoFile
                await currentUser.save()
            } else {
                //If already exists save updated one to  user
                currentUser.profilePhoto = exists
                await currentUser.save()
            }

            const user = await UserModel.findById(currentUser.id)
                .populate('profilePhoto')
                .populate('coverPhoto')
                .exec()

            await pubsub.publish('USER_PROFILE_EDITED', {
                userProfileUpdated: user,
            })

            return user
        },
        editUserCoverPhoto: async (
            root,
            args: { coverPhoto: FileUpload },
            { currentUser }: { currentUser: CurrentUser }
        ) => {
            if (!currentUser) {
                throw new AuthenticationError('Must Login')
            }

            if (currentUser.coverPhoto) {
                deleteFile(currentUser.coverPhoto.location)
            }

            const file = args.coverPhoto

            if (
                !(
                    file.mimetype === 'image/png' ||
                    file.mimetype === 'image/jpeg'
                )
            ) {
                throw new UserInputError('Must be an image')
            }

            const pathname = `user/${currentUser.username}/`

            const coverPhoto = await processUpload(file, pathname, 'coverPhoto')

            //Check if user has already a coverPhoto
            //If exists, replace old one
            const exists = await FileModel.findOneAndUpdate(
                { location: coverPhoto.location },
                { ...coverPhoto },
                function (error) {
                    if (error) {
                        throw new Error("Couldn't save cover Picture")
                    }
                }
            )

            //If not create new one
            if (!exists) {
                const coverPhotoFile = new FileModel({ ...coverPhoto })
                await coverPhotoFile.save()

                currentUser.coverPhoto = coverPhotoFile
                await currentUser.save()
            } else {
                //If already exists save updated one to  user
                currentUser.coverPhoto = exists
                await currentUser.save()
            }

            const user = await UserModel.findById(currentUser.id)
                .populate('profilePhoto')
                .populate('coverPhoto')
                .exec()

            await pubsub.publish('USER_PROFILE_EDITED', {
                userProfileUpdated: user,
            })
            return user
        },
        deleteUserProfilePhoto: async (
            _,
            __,
            { currentUser }: { currentUser: CurrentUser }
        ) => {
            if (!currentUser) {
                throw new AuthenticationError('Must Login')
            }

            deleteFile(currentUser.profilePhoto.location)

            const user = await UserModel.findOneAndUpdate(
                {
                    _id: currentUser.id as string,
                },
                { profilePhoto: null },
                {
                    new: true,
                }
            )
                .populate('profilePhoto')
                .populate('coverPhoto')
                .exec()

            void pubsub.publish('USER_PROFILE_EDITED', {
                userProfileUpdated: user,
            })

            return user
        },
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
        userProfileUpdated: {
            subscribe: () => pubsub.asyncIterator(['USER_PROFILE_EDITED']),
        },
    },
}

function inLibrary(book: SearchResult, currentUser?: CurrentUser): boolean {
    if (currentUser) {
        const bookFound = currentUser.books.find(
            bookInLIbrary => bookInLIbrary.googleId === book.id
        )

        return bookFound ? true : false
    }

    return false
}

export default resolvers
