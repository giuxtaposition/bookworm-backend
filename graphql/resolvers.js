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
const File = require('../models/file')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')
const { GraphQLScalarType } = require('graphql')
const axios = require('axios')
const moment = require('moment')
const { filterAsync, mapAsync } = require('../utils/helperFunctions')
const fs = require('fs')
const { GraphQLUpload } = require('graphql-upload')
const path = require('path')

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

const processUpload = async (file, pathName, fileName) => {
  const { createReadStream, mimetype, encoding, filename } = await file
  let filePath = 'images/' + pathName + fileName + path.extname(filename)
  if (!fs.existsSync('images/' + pathName)) {
    fs.mkdir('images/' + pathName, { recursive: true }, err => {
      if (err) throw err
    })
  }

  let stream = createReadStream()

  return new Promise((resolve, reject) => {
    stream
      .pipe(fs.createWriteStream(filePath))
      .on('finish', () => {
        resolve({
          id: uuidv4(),
          mimetype,
          filename,
          encoding,
          location: filePath,
        })
      })
      .on('error', err => {
        console.log('Error Event Emitted')
        console.log(err)
        reject()
      })
  })
}

const deleteFile = file => {
  try {
    fs.unlinkSync(path.resolve(file))
    //file removed
  } catch (err) {
    console.error(err)
  }
}

