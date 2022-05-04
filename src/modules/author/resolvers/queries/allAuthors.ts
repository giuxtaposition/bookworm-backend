import AuthorModel from '../../../../models/author'

const allAuthors = () => AuthorModel.find({})

export default allAuthors
