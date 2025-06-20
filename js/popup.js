// Popup script for FocusForge
console.log("FocusForge Popup loaded");

// DOM Elements
const focusToggle = document.getElementById("focusToggle");
const statusText = document.getElementById("statusText");
const todayBlocks = document.getElementById("todayBlocks");
const manageBtn = document.getElementById("manageBtn");
const scheduleBtn = document.getElementById("scheduleBtn");
const settingsBtn = document.getElementById("settingsBtn");
const statsBtn = document.getElementById("statsBtn");
const debugBtn = document.getElementById("debugBtn");
const quickTestBtn = document.getElementById("quickTestBtn");

// Initialize popup
document.addEventListener("DOMContentLoaded", async () => {
    await loadCurrentState();
    attachEventListeners();
});

// Load current state from storage
async function loadCurrentState() {
    try {
        const result = await chrome.storage.local.get([
            "focusMode",
            "todayStats",
        ]);

        // Set focus mode toggle
        const focusMode = result.focusMode || false;
        focusToggle.checked = focusMode;
        updateStatusText(focusMode);

        // Set today's stats
        const stats = result.todayStats || { blocks: 0 };
        todayBlocks.textContent = `${stats.blocks} lần chặn`;
    } catch (error) {
        console.error("Error loading popup state:", error);
    }
}

// Update status text based on focus mode
function updateStatusText(isActive) {
    if (isActive) {
        statusText.textContent = "🟢 Đang bật - Chặn website gây xao nhãng";
        statusText.classList.add("active");
    } else {
        statusText.textContent = "🔴 Đang tắt - Có thể truy cập tất cả website";
        statusText.classList.remove("active");
    }
}

// Attach event listeners
function attachEventListeners() {
    // Focus mode toggle
    focusToggle.addEventListener("change", async (e) => {
        const isActive = e.target.checked;

        try {
            // Save to storage
            await chrome.storage.local.set({ focusMode: isActive });

            // Update UI
            updateStatusText(isActive);

            // Send message to background script
            chrome.runtime.sendMessage({
                action: "toggleFocusMode",
                enabled: isActive,
            });

            console.log(`Focus Mode ${isActive ? "enabled" : "disabled"}`);
        } catch (error) {
            console.error("Error toggling focus mode:", error);
            // Revert toggle if error
            e.target.checked = !isActive;
        }
    });

    // Navigation buttons (placeholder for now)
    manageBtn.addEventListener("click", () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("pages/manage.html") });
        window.close();
    });

    scheduleBtn.addEventListener("click", () => {
        chrome.tabs.create({
            url: chrome.runtime.getURL("pages/schedule.html"),
        });
        window.close();
    });

    settingsBtn.addEventListener("click", () => {
        chrome.tabs.create({
            url: chrome.runtime.getURL("pages/settings.html"),
        });
        window.close();
    });
    statsBtn.addEventListener("click", () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("pages/stats.html") });
        window.close();
    });
    debugBtn.addEventListener("click", () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("debug.html") });
        window.close();
    });

    quickTestBtn.addEventListener("click", () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("quick-test.html") });
        window.close();
    });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateStats") {
        todayBlocks.textContent = `${message.blocks} lần chặn`;
    }
});
