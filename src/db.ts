import { connect } from 'mongoose'
import config from './utils/config'

export const connectToDB = async () => {
    console.log('connecting to', config.MONGODB_URI)

    try {
        const db = await connect(config.MONGODB_URI)
        console.log('connected to MongoDB')
        return db
    } catch (error) {
        console.log('error connection to MongoDB:', (error as Error).message)
    }
}
