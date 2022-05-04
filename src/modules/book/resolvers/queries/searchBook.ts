import axios from 'axios'
import { SearchResult } from '../../../../types/SearchResult'
import { CurrentUser } from '../../../../types/User'
import config from '../../../../utils/config'
import inLibrary from '../utils/inLibrary'

const searchBook = async (
    parent,
    args: { id: string },
    { currentUser }: { currentUser: CurrentUser }
) => {
    const url = encodeURI(
        `https://www.googleapis.com/books/v1/volumes/${args.id}?key=${config.BOOKS_API_KEY}`
    )

    try {
        const searchResult = (await axios.get<SearchResult>(url)).data

        let bookCover = searchResult.volumeInfo.imageLinks
            ? searchResult.volumeInfo.imageLinks.thumbnail
            : ''
        if (bookCover !== 'https:' && bookCover !== '') {
            bookCover = 'https' + bookCover.slice(4)
        }

        const author = searchResult.volumeInfo.authors?.length
            ? searchResult.volumeInfo.authors[0]
            : searchResult.volumeInfo.authors

        return {
            title: searchResult.volumeInfo.title,
            author: author,
            description: searchResult.volumeInfo.description,
            cover: bookCover,
            pages: searchResult.volumeInfo.pageCount,
            published: searchResult.volumeInfo.publishedDate,
            genres: searchResult.volumeInfo.categories,
            language: searchResult.volumeInfo.language,
            id: searchResult.id,
            inLibrary: inLibrary(searchResult.id, currentUser),
        }
    } catch (error) {
        console.error(error)
    }
}

export default searchBook
