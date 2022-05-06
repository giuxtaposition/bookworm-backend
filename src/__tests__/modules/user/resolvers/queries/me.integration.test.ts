import me from '../../../../../modules/user/resolvers/queries/me'
import {
  connectToDB,
  disconnectFromDB,
  populateDB,
} from '../../../../helpers/dbUtils'
import {currentUser} from '../../../../helpers/userUtils'

beforeAll(async () => {
  await connectToDB()
  await populateDB()
})

afterAll(async () => {
  await disconnectFromDB()
})

test('me query', () => {
  const user = me(undefined, undefined, {
    currentUser: currentUser,
  })

  expect(user).toBeDefined()

  expect(user?.id).toEqual(currentUser.id)
})
