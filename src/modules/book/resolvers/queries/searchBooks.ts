import axios from 'axios'
import {SearchedBook} from '../../../../types/Book'
import SearchResults from '../../../../types/SearchResult'
import {CurrentUser} from '../../../../types/User'
import config from '../../../../utils/config'
import inLibrary from '../utils/inLibrary'

const searchBooks = async (
  __parent: void,
  args: {filter: string; searchParameter: string},
  {userLanguage, currentUser}: {userLanguage: string; currentUser: CurrentUser},
) => {
  let languageFilter = '&langRestrict=en'

  if (userLanguage) {
    languageFilter = '&langRestrict=' + userLanguage
  }

  let filter = ''
  if (args.filter === 'title') {
    filter = '+intitle:'
  }
  if (args.filter === 'author') {
    filter = '+inauthor:'
  }
  if (args.filter === 'isbn') {
    filter = '+isbn:'
  }

  const searchParams = args.searchParameter.replace(/\s/g, '+')

  const url = encodeURI(
    `https://www.googleapis.com/books/v1/volumes?q=${filter}${searchParams}&key=${config.BOOKS_API_KEY}${languageFilter}&printType=books&maxResults=40`,
  )

  try {
    const searchResults = (await axios.get<SearchResults>(url)).data.items
    const booksToReturn: SearchedBook[] = []
    for (const book of searchResults) {
      let bookCover = book.volumeInfo.imageLinks
        ? book.volumeInfo.imageLinks.thumbnail
        : ''

      if (bookCover !== 'https:' && bookCover !== '') {
        bookCover = 'https' + bookCover.slice(4)
      }

      const author =
        book.volumeInfo.authors instanceof Array
          ? book.volumeInfo.authors[0]
          : book.volumeInfo.authors

      booksToReturn.push({
        title: book.volumeInfo.title,
        author: author ?? '',
        cover: bookCover,
        pages: book.volumeInfo.pageCount,
        published: book.volumeInfo.publishedDate,
        genres: book.volumeInfo.categories,
        id: book.id,
        inLibrary: inLibrary(book.id, currentUser),
      } as SearchedBook)
    }

    return booksToReturn
  } catch (error) {
    console.error(error)
    return []
  }
}

export default searchBooks
