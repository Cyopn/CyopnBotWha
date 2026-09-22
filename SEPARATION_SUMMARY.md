# Separation of Express App and Bot Logic

## Changes Made

### 1. Created `app.ts`
- Contains all Express.js application setup and middleware
- Includes admin authentication routes
- Implements `/temp` static file serving for downloads
- Implements `/yt/formats/:filename` for YouTube format selection UI
- Implements `/yt/download/:filename` for handling format downloads with direct URL fallback
- Exports a `createApp(commandsMap)` function that takes the commands map and returns the Express app

### 2. Updated `index.ts`
- Removed all Express app setup code
- Now only contains:
  - Bot initialization and WhatsApp socket logic
  - Import and usage of the Express app via `createApp(commands)`
  - Command loading on startup
  - WhatsApp client connection startup
- The Express server is started within index.ts using the returned app from createApp

### 3. Key Features Preserved
- All existing functionality (ytmp4, ytmp3, yt commands) works with download links and 1-hour cleanup
- Admin panel routes remain functional
- Direct downloading from YouTube URLs when possible (bypassing ytdlp reprocessing)
- Fallback mechanisms for ytdlp downloading when direct download isn't possible
- Proper cleanup of temporary files both after sending and via timeouts
- TypeScript type safety maintained throughout

### 4. Technical Details
- The `createApp` function in app.ts accepts a Map of commands for use in the admin panel
- Express app is now decoupled from bot logic while maintaining the same startup behavior
- All routes and middleware are contained within app.ts
- Index.ts focuses solely on the WhatsApp bot functionality

## Verification
- TypeScript compiles without errors
- All route handlers and middleware functions are properly typed
- The separation maintains backward compatibility with existing command implementations

## Files Modified
- `app.ts` (new file containing Express app)
- `index.ts` (modified to use createApp and start server)
- `commands/yt.js` (unchanged, works with new system)
- `commands/ytmp3.js` (unchanged, works with new system)
- `commands/ytmp4.js` (unchanged, works with new system)
- `lib/scrapper.js` (unchanged, provides underlying functionality)

## Benefits
- Better separation of concerns (web server vs bot logic)
- Easier maintenance and testing of each component independently
- Clearer code organization
- Same external behavior and functionality preserved