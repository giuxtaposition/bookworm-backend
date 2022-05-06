import {MongoMemoryServer} from 'mongodb-memory-server'
import mongoose from 'mongoose'
import {createBookInDB} from './bookUtils'
import {createCurrentUser} from './userUtils'

let mongoServer: MongoMemoryServer

const connectToDB = async () => {
  await mongoose.disconnect()
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()

  try {
    const db = await mongoose.connect(mongoUri)
    return db
  } catch (error) {
    console.error(error)
  }
}

const disconnectFromDB = async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongoServer.stop()
}

const clearDB = async () => {
  try {
    const collections = mongoose.connection.collections
    for (const key in collections) {
      const collection = collections[key]
      await collection.deleteMany({})
    }
  } catch (error) {
    console.error(error)
  }
}

const populateDB = async () => {
  await createBookInDB()
  await createCurrentUser()
}

export {connectToDB, disconnectFromDB, clearDB, populateDB}
