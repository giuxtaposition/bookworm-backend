require('dotenv').config()

const PORT = process.env.PORT

const MONGODB_URI =
  process.env.NODE_ENV !== 'production'
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI

const JWT_SECRET = process.env.JWT_SECRET

const BOOKS_API_KEY = process.env.BOOKS_API_KEY

const NYT_API_KEY = process.env.NYT_API_KEY

module.exports = {
  MONGODB_URI,
  PORT,
  JWT_SECRET,
  BOOKS_API_KEY,
  NYT_API_KEY,
}
