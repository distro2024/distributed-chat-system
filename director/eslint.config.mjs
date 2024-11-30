import globals from 'globals';
import pluginJs from '@eslint/js';

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
        plugins: {}
    },
    {
        languageOptions: {
            globals: globals.browser
        }
    }
];
