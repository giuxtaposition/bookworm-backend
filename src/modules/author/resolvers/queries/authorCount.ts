import AuthorModel from '../../../../models/author'

const authorCount = async () => await AuthorModel.countDocuments()

export default authorCount
