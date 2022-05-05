import type { InitialOptionsTsJest } from 'ts-jest'

const config: InitialOptionsTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    testPathIgnorePatterns: ['src/__tests__/helpers'],
}
export default config
