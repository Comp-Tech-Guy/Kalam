# Privacy Policy

**Last Updated:** July 27, 2026

## Introduction

Kalam ("we", "us", or "our") is an open-source, profile-based desktop environment manager for Windows. This Privacy Policy explains what data Kalam accesses, how it is used, and — most importantly — what it does **not** do with your information.

We believe in transparency. Kalam is designed to work entirely on your device. Your data stays yours.

## Information We Collect

Kalam does **not** collect, transmit, or sell any personal data. There is no account system, no analytics, no telemetry, and no user tracking of any kind.

Kalam does access and store the following data **locally on your device only**:

### Data Stored by Kalam

| Data | Location | Purpose |
|------|----------|---------|
| Application settings | `%APPDATA%/Kalam/userSettings.json` | Stores your theme preference, onboarding state, and paths to managed tools (e.g., Rainmeter, YASB, GlazeWM, Zebar, Windhawk) |
| Desktop profiles | `%APPDATA%/Kalam/userProfiles.json` | Stores the profiles you create — profile names, enabled tools, tool-specific configurations, and wallpaper paths |
| Tool manifest cache | `rainmeterManifest.json`, `yasbManifest.json`, `glazewmManifest.json`, `zebarManifest.json`, `windhawkManifest.json` in `%APPDATA%/Kalam/` | Cached copies of tool configurations written during scan to track the current state of each tool |

### Data Read from Your Device

To apply desktop profiles, Kalam reads configuration files from the following tools installed on your system:

| Tool | What Kalam Reads |
|------|-----------------|
| **Rainmeter** | Layout files in `%APPDATA%/Rainmeter/Layouts/` |
| **YASB** | `config.yaml` and `styles.css` from `~/.config/yasb/` or `~/.yasb/` |
| **GlazeWM** | `config.yaml` from `~/.glzr/glazewm/` or `~/.glzewm/` |
| **Zebar** | `settings.json` from `%APPDATA%/zebar` or `~/.zebar/` |
| **Windhawk** | Mod enabled/disabled state and per-mod settings from the Windows registry or a portable directory |
| **Wallpaper** | Image files from paths you specify in your profiles |

None of this data leaves your device. Kalam reads and writes these files solely to apply and manage your desktop profiles.

## How Your Data Is Used

All data accessed or stored by Kalam is used exclusively for the following purposes:

1. **Profile management** — Creating, editing, storing, and applying desktop configuration profiles
2. **Tool configuration** — Reading and writing configuration files for managed tools on your local system
3. **Application preferences** — Remembering your theme choice, tool paths, and onboarding state

Kalam does not use your data for advertising, analytics, profiling, or any purpose other than those described above.

## Network Activity

Kalam makes **one type** of network request: an automatic update check.

### Auto-Update Check

- **What it does:** On startup and when manually triggered from Settings, Kalam contacts the GitHub Releases API (`api.github.com`) to check if a newer version is available
- **What is sent:** The current version number of Kalam installed on your device. No personal data, no device identifiers, no usage data
- **What is received:** A JSON response indicating whether a newer release exists, along with release notes and download URLs
- **When it happens:** Automatically on app launch, or manually when you click "Check for Updates" in Settings

If you choose to download an update, the download is served directly from GitHub Releases. Kalam does not proxy, log, or track this download.

### No Other Network Activity

Kalam does not:

- Connect to any servers other than GitHub's release API
- Send telemetry or usage statistics
- Use any analytics services (e.g., Google Analytics, Mixpanel)
- Communicate with any third-party tracking services
- Use cookies, web beacons, or similar technologies

## Third-Party Services

### Managed Tools

Kalam interacts with the following third-party tools to apply your desktop profiles. Each tool is independent and has its own privacy policy:

- [Rainmeter](https://www.rainmeter.net/)
- [YASB](https://github.com/amnweb/yasb)
- [GlazeWM](https://github.com/glzr-io/glazewm)
- [Zebar](https://github.com/glzr-io/zebar)
- [Windhawk](https://windhawk.net/)

Kalam does not share data with these tools beyond what is necessary to apply configurations (e.g., writing a config file to the tool's designated directory).

## Data Sharing

**We do not sell, rent, trade, or share your data with anyone.**

Kalam does not transmit any user data to us, to advertisers, to analytics providers, or to any third party. The only network communication from Kalam is the version check with GitHub, which does not involve any personal data.

## Data Storage and Security

- All Kalam data is stored locally on your Windows device in `%APPDATA%/Kalam/`
- Data files are standard JSON files protected by your operating system's file permissions
- Kalam does not encrypt these files separately — they are protected by the same access controls as the rest of your user profile directory
- No data is stored on external servers or in the cloud by Kalam

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. Any changes will be reflected in the "Last Updated" date at the top of this document and published in the `PRIVACY.md` file in the Kalam repository.

We will notify users of significant changes through:

- The in-app update banner
- The GitHub repository

We encourage you to review this Privacy Policy periodically.

## Open Source

Kalam is open-source software released under the MIT License. You can review the full source code at any time to verify how your data is handled:

- [https://github.com/Comp-Tech-Guy/Kalam](https://github.com/Comp-Tech-Guy/Kalam)

Transparency is a core principle of this project. If you have questions about how Kalam handles data, the source code is always available for inspection.

## Contact

If you have questions or concerns about this Privacy Policy, please open an issue on our GitHub repository:

- [https://github.com/Comp-Tech-Guy/Kalam/issues](https://github.com/Comp-Tech-Guy/Kalam/issues)

We will respond to privacy-related inquiries as promptly as possible.
