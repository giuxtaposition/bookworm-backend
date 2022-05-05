import UserModel from '../../../../../models/user'
import editUser from '../../../../../modules/user/resolvers/mutations/editUser'
import { connectToDB, disconnectFromDB } from '../../../../helpers/dbUtils'
import { createCurrentUser, currentUser } from '../../../../helpers/userUtils'

beforeAll(async () => {
    await connectToDB()
    await createCurrentUser()
})

afterAll(async () => {
    await disconnectFromDB()
})

test('can edit user', async () => {
    await editUser(
        undefined,
        {
            bio: 'test bio',
            favoriteGenre: 'fantasy',
        },
        { currentUser: currentUser }
    )

    const userInDb = await UserModel.findOne({
        id: currentUser.id as string,
    })

    expect(userInDb?.bio).toBe('test bio')
    expect(userInDb?.favoriteGenre).toBe('fantasy')
})
