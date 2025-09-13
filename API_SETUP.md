# API Setup Guide for Eden - AI Sustainability Counter

## Quick Setup

1. **Get your API key** from your partner's environment
2. **Edit `api-config.js`** and replace `'sk-ant-your-api-key-here'` with your actual API key
3. **Load the extension** in Chrome - it will now use your API key automatically!

## Example

In `api-config.js`, change:
```javascript
ANTHROPIC_API_KEY: 'sk-ant-your-api-key-here',
```

To:
```javascript
ANTHROPIC_API_KEY: 'sk-ant-api03-abc123...',
```

## What Changed

- ✅ **Removed "Configure API" button** - no user setup needed
- ✅ **Added `api-config.js`** - easy place to set your API key
- ✅ **Updated `config.js`** - automatically loads from your config
- ✅ **Simplified user experience** - just install and use!

## Security Note

- The API key is now in your code, so keep `api-config.js` private
- Don't commit the real API key to public repositories
- Consider using environment variables in production builds

## Testing

1. Set your API key in `api-config.js`
2. Reload the extension in Chrome
3. Visit Claude.ai and start typing - you should see accurate token counts!
