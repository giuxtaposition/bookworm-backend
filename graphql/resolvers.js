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
const { filterAsync } = require('../utils/helperFunctions')

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
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),

    bookCountByReadState: async (root, args) => {
      const number = await Book.find({
        readState: args.readState,
      }).countDocuments()

      return number
    },

    allBooks: async (root, args) => {
      if (args.author && args.genres) {
        const booksByAuthorAndGenres = await Book.find({
          author: args.author,
          genres: args.genres,
        })
        return booksByAuthorAndGenres.populate('author')
      }
      if (args.author) {
        return await Book.find({ author: args.author }).populate('author')
      }
      if (args.genres) {
        const books = await Book.find({}).populate('author')
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

      return await Book.find({}).populate('author')
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
        '&maxResults=20'

      const response = await axios.get(url)
      const books = await response.data.items.map(book => {
        return {
          title: book.volumeInfo.title,
          author: book.volumeInfo.authors,
          cover:
            book.volumeInfo.imageLinks === undefined
              ? ''
              : book.volumeInfo.imageLinks.thumbnail,
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
  },

  Mutation: {
    //Add New Book
    addBook: async (parent, args, context) => {
      //Check if book is already in  server
      if (await Book.exists({ id: args.id })) {
        throw new UserInputError('Book is already in  library', {
          invalidArgs: args.id,
        })
      }

      if (!context.currentUser) {
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
      let currentUser = context.currentUser
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

    // Edit Favorite Genre
    addNewFavoriteGenre: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new AuthenticationError('Must Login')
      }

      // Check if already favorite genre
      const favoriteGenre = await User.exists({
        favoriteGenre: args.favoriteGenre,
      })
      if (favoriteGenre === false) {
        // If not add it
        currentUser.favoriteGenre = args.favoriteGenre
        await currentUser.save()
      }
      return currentUser
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
