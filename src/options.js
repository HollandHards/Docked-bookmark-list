// options.js

// 1. Configuration: The exact name of the folder we are looking for
const TARGET_FOLDER_NAME = "Vertical-bookmark-list";

document.addEventListener('DOMContentLoaded', () => {
    loadBookmarks();
});

function loadBookmarks() {
    console.log(`[Options] Searching for folder: "${TARGET_FOLDER_NAME}"...`);

    // 2. Search for the folder by name
    chrome.bookmarks.search({ title: TARGET_FOLDER_NAME }, (results) => {
        
        // Handle case: Folder does not exist
        if (results.length === 0) {
            console.error(`[Options] Folder "${TARGET_FOLDER_NAME}" not found.`);
            displayMessage(`Error: The folder "${TARGET_FOLDER_NAME}" was not found. Please reinstall the extension or create the folder manually.`);
            return;
        }

        // Handle case: Duplicate folders (Just take the first one found)
        const folderNode = results[0];
        console.log(`[Options] Folder found! ID: ${folderNode.id}`);

        // 3. Get the contents (children) of that folder
        chrome.bookmarks.getChildren(folderNode.id, (bookmarks) => {
            console.log(`[Options] Found ${bookmarks.length} items in the folder.`);
            
            // Clear any existing list before rendering
            const listContainer = document.getElementById('bookmark-list');
            listContainer.innerHTML = ''; 

            if (bookmarks.length === 0) {
                displayMessage("The folder is empty. Add bookmarks to 'Vertical-bookmark-list' to see them here.");
                return;
            }

            // 4. Loop through and display items
            bookmarks.forEach((bookmark) => {
                // If it has a 'url', it's a bookmark. If not, it's a sub-folder.
                if (bookmark.url) {
                    appendBookmarkToDOM(bookmark, listContainer);
                } else {
                    // Optional: Handle sub-folders if you want
                    console.log(`[Options] Skipped sub-folder: ${bookmark.title}`);
                }
            });
        });
    });
}

// Helper to create the HTML elements
function appendBookmarkToDOM(bookmark, container) {
    const li = document.createElement('li');
    const link = document.createElement('a');
    
    link.href = bookmark.url;
    link.textContent = bookmark.title || "(No Title)";
    link.target = "_blank"; // Open in new tab
    
    // minimal styling for the link
    link.style.textDecoration = "none";
    link.style.color = "#333";
    link.style.display = "block";
    link.style.padding = "5px 0";

    li.appendChild(link);
    container.appendChild(li);
}

// Helper to display status messages to the user
function displayMessage(msg) {
    const listContainer = document.getElementById('bookmark-list');
    listContainer.innerHTML = `<p style="color: #666; font-style: italic;">${msg}</p>`;
}
