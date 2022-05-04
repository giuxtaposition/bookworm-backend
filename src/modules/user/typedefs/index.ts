import { gql } from 'apollo-server-express'
import types from './types'

export default [
    gql`
        type Query {
            me: User!
        }
        type Mutation {
            createUser(
                username: String!
                favoriteGenre: String
                password: String!
            ): User

            login(username: String!, password: String!): Token

            editUser(
                name: String
                email: String
                bio: String
                favoriteGenre: String
            ): User

            editUserProfilePhoto(profilePhoto: Upload!): User

            editUserCoverPhoto(coverPhoto: Upload!): User

            deleteUserProfilePhoto: User
        }
        type Subscription {
            userProfileUpdated: User!
        }
    `,
    types,
]
