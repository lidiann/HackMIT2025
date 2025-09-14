# 🚀 Developer Quick Start

## One-Command Setup
```bash
git clone https://github.com/lidiann/HackMIT2025.git
cd HackMIT2025
npm run setup
```

## Development Commands

### Web Development (Recommended)
```bash
npm run dev
# Opens http://localhost:8080 with hot reload
```

### Chrome Extension Development
```bash
npm run extension
# Builds extension and tells you to load dist/ folder in Chrome
```

### Other Commands
```bash
npm run build      # Build for production
npm run lint       # Check code quality
npm run clean      # Clean build files
```

## 📁 Key Files to Edit

| File | Purpose |
|------|---------|
| `src/components/AIUsageDashboard.tsx` | Main dashboard UI |
| `src/components/TokenCounter.tsx` | Token counting interface |
| `src/hooks/useAIUsage.ts` | Data management & API calls |
| `src/services/api.ts` | Backend API integration |
| `content.js` | Claude.ai page monitoring |
| `background.js` | Extension service worker |
| `manifest.json` | Extension configuration |

## 🔄 Development Workflow

1. **Edit React files** in `src/`
2. **Test in browser**: `npm run dev`
3. **Build extension**: `npm run extension`
4. **Load in Chrome**: Select `dist/` folder
5. **Test on Claude.ai**: Visit https://claude.ai

## 🎯 Common Tasks

### Add a New Component
```bash
# Create component in src/components/
# Import and use in AIUsageDashboard.tsx
```

### Modify API Calls
```bash
# Edit src/services/api.ts
# Update src/hooks/useAIUsage.ts
```

### Change Extension Behavior
```bash
# Edit content.js for page monitoring
# Edit background.js for service worker
```

### Update Styling
```bash
# Edit src/index.css for global styles
# Use Tailwind classes in components
```

## 🐛 Troubleshooting

- **Extension not loading**: Check `dist/` folder has all files
- **API errors**: Verify backend at https://hackmit2025-pf5p.onrender.com/health
- **Build errors**: Run `npm run clean && npm install`
- **Hot reload not working**: Restart `npm run dev`

## 📱 Testing

1. **Web version**: http://localhost:8080
2. **Chrome extension**: Load `dist/` folder
3. **Claude.ai**: Visit https://claude.ai and test

## 🎨 Styling

- **Tailwind CSS** for utility classes
- **shadcn/ui** for components
- **Responsive design** for popup/sidebar
- **Custom CSS** in `src/index.css`
