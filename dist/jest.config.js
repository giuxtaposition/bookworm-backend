"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    testPathIgnorePatterns: ['src/__tests__/helpers'],
    testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
};
exports.default = config;
