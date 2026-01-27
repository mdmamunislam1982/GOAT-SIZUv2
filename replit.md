# Sizu Bot V2

## Overview

Sizu Bot V2 is a Facebook Messenger chat bot that uses a personal Facebook account to interact with users through an unofficial Facebook Chat API. The bot provides a modular command system, event handling, and includes a web-based dashboard for management and configuration.

### Hosting & Deployment
This bot is optimized for cloud hosting and can be run on platforms like:
- **Replit**: Using the built-in Nix environment and deployment tools.
- **Railway**: Supports Node.js deployment via Docker or Nixpacks.
- **Render**: Supports Web Service or Background Worker deployment for Node.js.

Key capabilities:
- Automated message responses via custom commands and events
- Multi-language support (Vietnamese, English, Bangla, Arabic, Indonesian)
- Web dashboard for bot configuration and thread management
- User authentication with Facebook ID verification
- Google Drive integration for file storage
- Multiple database backend options (SQLite, MongoDB, JSON)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Application Structure

The bot uses a two-layer startup process:
- `index.js` spawns `Sizu.js` as a child process with auto-restart capability on exit code 2
- `Sizu.js` handles configuration validation, login, and initializes the main bot loop

### Login and Authentication

- Uses `FCA-SiFu` (bundled locally in `/FCA-SiFu/`) for Facebook authentication
- Supports multiple login methods: cookie-based (`account.txt`), email/password, and mbasic login
- Cookie validation via `checkLiveCookie.js` before establishing MQTT listener
- Automatic cookie refresh at configurable intervals
- Supports multiple login methods: cookie-based (`account.txt`), email/password, and mbasic login
- Cookie validation via `checkLiveCookie.js` before establishing MQTT listener
- Automatic cookie refresh at configurable intervals

### Command and Event System

Commands and events are loaded from `/scripts/cmds/` and `/scripts/events/` directories:
- Commands are registered in `GoatBot.commands` Map with aliases support
- Events are registered in `GoatBot.eventCommands` Map
- Handler chain: `handlerAction.js` → `handlerEvents.js` → individual command/event execution
- Role-based permission system (0: member, 1: group admin, 2: bot admin, 3: VIP, 4: developer)

### Database Architecture

Configurable storage backend via `config.json`:
- **SQLite** (default): Uses Sequelize ORM, stored in `/database/data/data.sqlite`
- **MongoDB**: Mongoose ODM with connection URI
- **JSON**: File-based storage in `/database/data/` directory

Data controllers in `/database/controller/`:
- `threadsData.js`: Thread/group data management
- `usersData.js`: User data management  
- `dashBoardData.js`: Dashboard user accounts
- `globalData.js`: Global bot settings

### Web Dashboard

Express.js application in `/dashboard/`:
- Passport.js with local strategy for authentication
- ETA templating engine for views
- Session-based authentication with optional "remember me"
- reCAPTCHA v2 integration for form protection
- Socket.IO support for real-time uptime monitoring

Routes handle:
- User registration/login with email verification
- Facebook ID verification for thread access
- Thread-specific dashboard configuration
- File upload/management via Google Drive API

### Message Handling Flow

1. MQTT listener receives Facebook events
2. `handlerAction.js` filters events (anti-inbox, database checks)
3. `handlerCheckData.js` ensures user/thread data exists
4. `handlerEvents.js` routes to appropriate handler based on event type
5. Commands match by prefix + name or aliases
6. Reply/reaction handlers use stored callback references

## External Dependencies

### Facebook Integration
- **FCA-SiFu**: Bundled unofficial Facebook Messenger API (modified fork)
- MQTT-based real-time message listening
- Supports message, reaction, typing, and presence events

### Google Services
- **Google Drive API**: File storage for attachments (welcome/leave media)
- **Gmail API**: Email sending for verification codes and notifications
- OAuth2 authentication with refresh token

### Database
- **Sequelize**: ORM for SQLite database operations
- **Mongoose**: ODM for MongoDB (optional)
- **sqlite3**: SQLite driver

### Web Framework
- **Express.js**: Web server and API routes
- **Passport.js**: Authentication middleware
- **Socket.IO**: Real-time communication for uptime monitoring
- **ETA**: Templating engine

### Utilities
- **axios**: HTTP client for external API calls
- **cheerio**: HTML parsing for web scraping
- **canvas**: Image manipulation
- **moment-timezone**: Date/time handling with timezone support
- **node-cron**: Scheduled task execution

### Security
- **bcrypt**: Password hashing
- **Google reCAPTCHA v2**: Bot protection for forms

### Notification Services (Optional)
- **nodemailer**: Email notifications for errors
- **Telegram Bot API**: Alternative notification channel