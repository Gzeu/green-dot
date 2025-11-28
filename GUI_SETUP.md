# Green Dot GUI - Setup Guide

## 🎨 Professional Tauri-based System Tray Application

This guide will help you set up and build the Green Dot GUI application.

## Prerequisites

### 1. Install Rust
```bash
# Windows (PowerShell)
winget install --id Rustlang.Rustup

# Or download from: https://rustup.rs/
```

### 2. Install Node.js (if not already installed)
```bash
# Verify installation
node --version  # Should be >= 14.0.0
npm --version
```

### 3. Install Tauri CLI
```bash
npm install -g @tauri-apps/cli

# Or use cargo
cargo install tauri-cli
```

## Development Setup

### 1. Clone and Switch to GUI Branch
```bash
git clone https://github.com/Gzeu/green-dot.git
cd green-dot
git checkout feature/tauri-gui
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies (root)
npm install

# Install UI dependencies
cd ui
npm install
cd ..
```

### 3. Run in Development Mode
```bash
# From project root
npm run tauri:dev

# This will:
# - Start Vite dev server (UI)
# - Compile Rust backend
# - Launch the app with hot-reload
```

## Building for Production

### Build Installer
```bash
npm run tauri:build
```

This creates:
- **MSI Installer**: `src-tauri/target/release/bundle/msi/green-dot_2.0.0_x64_en-US.msi` (~3-5 MB)
- **NSIS Installer**: `src-tauri/target/release/bundle/nsis/green-dot_2.0.0_x64-setup.exe` (~3-5 MB)
- **Portable EXE**: `src-tauri/target/release/green-dot.exe`

### Distribution Files
The installers are located in:
```
src-tauri/target/release/bundle/
├── msi/
│   └── green-dot_2.0.0_x64_en-US.msi
└── nsis/
    └── green-dot_2.0.0_x64-setup.exe
```

## Features

### System Tray
- ▶️ Start - Begin status keeping
- ⏸️ Pause - Temporarily pause
- ⏹️ Stop - Stop all activity
- 📊 Dashboard - Open main window
- ⚙️ Settings - Quick settings
- ❌ Quit - Exit application

### Dashboard Window
- Real-time status indicator
- Uptime counter
- Activity count tracker
- Last trigger timestamp
- Quick settings panel
- Activity log (last 50 events)

### Configuration
All settings are saved to:
```
%USERPROFILE%\.green-dot-config.json
```

## Architecture

```
┌─────────────────────────────────┐
│   System Tray (Rust)            │
│   - Right-click menu            │
│   - Native notifications        │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│   Dashboard UI (HTML/CSS/JS)    │
│   - Gradient design             │
│   - Real-time updates           │
│   - Activity log                │
└──────────┬──────────────────────┘
           │
           ↓ IPC (Tauri Commands)
           │
┌─────────────────────────────────┐
│   Rust Backend (main.rs)        │
│   - spawn Node.js CLI           │
│   - Config management           │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│   Node.js CLI (lib/launcher.js) │
│   - Existing logic unchanged    │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│   PowerShell (KeepActive.ps1)   │
│   - Key simulation              │
│   - Windows API calls           │
└─────────────────────────────────┘
```

## Hybrid Mode

The GUI can run alongside the CLI:

```bash
# CLI mode (original)
gd --silent

# GUI mode (new)
green-dot.exe

# Both work independently
```

## Troubleshooting

### Rust Compilation Errors
```bash
# Update Rust toolchain
rustup update stable

# Clean build
cd src-tauri
cargo clean
cargo build
```

### UI Not Loading
```bash
# Check Vite dev server
cd ui
npm run dev

# Should open http://localhost:5173
```

### System Tray Not Appearing
- Ensure Windows system tray is not hidden
- Check Windows notification area settings
- Restart Explorer.exe if needed

### PowerShell Execution
The GUI invokes the Node.js CLI, which requires:
```bash
# Verify npm global install still works
npm list -g @gzeu/green-dot

# Or use local node command
node bin/green-dot.js --status
```

## Performance

- **Bundle Size**: 3-5 MB (vs Electron's 85-244 MB)
- **Memory Usage**: 30-50 MB idle (vs Electron's 200-400 MB)
- **Startup Time**: <1 second
- **CPU Usage**: Negligible (<0.1% idle)

## Code Signing (Optional)

For production distribution:

```bash
# Get code signing certificate
# Add to tauri.conf.json:
"windows": {
  "certificateThumbprint": "YOUR_CERT_THUMBPRINT"
}
```

This prevents Windows SmartScreen warnings.

## Next Steps

1. **Test the GUI**: `npm run tauri:dev`
2. **Build installer**: `npm run tauri:build`
3. **Distribute**: Upload `.msi` to GitHub releases
4. **Auto-update**: Configure update endpoints

## Resources

- [Tauri Documentation](https://tauri.app/)
- [System Tray API](https://tauri.app/v1/api/js/modules/systemTray/)
- [IPC Communication](https://tauri.app/v1/guides/features/command/)

---

**Built with ❤️ using Tauri**