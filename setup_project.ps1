# ChordGen Pro - Project Structure Setup Script
# Run from: C:\Users\CraftAuto-Sales\M4LProg\

Write-Host "🎵 Setting up ChordGen Pro project structure..." -ForegroundColor Cyan

# Base directory
$baseDir = "C:\Users\CraftAuto-Sales\M4LProg"
Set-Location $baseDir

# Create main directory structure
Write-Host "`n📁 Creating directories..." -ForegroundColor Yellow

$directories = @(
    # VS Code config
    ".vscode",
    
    # Documentation & Reference
    "docs",
    "docs\reference",
    
    # Electron main process
    "electron",
    "electron\services",
    
    # React application
    "src",
    "src\components",
    "src\components\ProgressionEditor",
    "src\components\PatternLibrary",
    "src\components\SectionNavigator",
    "src\components\HardwareDisplay",
    "src\components\Transport",
    "src\components\AI",
    
    # Services (business logic)
    "src\services",
    "src\services\musicTheory",
    "src\services\progression",
    "src\services\hardware",
    "src\services\live",
    "src\services\ai",
    
    # State management
    "src\stores",
    
    # Type definitions
    "src\types",
    
    # Hooks
    "src\hooks",
    
    # Styles
    "src\styles",
    
    # M4L Helper (future)
    "m4l-helper",
    "m4l-helper\code"
)

foreach ($dir in $directories) {
    $fullPath = Join-Path $baseDir $dir
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "  ✓ Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "  ○ Exists: $dir" -ForegroundColor Gray
    }
}

# Create placeholder README files
Write-Host "`n📝 Creating placeholder files..." -ForegroundColor Yellow

$readmeFiles = @{
    "docs\reference\README.md" = @"
# Reference Code

This folder contains the original M4L (Max for Live) JavaScript files.

## Files
- Music_Theory_Engine.js - ✅ Ported to src/services/musicTheory/MusicTheoryEngine.ts
- Progression_Manager.js - ✅ Ported to src/services/progression/ProgressionManager.ts
- Hardware_Bridge.js - 📚 Ready to port to src/services/hardware/
- Ableton_LOM_Bridge.js - 📚 Ready to port to src/services/live/
- build_gemini_request.js - 📚 Ready to port to src/services/ai/
- parse_gemini_response.js - 📚 Ready to port to src/services/ai/

These files are for **reference only** when porting to TypeScript.
"@

    "src\components\README.md" = @"
# UI Components

React components for the ChordGen Pro interface.

## Structure
- ProgressionEditor/ - Main progression editing interface
- PatternLibrary/ - Browse and apply chord patterns
- SectionNavigator/ - Manage song sections
- HardwareDisplay/ - ATOM SQ visual feedback
- Transport/ - Playback controls and timeline
- AI/ - AI suggestions panel
"@

    "src\services\README.md" = @"
# Services

Business logic layer - pure functions, no UI dependencies.

## Modules
- musicTheory/ - ✅ Chord generation, scales, voicings
- progression/ - ✅ Pattern detection, section management
- hardware/ - 🚧 ATOM SQ control via Web MIDI
- live/ - 🚧 OSC communication with Ableton Live
- ai/ - 🚧 Gemini API integration
"@

    "src\stores\README.md" = @"
# State Management

Zustand stores for application state.

## Stores
- progressionStore.ts - ✅ Sections, progressions, patterns
- hardwareStore.ts - 🚧 ATOM SQ state
- transportStore.ts - 🚧 Live transport sync
- aiStore.ts - 🚧 AI suggestions state
"@

    "src\types\README.md" = @"
# Type Definitions

TypeScript interfaces and types.

## Files
- chord.ts - ✅ Chord, ChordQuality, VoicingParams
- pattern.ts - ✅ Pattern, DetectedPattern
- progression.ts - ✅ Section, ProgressionSnapshot
- hardware.ts - 🚧 ATOM SQ types
- live.ts - 🚧 OSC message types
- osc.ts - 🚧 OSC protocol types
"@

    "m4l-helper\README.md" = @"
# M4L Helper Device

Minimal Max for Live device for Live API access.

This device will be ~200 lines total:
- Receive OSC from Electron app
- Route to appropriate Live API calls
- Send confirmation back via OSC

Will be created in Phase 5.
"@
}

foreach ($file in $readmeFiles.Keys) {
    $fullPath = Join-Path $baseDir $file
    if (-not (Test-Path $fullPath)) {
        $readmeFiles[$file] | Out-File -FilePath $fullPath -Encoding UTF8
        Write-Host "  ✓ Created: $file" -ForegroundColor Green
    }
}

# Create .gitignore
Write-Host "`n🚫 Creating .gitignore..." -ForegroundColor Yellow

$gitignore = @"
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
dist-electron/
build/
release-builds/
*.dmg
*.exe
*.zip
*.AppImage

# Electron
out/

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea/
*.swp
*.swo

# Testing
coverage/

# Env files
.env
.env.local

# Max/MSP temp files
*.mxo~
*.maxpat~

# TypeScript
*.tsbuildinfo
"@

$gitignorePath = Join-Path $baseDir ".gitignore"
if (-not (Test-Path $gitignorePath)) {
    $gitignore | Out-File -FilePath $gitignorePath -Encoding UTF8
    Write-Host "  ✓ Created .gitignore" -ForegroundColor Green
}

# Create VS Code settings
Write-Host "`n⚙️ Creating VS Code settings..." -ForegroundColor Yellow

$vscodeSettings = @"
{
  "github.copilot.enable": {
    "*": true,
    "yaml": true,
    "plaintext": false,
    "markdown": false
  },
  "search.exclude": {
    "docs/reference/**": true,
    "**/node_modules": true,
    "**/dist": true,
    "**/dist-electron": true
  },
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/dist-electron/**": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
"@

$vscodeSettingsPath = Join-Path $baseDir ".vscode\settings.json"
$vscodeSettings | Out-File -FilePath $vscodeSettingsPath -Encoding UTF8
Write-Host "  ✓ Created .vscode/settings.json" -ForegroundColor Green

$vscodeExtensions = @"
{
  "recommendations": [
    "github.copilot",
    "github.copilot-chat",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss"
  ]
}
"@

$vscodeExtensionsPath = Join-Path $baseDir ".vscode\extensions.json"
$vscodeExtensions | Out-File -FilePath $vscodeExtensionsPath -Encoding UTF8
Write-Host "  ✓ Created .vscode/extensions.json" -ForegroundColor Green

# Summary
Write-Host "`n✅ Project structure created successfully!" -ForegroundColor Green
Write-Host "`n📂 Directory tree created at: $baseDir" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Move your downloaded TypeScript files to appropriate folders" -ForegroundColor White
Write-Host "  2. Move original M4L .js files to docs\reference\" -ForegroundColor White
Write-Host "  3. Run: npm init -y (if package.json doesn't exist)" -ForegroundColor White
Write-Host "  4. Install dependencies: npm install" -ForegroundColor White
Write-Host "  5. Open in VS Code: code ." -ForegroundColor White

Write-Host "`n🎉 Ready to start development!" -ForegroundColor Magenta