import {model, Schema} from 'mongoose'
import {Author} from '../types/Author'

const authorSchema = new Schema<Author>({
  name: {
    type: String,
    required: true,
    unique: true,
    minlength: 4,
  },
})

const AuthorModel = model<Author>('Author', authorSchema)
export default AuthorModel
