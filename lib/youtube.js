const fs = require("fs");
const path = require("path");

const defaultCookiesPath = path.resolve(__dirname, "..", "youtube_cookies.txt");

async function withYoutubeCookieFallback(operation, cookiesPath = defaultCookiesPath) {
    if (!fs.existsSync(cookiesPath)) {
        return operation({});
    }

    try {
        return await operation({ cookies: cookiesPath });
    } catch (cookiesError) {
        try {
            return await operation({});
        } catch (fallbackError) {
            const cookiesMessage = cookiesError instanceof Error ? cookiesError.message : String(cookiesError);
            const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
            const error = new Error(`YouTube failed with cookies (${cookiesMessage}) and without cookies (${fallbackMessage})`);
            error.cause = fallbackError;
            throw error;
        }
    }
}

module.exports = { withYoutubeCookieFallback };
