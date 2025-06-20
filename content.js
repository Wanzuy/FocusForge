// Content Script for FocusForge

// Flag to prevent infinite redirects
let isCheckingBlock = false;

// Check if current site should be blocked
async function checkAndBlockSite() {
    // Prevent multiple simultaneous checks
    if (isCheckingBlock) {
        return;
    }

    // Don't check if we're already on the block page
    if (window.location.href.includes(chrome.runtime.getURL("block.html"))) {
        return;
    }

    isCheckingBlock = true;

    try {
        const response = await chrome.runtime.sendMessage({
            action: "checkSiteBlocked",
            url: window.location.href,
        });
        if (response && response.blocked) {
            // Notify background script
            chrome.runtime.sendMessage({
                action: "siteBlocked",
            });

            // Redirect to block page
            window.location.href =
                chrome.runtime.getURL("block.html") +
                "?site=" +
                encodeURIComponent(response.domain) +
                "&url=" +
                encodeURIComponent(window.location.href);
        }
    } catch (error) {
        // Silently handle errors
    } finally {
        isCheckingBlock = false;
    }
}

// Check site blocking on page load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkAndBlockSite);
} else {
    checkAndBlockSite();
}

// Listen for focus mode changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "focusModeChanged") {
        // If Focus Mode is turned OFF and we're on a block page, reload to original URL
        if (
            !message.enabled &&
            window.location.href.includes(chrome.runtime.getURL("block.html"))
        ) {
            // Extract original URL from block page URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const originalUrl = urlParams.get("url");

            if (originalUrl) {
                window.location.href = originalUrl;
                return; // Don't proceed with re-checking since we're redirecting
            }
        }

        // For regular pages, re-check if site should be blocked when focus mode changes
        // Add small delay to ensure storage is updated
        setTimeout(() => {
            checkAndBlockSite();
        }, 100);
    }
});
