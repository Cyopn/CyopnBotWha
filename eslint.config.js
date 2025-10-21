
export default [
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
        },
        plugins: {},
        rules: {
            semi: ["error", "always"],
            "no-unused-vars": "off",
        },
    },
];

export const ignores = [
    "node_modules/**",
    "auth_info/**",
    "logs.txt",
    "temp/**",
    "media_storage/**",
];
