# Vertical Bookmark Dock 🍎

![Version](https://img.shields.io/badge/version-1.7-blue.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Transform your browser bookmarks into a sleek, animated, Mac-style dock.**

Vertical Bookmark Dock replaces the static, cluttered bookmarks bar with a modern sidebar that auto-hides when not in use. It features smooth "Fisheye" magnification, folder stacks, and deep customization options.

---

## 🚀 Key Features

* **Standard & Universal:** Works natively on **Google Chrome** (Manifest V3 Service Worker) and **Mozilla Firefox**.
* **Smart Auto-Hide:** The dock stays hidden while you browse and reveals itself instantly when you hover over the screen edge. Includes a "Safety Net" that auto-closes the dock if your mouse wanders too far away.
* **Mac-Style Animations:** Smooth "Fisheye" zoom effect on hover with fluid return-to-idle animations.
* **4 Positions:** Dock your bookmarks on the **Left**, **Right**, **Top**, or **Bottom** of the screen.
* **Folder Stacks:** Click a folder to expand it into a beautiful, floating grid "Stack" without leaving the current page.
* **Themes & Customization:**
    * 4 Themes: *Glass, Neon, Minimal, Classic*.
    * Custom Accent Colors.
    * Adjustable Icon Sizes & Screen Offset.
* **Zero-Config Setup:** Automatically creates the required "Vertical-bookmark-list" folder and adds a welcome link upon installation.
* **Privacy First:** Runs 100% locally. No data tracking. No external servers.

---

## 📥 Installation

### Option 1: Download Release (Recommended)
1.  Go to the **[Releases](../../releases)** page of this repository.
2.  Download the ZIP file for your browser (`VerticalDock-Chrome-vX.X.zip` or `VerticalDock-Firefox-vX.X.zip`).
3.  **Chrome:** Go to `chrome://extensions`, enable Developer Mode, drag and drop the folder (or load unpacked).
4.  **Firefox:** Go to `about:debugging`, click "This Firefox", then "Load Temporary Add-on" and select the zip.

### Option 2: Install from Source
1.  Clone this repository.
2.  **Chrome:** Load the `src` folder via "Load Unpacked".
3.  **Firefox:** Select `manifest-firefox.json` inside the `src` folder via "Load Temporary Add-on".

---

## 🛠 Technical Architecture

This project uses a **Monorepo / Universal Adapter** pattern to maintain a single codebase for multiple browsers.

* `src/adapter.js`: Normalizes Chrome/Firefox APIs (Promises vs Callbacks).
* `src/background.js`: Shared core logic using `DockAPI`.
* `src/content.js`: Shared UI logic injected into pages.
* `src/manifest-chrome.json` & `src/manifest-firefox.json`: Browser-specific configs.

### Automated Builds
This repository uses **GitHub Actions** to automatically generate production-ready ZIP files. Pushing a tag (e.g., `v1.7`) triggers the build and attaches ZIPs to the Release.

---

## 🖱️ Usage

1.  **Adding Bookmarks:**
    * Right-click the Dock and select **"Add Current Page to Dock"**.
    * Or manage the **"Vertical-bookmark-list"** folder in your browser bookmarks.
2.  **Settings:** Right-click the Dock > "Open Settings".
3.  **Context Menu:** Right-click icons to Edit, Delete, or Change Icons.

---

## 🛡️ Privacy Policy

We value privacy. This extension does not collect, store, or transmit any personal data. All bookmark data remains local to your browser.
[Read the full Privacy Policy](PRIVACY.md).

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
