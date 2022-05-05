import fs from 'fs'
import { FileUpload } from 'graphql-upload'
import path from 'path'
import UserModel from '../../../../../models/user'
import deleteUserProfilePhoto from '../../../../../modules/user/resolvers/mutations/deleteUserProfilePhoto'
import editUserProfilePhoto from '../../../../../modules/user/resolvers/mutations/editUserProfilePhoto'
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

test('can delete user profile photo', async () => {
    const file: FileUpload = {
        filename: 'testFile.png',
        mimetype: 'image/png',
        encoding: 'binary',
        createReadStream: () =>
            fs.createReadStream(
                path.join(__dirname, '../../../../helpers/testFile.png')
            ),
    }
    await editUserProfilePhoto(
        undefined,
        { profilePhoto: file },
        { currentUser: currentUser }
    )

    await deleteUserProfilePhoto(undefined, undefined, {
        currentUser: currentUser,
    })

    const userInDb = await UserModel.findOne({
        id: currentUser.id as string,
    }).populate<{ profilePhoto: File }>('profilePhoto')

    expect(userInDb?.profilePhoto).toBeNull()
})
