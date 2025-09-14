# Eden - AI Sustainability Counter

A Chrome extension that tracks the environmental impact of AI usage on Claude.ai, built with React, TypeScript, and FastAPI.

## 🌱 Features

- **Real-time Token Counting**: Automatically detects and counts tokens from Claude.ai conversations
- **Environmental Impact Tracking**: Calculates energy consumption, CO₂ emissions, and water usage
- **Beautiful Dashboard**: Modern React interface with Tailwind CSS
- **Chrome Extension**: Works as both popup and sidebar
- **FastAPI Backend**: Deployed on Render for token counting and environmental calculations

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Python 3.11+ (for backend)
- Chrome browser

### 1. Clone the Repository
```bash
git clone https://github.com/lidiann/HackMIT2025.git
cd HackMIT2025
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Development Options

#### Option A: Web Development (Recommended for editing)
```bash
npm run dev
```
- Opens at `http://localhost:8080`
- Hot reload for React development
- Full development experience

#### Option B: Chrome Extension Development
```bash
# Build the extension
npm run build

# Load in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `dist` folder
```

## 🛠️ Development Workflow

### Editing React Components
1. **Start the dev server**: `npm run dev`
2. **Edit files** in the `src/` folder:
   - `src/components/` - React components
   - `src/pages/` - Page components
   - `src/hooks/` - Custom hooks
   - `src/services/` - API services
3. **See changes instantly** in the browser
4. **Build for extension**: `npm run build` when ready

### Key Files to Edit
- `src/components/AIUsageDashboard.tsx` - Main dashboard
- `src/components/TokenCounter.tsx` - Token counting interface
- `src/hooks/useAIUsage.ts` - Data management
- `src/services/api.ts` - API integration
- `content.js` - Claude.ai monitoring
- `background.js` - Extension service worker

### Chrome Extension Testing
1. Make changes to React files
2. Run `npm run build`
3. Go to `chrome://extensions/`
4. Click refresh on the extension
5. Test on `https://claude.ai`

## 📁 Project Structure

```
HackMIT2025/
├── src/                          # React frontend source
│   ├── components/               # React components
│   │   ├── AIUsageDashboard.tsx  # Main dashboard
│   │   ├── TokenCounter.tsx      # Token counter
│   │   └── ui/                   # UI components
│   ├── hooks/                    # Custom hooks
│   │   └── useAIUsage.ts         # Data management
│   ├── services/                 # API services
│   │   └── api.ts                # Backend integration
│   └── pages/                    # Page components
├── dist/                         # Built Chrome extension
├── content.js                    # Claude.ai content script
├── background.js                 # Extension service worker
├── manifest.json                 # Extension configuration
├── server.py                     # FastAPI backend
└── requirements.txt              # Python dependencies
```

## 🔧 Backend Setup (Optional)

If you want to run the backend locally:

```bash
# Install Python dependencies
pip install -r requirements.txt

# Set environment variable
export ANTHROPIC_API_KEY="your-api-key"

# Run the server
python server.py
```

The extension uses the deployed backend by default at `https://hackmit2025-pf5p.onrender.com`.

## 🎨 Styling

- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Responsive design** for popup and sidebar
- **Dark/light mode** support

## 📱 Chrome Extension Features

### Popup Mode
- Click extension icon for quick access
- Compact 350x500px interface
- Quick token counting

### Sidebar Mode
- Right-click extension → "Open side panel"
- Full-height interface
- Complete dashboard experience

### Auto-monitoring
- Automatically detects input on Claude.ai
- Counts tokens when you send messages
- Updates dashboard in real-time

## 🚀 Deployment

### Frontend (Chrome Extension)
1. Build: `npm run build`
2. Zip the `dist` folder
3. Upload to Chrome Web Store (or share zip file)

### Backend (FastAPI)
- Already deployed on Render
- Environment variables configured
- Auto-deploys from GitHub

## 🐛 Troubleshooting

### Extension Not Loading
- Check `dist/manifest.json` exists
- Verify all files in `dist/` folder
- Check Chrome console for errors

### API Calls Failing
- Verify backend is running: `https://hackmit2025-pf5p.onrender.com/health`
- Check network connectivity
- Look for CORS errors

### Development Issues
- Clear browser cache
- Restart dev server: `npm run dev`
- Check console for errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🌟 Acknowledgments

- Built for HackMIT 2025
- Uses Anthropic API for token counting
- Environmental impact calculations based on research data
