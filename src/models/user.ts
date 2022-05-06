import mongoose, {model, Schema} from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'
import {UserDocument} from '../types/User'

const userSchema = new Schema<UserDocument>({
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
  passwordHash: {type: String, required: true, minlength: 3},
  books: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
    },
  ],
})
userSchema.plugin(uniqueValidator)

const UserModel = model<UserDocument>('User', userSchema)
export default UserModel
