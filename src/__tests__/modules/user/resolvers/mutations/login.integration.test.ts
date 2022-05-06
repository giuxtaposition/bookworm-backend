import login from '../../../../../modules/user/resolvers/mutations/login'
import {
  connectToDB,
  disconnectFromDB,
  populateDB,
} from '../../../../helpers/dbUtils'

beforeAll(async () => {
  await connectToDB()
  await populateDB()
})

afterAll(async () => {
  await disconnectFromDB()
})

test('can login', async () => {
  const authToken = await login(undefined, {
    username: 'testCurrentUser',
    password: 'testPassword',
  })

  expect(authToken).toBeDefined()
})
