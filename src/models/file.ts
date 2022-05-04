import { model, Schema } from 'mongoose'
import File from '../types/File'

const fileSchema = new Schema<File>({
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

const FileModel = model<File>('File', fileSchema)

export default FileModel
