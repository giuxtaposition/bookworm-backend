import BookModel from '../../../../models/book'

const allGenres = async () => {
  const allGenresList = await BookModel.find({}, {genres: 1, _id: 0})

  const genresList = () => {
    let cleanedUpList: string[] = []
    allGenresList.forEach(genre => {
      genre.genres.forEach((g: string) => {
        if (!cleanedUpList.includes(g)) {
          cleanedUpList = cleanedUpList.concat(g)
        }
      })
    })
    return cleanedUpList
  }

  return genresList()
}

export default allGenres
