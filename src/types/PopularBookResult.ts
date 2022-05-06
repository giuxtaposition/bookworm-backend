export default interface PopularBookResults {
  results: PopularBookResult[]
}

export interface PopularBookResult {
  isbns: {
    isbn10: string
  }[]
}
