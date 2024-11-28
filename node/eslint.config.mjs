import globals from 'globals';
import pluginJs from '@eslint/js';
import jestFormatting from 'eslint-plugin-jest-formatting';

/** @type {import('eslint').Linter.Config[]} */
export default [
    pluginJs.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'commonjs'
        },
        rules: {
            'no-undef': 'off',
            indent: ['error', 4],
            'no-trailing-spaces': 'error'
        },
        plugins: { 'jest-formatting': jestFormatting }
    },
    {
        languageOptions: {
            globals: globals.browser
        }
    }
];
