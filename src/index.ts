import { connect } from 'mongoose'
import { startApolloServer } from './server'
import config from './utils/config'

const connectToDB = async () => {
    console.log('connecting to', config.MONGODB_URI)

    try {
        await connect(config.MONGODB_URI)
        console.log('connected to MongoDB')
    } catch (error) {
        console.log('error connection to MongoDB:', (error as Error).message)
    }
}

void connectToDB()
void startApolloServer()
