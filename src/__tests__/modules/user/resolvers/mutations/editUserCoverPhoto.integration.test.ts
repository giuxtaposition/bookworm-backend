import fs from 'fs'
import { FileUpload } from 'graphql-upload'
import path from 'path'
import UserModel from '../../../../../models/user'
import editUserCoverPhoto from '../../../../../modules/user/resolvers/mutations/editUserCoverPhoto'
import File from '../../../../../types/File'
import {
    connectToDB,
    disconnectFromDB,
    populateDB,
} from '../../../../helpers/dbUtils'
import { currentUser } from '../../../../helpers/userUtils'

beforeAll(async () => {
    await connectToDB()
    await populateDB()
})

afterAll(async () => {
    await disconnectFromDB()
})

test('can edit user cover photo', async () => {
    const file: FileUpload = {
        filename: 'testFile.png',
        mimetype: 'image/png',
        encoding: 'binary',
        createReadStream: () =>
            fs.createReadStream(
                path.join(__dirname, '../../../../helpers/testFile.png')
            ),
    }
    await editUserCoverPhoto(
        undefined,
        { coverPhoto: file },
        { currentUser: currentUser }
    )

    const userInDb = await UserModel.findOne({
        id: currentUser.id as string,
    }).populate<{ coverPhoto: File }>('coverPhoto')

    expect(userInDb?.coverPhoto).toBeDefined()
})
