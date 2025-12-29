# Vertical Bookmark Dock 

**A customizable, Mac-inspired sidebar for your browser bookmarks.**

Vertical Bookmark Dock declutters your browser by moving your favorite links into a sleek, auto-hiding sidebar. Inspired by the macOS Dock, it features smooth animations, folder "stacks," and deep customization options.

![Version](https://img.shields.io/badge/version-1.6-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

* **Auto-Hiding Sidebar:** Hover over any screen edge (Left, Right, Top, Bottom) to reveal the dock.
* **Folder Stacks:** Click any folder to expand its contents in a floating grid.
* **Context-Aware:** Right-click anywhere to instantly **"Add Current Page"** to the dock.
* **Cross-Device Sync:** Settings and custom icons roam with your browser account.
* **Deep Customization:**
    * **Themes:** Apply color overlays to icons to match your accent color.
    * **Styles:** Choose from Glass, Neon, Minimal, or Classic separator styles.
    * **Visuals:** Toggle Drop Shadows, Hover Glows, and Tooltips.

## 🚀 Installation

### Chrome / Edge / Brave
1.  Download or Clone this repository.
2.  Go to `chrome://extensions/`
3.  Enable **Developer Mode** (top right).
4.  Click **Load Unpacked**.
5.  Select the **`chrome`** folder from this repository.

### Firefox
1.  Download or Clone this repository.
2.  Go to `about:debugging#/runtime/this-firefox`
3.  Click **Load Temporary Add-on...**
4.  Select the `manifest.json` file inside the **`firefox`** folder.

## 🛠️ Configuration
* **Toggle Dock:** `Ctrl+Shift+L` (Windows) / `Cmd+Shift+L` (Mac)
* **Settings:** Right-click the dock > **Open Settings**, or click the Gear icon.

## 📂 Project Structure
* `/chrome` - Source code adapted for Chromium-based browsers (Manifest V3 service_worker).
* `/firefox` - Source code adapted for Firefox (Manifest V3 background.scripts & browser namespace).

## 📄 License
This project is open-source. Feel free to fork and modify!
