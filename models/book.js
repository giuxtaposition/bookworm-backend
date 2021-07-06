const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    minlength: 2,
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

module.exports = mongoose.model('Book', schema)
