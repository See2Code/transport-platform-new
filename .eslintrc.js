module.exports = {
  extends: [
    "react-app",
    "react-app/jest"
  ],
  plugins: [
    "unused-imports"
  ],
  rules: {
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      { "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }
    ]
  }
}; 