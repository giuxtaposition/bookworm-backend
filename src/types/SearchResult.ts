export default interface SearchResults {
  items: SearchResult[]
}

export interface SearchResult {
  id: string
  volumeInfo: {
    title: string
    imageLinks?: {
      thumbnail: string
    }
    authors: string[] | string
    pageCount: number
    publishedDate: string
    categories: string[]
    description: string
    language: string
  }
}
