const {
  UserInputError,
  PubSub,
  AuthenticationError,
} = require('apollo-server-express')
const config = require('../utils/config')
const pubsub = new PubSub()
const Book = require('../models/book')
const User = require('../models/user')
const Author = require('../models/author')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')
const { GraphQLScalarType } = require('graphql')
const axios = require('axios')
const moment = require('moment')
const { filterAsync, mapAsync } = require('../utils/helperFunctions')

const dateScalar = new GraphQLScalarType({
  name: 'Date',
  parseValue(value) {
    return moment(value, 'DD/MM/YYYY')
  },
  serialize(value) {
    return moment(value).format('DD/MM/YYYY')
  },
})

const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  parseValue(value) {
    return moment(value, 'DD/MM/YYYY-HH:mm:ss')
  },
  serialize(value) {
    return moment(value).format('DD/MM/YYYY-HH:mm:ss')
  },
})

module.exports = {
  Date: dateScalar,
  DateTime: dateTimeScalar,
  Query: {
    me: (root, args, context) => {
      return context.currentUser
    },
    bookCount: async (root, args, context) => {
      if (!context.currentUser) {
        throw new AuthenticationError('not authenticated')
      }
      return await Book.find({ user: context.currentUser }).countDocuments()
    },
    authorCount: () => Author.collection.countDocuments(),

    bookCountByReadState: async (root, args, context) => {
      if (!context.currentUser) {
        throw new AuthenticationError('not authenticated')
      }

      const number = await Book.find({
        readState: args.readState,
        user: context.currentUser,
      }).countDocuments()

      return number
    },

    allBooks: async (root, args, context) => {
      let currentUser = context.currentUser
      if (!currentUser) {
        throw new AuthenticationError('not authenticated')
      }

      if (args.author && args.genres) {
        const booksByAuthorAndGenres = await Book.find({
          author: args.author,
          genres: args.genres,
          user: currentUser,
        })
        return booksByAuthorAndGenres.populate('author')
      }
      if (args.author) {
        return await Book.find({
          author: args.author,
          user: currentUser,
        }).populate('author')
      }
      if (args.genres) {
        const books = await Book.find({ user: currentUser }).populate('author')
        let booksToReturn = []

        books.forEach(book => {
          let foundBook = args.genres.every(genre => {
            let found = false
            if (book.genres.includes(genre)) {
              found = true
            }
            return found
          })

          if (foundBook) {
            booksToReturn.push(book)
          }
        })

        return booksToReturn
      }

      return await Book.find({ user: currentUser }).populate('author')
    },

    allAuthors: () => Author.find({}),

    allGenres: async () => {
      const allGenresList = await Book.find({}, { genres: 1, _id: 0 })

      const genresList = () => {
        let cleanedUpList = []
        allGenresList.forEach(genre => {
          genre.genres.forEach(g => {
            if (!cleanedUpList.includes(g)) {
              cleanedUpList = cleanedUpList.concat(g)
            }
          })
        })
        return cleanedUpList
      }

      return genresList()
    },

    searchBooks: async (parent, args, context) => {
      let userLanguage = context.userLanguage
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

      let url =
        'https://www.googleapis.com/books/v1/volumes?q=' +
        filter +
        args.searchParameter +
        '&key=' +
        config.BOOKS_API_KEY +
        '&maxResults=20' +
        languageFilter +
        '&printType=books'

      const response = await axios.get(url)
      const books = await response.data.items.map(book => {
        let bookCover = book.volumeInfo.imageLinks.thumbnail
        if (bookCover !== 'https:') {
          bookCover = 'https' + bookCover.slice(4)
        }
        return {
          title: book.volumeInfo.title,
          author: book.volumeInfo.authors,
          cover: book.volumeInfo.imageLinks === undefined ? '' : bookCover,
          pages: book.volumeInfo.pageCount,
          published: book.volumeInfo.publishedDate,
          genres: book.volumeInfo.categories,
          id: book.id,
        }
      })

      let currentUser = context.currentUser

      const booksToReturn = await filterAsync(books, async book => {
        let exists = currentUser.books.find(
          bookId => bookId.googleId === book.id
        )
        if (!exists) {
          return true
        } else {
          return false
        }
      })

      return booksToReturn
    },
    popularBooks: async (parent, args, context) => {
      let popularBooksId = await Book.aggregate([
        {
          $group: {
            _id: { googleId: '$googleId' }, // group by the entire document's contents as in "compare the whole document"
            ids: { $push: '$_id' }, // create an array of all IDs that form this group
            count: { $sum: 1 }, // count the number of documents in this group
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ])

      let popularBooks = mapAsync(popularBooksId, async id => {
        let book = await Book.findOne({ googleId: id._id.googleId }).populate(
          'author'
        )
        return book
      })

      return popularBooks
    },
  },

  Mutation: {
    //Add New Book
    addBook: async (parent, args, context) => {
      let currentUser = context.currentUser
      //Check if book is already in  user library
      if (await User.findById(currentUser.id).exists({ books: args.id })) {
        throw new UserInputError('Book is already in  library', {
          invalidArgs: args.id,
        })
      }

      if (!currentUser) {
        throw new AuthenticationError('not authenticated')
      }

      let author = await Author.findOne({ name: args.author })
      // Check if author in server
      if ((await Author.exists({ name: args.author })) === false) {
        //If not add new author
        author = new Author({
          name: args.author,
          id: uuidv4(),
        })
        try {
          await author.save()
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          })
        }
      }

      const book = new Book({
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
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
      pubsub.publish('BOOK_ADDED', { bookAdded: book })

      // Save book to currentUser
      currentUser.books = currentUser.books.concat(book.id)
      await currentUser.save()

      return book
    },

    //Edit Book
    editBook: async (parent, args, context) => {
      if (!context.currentUser) {
        throw new UserInputError('You must be logged in to edit a Book')
      }

      let book = Book.findByIdAndUpdate(
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

      return book.populate('author')
    },

    //Delete Book
    deleteBook: async (parent, args, context) => {
      let currentUser = context.currentUser
      if (!currentUser) {
        throw new UserInputError('You must be logged in to delete a Book')
      }

      const book = await Book.findByIdAndDelete(args.id)
      if (!book) {
        throw new UserInputError('Book already deleted')
      }

      await User.findOneAndUpdate(
        { _id: currentUser.id },
        {
          $pull: { books: args.id },
        },
        { new: true },
        function (err, doc) {
          console.log(err, doc)
        }
      )

      return book
    },

    // Create New User
    createUser: async (root, args) => {
      const saltRounds = 10
      const passwordHash = await bcrypt.hash(args.password, saltRounds)

      const currentUser = new User({
        username: args.username,
        passwordHash,
        id: uuidv4(),
      })

      const savedUser = await currentUser.save().catch(error => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      })

      return savedUser
    },

    // LOGIN
    login: async (root, args) => {
      const currentUser = await User.findOne({ username: args.username })

      const passwordCorrect =
        currentUser === null
          ? false
          : await bcrypt.compare(args.password, currentUser.passwordHash)

      if (!(currentUser && passwordCorrect)) {
        throw new UserInputError('invalid username or password')
      }

      const userForToken = {
        username: currentUser.username,
        id: currentUser._id,
      }

      return { value: jwt.sign(userForToken, config.JWT_SECRET) }
    },

    // Edit User
    editUser: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new AuthenticationError('Must Login')
      }

      let user = User.findByIdAndUpdate(
        currentUser.id,
        { ...args },
        function (err, docs) {
          if (err) {
            throw new UserInputError('User not found')
          } else {
            console.log('Updated User: ', docs)
          }
        }
      )

      return user
    },
  },
  Author: {
    bookCount: async root => {
      const foundAuthor = await Author.findOne({ name: root.name })
      const foundBooks = await Book.find({ author: foundAuthor.id })
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
  },
}
