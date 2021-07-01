const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
  },
  favoriteGenre: {
    type: String,
    minlength: 3,
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
