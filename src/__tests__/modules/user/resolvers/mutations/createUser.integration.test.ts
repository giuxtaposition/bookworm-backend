import UserModel from '../../../../../models/user'
import createUser from '../../../../../modules/user/resolvers/mutations/createUser'
import { connectToDB, disconnectFromDB } from '../../../../helpers/dbUtils'

beforeAll(async () => {
    await connectToDB()
})

afterAll(async () => {
    await disconnectFromDB()
})

test('can create new user', async () => {
    const user = await createUser(undefined, {
        username: 'testCurrentUser',
        password: 'testPassword',
    })

    const userInDb = await UserModel.findOne({ id: user.id as string })

    expect(userInDb).toBeDefined()
    expect(userInDb?.username).toBe('testCurrentUser')
    expect(userInDb?.passwordHash).toBeTruthy()
})
