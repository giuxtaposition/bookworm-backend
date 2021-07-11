const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  mimetype: {
    type: String,
  },
  encoding: {
    type: String,
  },
  filename: {
    type: String,
  },
  location: {
    type: String,
  },
})

module.exports = mongoose.model('File', schema)
