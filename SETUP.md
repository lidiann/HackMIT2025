# Eden - AI Sustainability Counter Setup

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Up Environment Variables
Create a `.env` file:
```bash
cp .env.example .env
```

Edit `.env` with your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
PORT=8080
ALLOWED_ORIGIN=https://claude.ai
```

### 3. Start the API Server
```bash
python start-server.py
```

### 4. Load the Chrome Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this folder
4. Visit `claude.ai` and start using the extension!

## 🧪 Test the Setup
```bash
python test-api.py
```

## 🔒 Security Features
- ✅ API key stays on your server only
- ✅ No hardcoded secrets in extension
- ✅ CORS properly configured
- ✅ Rate limiting and monitoring possible

## 📊 How It Works
1. **Extension** detects text on Claude.ai
2. **Extension** sends text to your FastAPI server
3. **FastAPI server** calls Anthropic API with your key
4. **Server** calculates environmental impact
5. **Extension** displays results to user

## 🌐 For Other Users
- They need to run their own FastAPI server
- Or you can deploy the server and update the extension URL
- Much safer than sharing API keys!
