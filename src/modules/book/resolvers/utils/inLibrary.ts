import {CurrentUser} from '../../../../types/User'

const inLibrary = (bookId: string, currentUser?: CurrentUser): boolean => {
  if (currentUser) {
    const bookFound = currentUser.books?.find(
      bookInLIbrary => bookInLIbrary.googleId === bookId,
    )

    return bookFound ? true : false
  }

  return false
}

export default inLibrary
