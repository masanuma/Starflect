const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.js$": "babel-jest"
  },
  moduleNameMapper: {
    '^ephimeris-moshier$': '<rootDir>/node_modules/ephimeris-moshier/Ephemeris.js'
  },
  transformIgnorePatterns: [
    "/node_modules/(?!ephimeris-moshier).+\\.js$"
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};