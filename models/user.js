const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
  },
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  bio: {
    type: String,
  },
  favoriteGenre: {
    type: String,
  },
  profilePhoto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
  },
  coverPhoto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
  },
  passwordHash: { type: String, required: true, minlength: 3 },
  books: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
    },
  ],
})
schema.plugin(uniqueValidator)

module.exports = mongoose.model('User', schema)
