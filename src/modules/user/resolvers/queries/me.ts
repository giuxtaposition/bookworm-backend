import {AuthenticationError} from 'apollo-server-express'
import {CurrentUser} from '../../../../types/User'

const me = (
  _: undefined,
  __: undefined,
  {currentUser}: {currentUser: CurrentUser},
) => {
  if (!currentUser) {
    throw new AuthenticationError('not authenticated')
  }
  return currentUser
}
export default me
