import axios from 'axios'
import { SearchedBook } from '../../../../types/Book'
import PopularBookResults from '../../../../types/PopularBookResult'
import SearchResults from '../../../../types/SearchResult'
import config from '../../../../utils/config'

const popularBooks = async () => {
    const url = `https://api.nytimes.com/svc/books/v3/lists.json?list-name=hardcover-fiction&api-key=
        ${config.NYT_API_KEY}`

    try {
        const books: SearchedBook[] = []

        const nytimesBestSellers = (await axios.get<PopularBookResults>(url))
            .data.results

        for (const bestSeller of nytimesBestSellers) {
            const search = await axios.get<SearchResults>(
                `https://www.googleapis.com/books/v1/volumes?q=isbn:${bestSeller.isbns[0].isbn10}&key=${config.BOOKS_API_KEY}`
            )

            const searchedBook = search.data.items[0]

            if (searchedBook) {
                let bookCover = searchedBook.volumeInfo.imageLinks
                    ? searchedBook.volumeInfo.imageLinks.thumbnail
                    : ''
                if (bookCover !== 'https:' && bookCover !== '') {
                    bookCover = 'https' + bookCover.slice(4)
                }

                books.push({
                    title: searchedBook.volumeInfo.title,
                    author: searchedBook.volumeInfo.authors[0],
                    description: searchedBook.volumeInfo.description,
                    cover: bookCover,
                    pages: searchedBook.volumeInfo.pageCount,
                    published: searchedBook.volumeInfo.publishedDate,
                    genres: searchedBook.volumeInfo.categories,
                    language: searchedBook.volumeInfo.language,
                    id: searchedBook.id,
                    inLibrary: false,
                } as SearchedBook)
            }
        }

        return books
    } catch (error) {
        console.error(error)
    }
}

export default popularBooks
