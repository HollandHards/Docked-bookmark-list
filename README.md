# Vertical Bookmark Dock 🍎

**Transform your browser bookmarks into a sleek, animated, Mac-style dock.**

Vertical Bookmark Dock replaces the static, cluttered bookmarks bar with a modern sidebar that auto-hides when not in use. It features smooth "Fisheye" magnification, folder stacks, and deep customization options.

*(Add a screenshot of your dock here: `![Alt text](readme/vertical-dock-bar-animation.gif)`)*

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

1. Go to the https://github.com/HollandHards/Docked-bookmark-list/ page of this repository.
2. Download the ZIP file for your browser (`VerticalDock-Chrome-vX.X.zip` or `VerticalDock-Firefox-vX.X.zip`).

### Option 2: Install from Source

**For Chrome / Edge / Brave:**

1. Download or Clone this repository.
2. Go to `chrome://extensions`.
3. Enable **Developer Mode** (top right).
4. Click **Load Unpacked**.
5. Select the `src` folder.

**For Firefox:**

1. Download or Clone this repository.
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on**.
4. Select the `manifest-firefox.json` file inside the `src` folder.

---

## 🛠 Technical Architecture

This project uses a **Monorepo / Universal Adapter** pattern to maintain a single codebase for multiple browsers.

### The Structure

* `src/adapter.js`: The magic bridge. It detects the browser environment (`chrome` vs `browser`) and normalizes the APIs (converting Chrome's callback-based APIs into Promises to match Firefox).
* `src/background.js`: The shared core logic. It uses `DockAPI` (our wrapper) instead of `chrome` or `browser`.
* `src/content.js`: The shared UI logic injected into pages.
* `src/manifest-chrome.json` & `src/manifest-firefox.json`: Browser-specific configuration files.

### Automated Builds (CI/CD)

This repository uses **GitHub Actions** to automatically generate production-ready ZIP files.

1. When a **Tag** is pushed (e.g., `v1.7`), the workflow runs.
2. It copies the `src` folder.
3. It swaps the correct `manifest.json` for the target browser.
4. It creates a ZIP file and attaches it to the Release page.

---

## 🖱️ Usage

1. **Adding Bookmarks:**
* Right-click any part of the Dock (or the trigger handle) and select **"Add Current Page to Dock"**.
* Alternatively, manage the **"Vertical-bookmark-list"** folder in your browser's native bookmark manager.


2. **Opening Settings:**
* Right-click the Dock and select **"Open Settings"**.
* Or click the "Gear" icon if enabled in the dock.


3. **Context Menu:**
* Right-click any icon to Edit, Delete, or Change its Icon URL.



---

## 🛡️ Privacy Policy

We value privacy. This extension does not collect, store, or transmit any personal data. All bookmark data remains local to your browser.
[Read the full Privacy Policy](PRIVACY.md).

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
