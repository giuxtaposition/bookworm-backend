import fs from 'fs'
import { GraphQLScalarType } from 'graphql'
import { PubSub } from 'graphql-subscriptions'
import { FileUpload, GraphQLUpload } from 'graphql-upload'
import moment, { MomentInput } from 'moment'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import File from '../../types/File'

const dateScalar = new GraphQLScalarType({
    name: 'Date',
    parseValue(value) {
        return moment(value as MomentInput, 'DD/MM/YYYY')
    },
    serialize(value) {
        return moment(value as MomentInput).format('DD/MM/YYYY')
    },
})

const dateTimeScalar = new GraphQLScalarType({
    name: 'DateTime',
    parseValue(value) {
        return moment(value as MomentInput, 'DD/MM/YYYY-HH:mm:ss')
    },
    serialize(value) {
        return moment(value as MomentInput).format('DD/MM/YYYY-HH:mm:ss')
    },
})

export const processUpload = async (
    file: FileUpload,
    pathName: string,
    fileName: string
): Promise<File> => {
    const filePath =
        'images/' + pathName + fileName + path.extname(file.filename)
    if (!fs.existsSync('images/' + pathName)) {
        fs.mkdir('images/' + pathName, { recursive: true }, err => {
            if (err) throw err
        })
    }

    const stream = file.createReadStream()

    return new Promise((resolve, reject) => {
        stream
            .pipe(fs.createWriteStream(filePath))
            .on('finish', () => {
                resolve({
                    id: uuidv4(),
                    mimetype: file.mimetype,
                    filename: file.filename,
                    encoding: file.encoding,
                    location: filePath,
                } as File)
            })
            .on('error', err => {
                console.log('Error Event Emitted')
                console.log(err)
                reject()
            })
    })
}

export const deleteFile = (filePath: string) => {
    try {
        fs.unlinkSync(path.resolve(filePath))
    } catch (err) {
        console.error(err)
    }
}

export default {
    Date: dateScalar,
    DateTime: dateTimeScalar,
    Upload: GraphQLUpload,
    File: {
        location: (
            parent: { location: string },
            _,
            { url }: { url: string }
        ) => {
            return parent.location && `${url}/${parent.location}`
        },
    },
}

export const pubsub = new PubSub()
