# 🌟 Digital Persona Platform - Zen Mode

Zen mode launches the application in fullscreen without browser UI for an immersive experience.

## 🚀 Launch Options

### Option 1: Full Zen Mode (Recommended)

Launches both backend and frontend in Zen mode:

```bash
./start-zen-full.sh
```

### Option 2: Frontend Only Zen Mode

Launches only the frontend in Zen mode:

```bash
cd frontend
npm run start:zen
```

### Option 3: Manual Zen Mode

Manual control over the launch process:

```bash
cd frontend
npm run start:zen:manual
```

### Option 4: Fullscreen Kiosk Mode

Launches in true fullscreen kiosk mode:

```bash
cd frontend
npm run start:fullscreen
```

## 🎯 What is Zen Mode?

Zen mode provides:

- **Fullscreen Experience**: No browser UI (address bar, tabs, bookmarks)
- **App-like Feel**: Runs like a native application
- **Immersive Interface**: Focus on the Digital Persona Platform content
- **Professional Presentation**: Perfect for demos and presentations

## 🖥️ Browser Support

### macOS

- Google Chrome (recommended)
- Chromium
- Fallback to default browser

### Linux

- Google Chrome
- Chromium
- Firefox (kiosk mode)
- Fallback to default browser

### Windows

- Google Chrome
- Fallback to default browser

## 🔧 Customization

### Chrome Launch Parameters

- `--start-maximized`: Starts maximized
- `--app=URL`: App mode (no browser UI)
- `--kiosk`: True fullscreen kiosk mode
- `--disable-web-security`: Disables web security (development only)

### Firefox Launch Parameters

- `--kiosk`: Fullscreen kiosk mode

## 🛠️ Troubleshooting

### Port Already in Use

If you get port conflicts:

```bash
# Kill existing processes
pkill -f "react-scripts start"
pkill -f "uvicorn main:app"
```

### Browser Not Found

The script will fallback to your default browser if Chrome/Chromium is not found.

### Permission Issues

Make sure the scripts are executable:

```bash
chmod +x start-zen-full.sh
chmod +x frontend/start-zen.sh
```

## 🎨 Zen Mode Features

- **Dark Theme**: Beautiful dark gradient background
- **Glassmorphism**: Modern glass-like effects
- **Smooth Animations**: Fluid transitions and hover effects
- **Responsive Design**: Works on all screen sizes
- **Professional UI**: Premium Radiant template styling

## 🔄 Stopping Zen Mode

Press `Ctrl+C` in the terminal to stop all servers and exit Zen mode.

## 📱 Mobile Zen Mode

For mobile devices, the application automatically adapts to provide a mobile-optimized Zen experience with:

- Touch-friendly interface
- Responsive navigation
- Optimized layouts
- Mobile-specific interactions

---

**Enjoy your immersive Digital Persona Platform experience! 🌟**