module.exports = {
  Date: dateScalar,
  DateTime: dateTimeScalar,
  Upload: GraphQLUpload,
  File: {
    location: (parent, _, { url }) => {
      return parent.location && `${url}/${parent.location}`
    },
  },
  Query: {
    me: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new AuthenticationError('not authenticated')
      }
      let user = await User.findById(currentUser.id)
        .populate('profilePhoto')
        .populate('coverPhoto')
        .exec()
      return user
    },
    bookCount: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new AuthenticationError('not authenticated')
      }
      return await Book.find({ user: currentUser }).countDocuments()
    },
    authorCount: () => Author.collection.countDocuments(),

    bookCountByReadState: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new AuthenticationError('not authenticated')
      }

      const number = await Book.find({
        readState: args.readState,
        user: currentUser,
      }).countDocuments()

      return number
    },

    allBooks: async (root, args, { currentUser }) => {
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

      if (args.readState) {
        return await Book.find({
          readState: args.readState,
          user: currentUser,
        }).populate('author')
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

    searchBooks: async (parent, args, { userLanguage, currentUser }) => {
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

      let url = encodeURI(
        'https://www.googleapis.com/books/v1/volumes?q=' +
          filter +
          args.searchParameter.replace(/\s/g, '+') +
          '&key=' +
          config.BOOKS_API_KEY +
          languageFilter +
          '&printType=books' +
          '&maxResults=40'
      )

      const response = await axios.get(url)

      const books = response.data.items.map(function (book) {
        let bookCover = book.volumeInfo.imageLinks
          ? book.volumeInfo.imageLinks.thumbnail
          : ''
        if (bookCover !== 'https:' && bookCover !== '') {
          bookCover = 'https' + bookCover.slice(4)
        }
        return {
          title: book.volumeInfo.title,
          author: book.volumeInfo.authors,
          cover: bookCover,
          pages: book.volumeInfo.pageCount,
          published: book.volumeInfo.publishedDate,
          genres: book.volumeInfo.categories,
          id: book.id,
        }
      })

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
    searchBook: async (parent, args, { currentUser }) => {
      let url = encodeURI(
        'https://www.googleapis.com/books/v1/volumes/' +
          args.id +
          '?key=' +
          config.BOOKS_API_KEY
      )

      const response = await axios.get(url)
      const bookData = response.data

      let bookCover = bookData.volumeInfo.imageLinks
        ? bookData.volumeInfo.imageLinks.thumbnail
        : ''
      if (bookCover !== 'https:' && bookCover !== '') {
        bookCover = 'https' + bookCover.slice(4)
      }

      const book = {
        title: bookData.volumeInfo.title,
        author: bookData.volumeInfo.authors,
        description: bookData.volumeInfo.description,
        cover: bookCover,
        pages: bookData.volumeInfo.pageCount,
        published: bookData.volumeInfo.publishedDate,
        genres: bookData.volumeInfo.categories,
        language: bookData.volumeInfo.language,
        id: bookData.id,
      }

      return book
    },
    // OLD
    // popularBooks: async () => {
    //   let popularBooksId = await Book.aggregate([
    //     {
    //       $group: {
    //         _id: { googleId: '$googleId' }, // group by the entire document's contents as in "compare the whole document"
    //         ids: { $push: '$_id' }, // create an array of all IDs that form this group
    //         count: { $sum: 1 }, // count the number of documents in this group
    //       },
    //     },
    //     {
    //       $match: {
    //         count: { $gt: 1 },
    //       },
    //     },
    //     {
    //       $sort: {
    //         count: -1,
    //       },
    //     },
    //   ])

    //   let popularBooks = mapAsync(popularBooksId, async id => {
    //     let book = await Book.findOne({ googleId: id._id.googleId }).populate(
    //       'author'
    //     )
    //     return book
    //   })

    //   return popularBooks
    // },
    popularBooks: async () => {
      let url =
        'https://api.nytimes.com/svc/books/v3/lists.json?list-name=hardcover-fiction&api-key=' +
        config.NYT_API_KEY

      const response = await axios.get(url)
      const nytimesBestSellers = response.data.results
      const books = await mapAsync(nytimesBestSellers, async book => {
        let search = await axios.get(
          'https://www.googleapis.com/books/v1/volumes?q=isbn:' +
            book.isbns[0].isbn10 +
            '&key=' +
            config.BOOKS_API_KEY
        )

        let searchBook = search.data.items[0]

        if (searchBook) {
          let bookCover = searchBook.volumeInfo.imageLinks
            ? searchBook.volumeInfo.imageLinks.thumbnail
            : ''
          if (bookCover !== 'https:' && bookCover !== '') {
            bookCover = 'https' + bookCover.slice(4)
          }
          return {
            title: searchBook.volumeInfo.title,
            author: searchBook.volumeInfo.authors,
            description: searchBook.volumeInfo.description,
            cover: bookCover,
            pages: searchBook.volumeInfo.pageCount,
            published: searchBook.volumeInfo.publishedDate,
            genres: searchBook.volumeInfo.categories,
            language: searchBook.volumeInfo.language,
            id: searchBook.id,
          }
        }
      })

      return books
    },
  },

  Mutation: {
    //Add New Book
    addBook: async (parent, args, { currentUser }) => {
      //Check if book is already in  user library
      let bookInLibrary = currentUser.books.filter(
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
      // Save book to currentUser
      currentUser.books = currentUser.books.concat(book.id)
      await currentUser.save()

      pubsub.publish('BOOK_ADDED', { bookAdded: book })

      return book
    },

    //Edit Book
    editBook: async (parent, args, { currentUser }) => {
      if (!currentUser) {
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

      pubsub.publish('BOOK_EDITED', { bookEdited: book.populate('author') })

      return book.populate('author')
    },

    //Delete Book
    deleteBook: async (parent, args, { currentUser }) => {
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

      pubsub.publish('BOOK_DELETED', { bookDeleted: book.populate('author') })

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

      return {
        value: jwt.sign(userForToken, config.JWT_SECRET),
      }
    },

    // Edit User
    editUser: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new AuthenticationError('Must Login')
      }

      let user = await User.findByIdAndUpdate(
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
        .populate('profilePhoto')
        .populate('coverPhoto')
        .exec()

      pubsub.publish('USER_PROFILE_EDITED', { userProfileUpdated: user })

      return user
    },

    editUserProfilePhoto: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new AuthenticationError('Must Login')
      }

      if (currentUser.profilePhoto) {
        deleteFile(currentUser.profilePhoto.location)
      }

      let file = await args.profilePhoto

      if (!(file.mimetype === 'image/png' || file.mimetype === 'image/jpeg')) {
        throw new UserInputError('Must be an image')
      }

      let pathname = 'user/' + currentUser.username + '/'

      let profilePhoto = await processUpload(file, pathname, 'profilePhoto')

      //Check if user has already a profilePhoto
      //If exists, replace old one
      let exists = await File.findOneAndUpdate(
        { location: profilePhoto.location },
        { ...profilePhoto },
        function (error, result) {
          if (error) {
            throw new Error("Couldn't save profile Picture")
          } else {
          }
        }
      )

      //If not create new one
      if (!exists) {
        let profilePhotoFile = new File({ ...profilePhoto })
        await profilePhotoFile.save().catch(error => {
          throw new Error("Couldn't save profile Picture")
        })

        currentUser.profilePhoto = profilePhotoFile
        await currentUser.save().catch(error => {
          throw new Error("Couldn't save profile Picture")
        })
      } else {
        //If already exists save updated one to  user
        currentUser.profilePhoto = exists
        await currentUser.save().catch(error => {
          throw new Error("Couldn't save profile Picture")
        })
      }

      let user = await User.findById(currentUser.id)
        .populate('profilePhoto')
        .populate('coverPhoto')
        .exec()

      pubsub.publish('USER_PROFILE_EDITED', {
        userProfileUpdated: user,
      })

      return user
    },

    editUserCoverPhoto: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new AuthenticationError('Must Login')
      }

      if (currentUser.coverPhoto) {
        deleteFile(currentUser.coverPhoto.location)
      }

      let file = await args.coverPhoto

      if (!(file.mimetype === 'image/png' || file.mimetype === 'image/jpeg')) {
        throw new UserInputError('Must be an image')
      }

      let pathname = 'user/' + currentUser.username + '/'

      let coverPhoto = await processUpload(file, pathname, 'coverPhoto')

      //Check if user has already a coverPhoto
      //If exists, replace old one
      let exists = await File.findOneAndUpdate(
        { location: coverPhoto.location },
        { ...coverPhoto },
        function (error, result) {
          if (error) {
            throw new Error("Couldn't save cover Picture")
          } else {
          }
        }
      )

      //If not create new one
      if (!exists) {
        let coverPhotoFile = new File({ ...coverPhoto })
        await coverPhotoFile.save().catch(error => {
          throw new Error("Couldn't save cover Picture")
        })

        currentUser.coverPhoto = coverPhotoFile
        await currentUser.save().catch(error => {
          throw new Error("Couldn't save cover Picture")
        })
      } else {
        //If already exists save updated one to  user
        currentUser.coverPhoto = exists
        await currentUser.save().catch(error => {
          throw new Error("Couldn't save cover Picture")
        })
      }

      let user = await User.findById(currentUser.id)
        .populate('profilePhoto')
        .populate('coverPhoto')
        .exec()

      pubsub.publish('USER_PROFILE_EDITED', { userProfileUpdated: user })
      return user
    },
    deleteUserProfilePhoto: async (root, args, { currentUser }) => {
      if (!currentUser) {
        throw new AuthenticationError('Must Login')
      }

      deleteFile(currentUser.profilePhoto.location)

      let user = await User.findOneAndUpdate(
        { _id: currentUser.id },
        {
          profilePhoto: null,
        },
        { new: true },
        function (err, doc) {
          console.log(err, doc)
        }
      )
        .populate('profilePhoto')
        .populate('coverPhoto')
        .exec()

      pubsub.publish('USER_PROFILE_EDITED', {
        userProfileUpdated: user,
      })

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
    userProfileUpdated: {
      subscribe: () => pubsub.asyncIterator(['USER_PROFILE_EDITED']),
    },
  },
}
