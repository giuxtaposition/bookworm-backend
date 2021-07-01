const { UserInputError, PubSub } = require('apollo-server-express')
const config = require('../utils/config')
const pubsub = new PubSub()
const Book = require('../models/book')
const User = require('../models/user')
const Author = require('../models/author')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')
const { GraphQLScalarType } = require('graphql')

const dateScalar = new GraphQLScalarType({
  name: 'Date',
  parseValue(value) {
    return new Date(value)
  },
  serialize(value) {
    return value.toISOString()
  },
})

module.exports = {
  Date: dateScalar,
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
  },

  Mutation: {
    //Add New Book
    addBook: async (root, args, context) => {
      //Check if book is already in  server
      if (await Book.exists({ title: args.title })) {
        throw new UserInputError('Title must be unique', {
          invalidArgs: args.title,
        })
      }

      const currentUser = context.currentUser
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
        author,
        insertion: new Date(),
        id: uuidv4(),
      })
      try {
        await book.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
      pubsub.publish('BOOK_ADDED', { bookAdded: book })

      return book
    },

    // Create New User
    createUser: async (root, args) => {
      const saltRounds = 10
      const passwordHash = await bcrypt.hash(args.password, saltRounds)

      const user = new User({
        username: args.username,
        passwordHash,
        id: uuidv4(),
      })

      const savedUser = await user.save().catch(error => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      })

      return savedUser
    },

    // LOGIN
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      const passwordCorrect =
        user === null
          ? false
          : await bcrypt.compare(args.password, user.passwordHash)

      if (!(user && passwordCorrect)) {
        throw new UserInputError('invalid username or password')
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      }

      return { value: jwt.sign(userForToken, config.JWT_SECRET) }
    },

    // Edit Favorite Genre
    addNewFavoriteGenre: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new AuthenticationError('not authenticated')
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
  },
}
