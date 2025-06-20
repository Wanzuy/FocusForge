// Background Service Worker for FocusForge

// Default settings
const DEFAULT_SETTINGS = {
    focusMode: false,
    blockedSites: [
        "facebook.com",
        "youtube.com",
        "tiktok.com",
        "instagram.com",
        "twitter.com",
        "reddit.com",
    ],
    todayStats: {
        blocks: 0,
        date: new Date().toDateString(),
    },
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
    // Set default settings
    const result = await chrome.storage.local.get(
        Object.keys(DEFAULT_SETTINGS)
    );

    // Only set defaults for missing settings
    const toSet = {};
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        if (result[key] === undefined) {
            toSet[key] = value;
        }
    }

    if (Object.keys(toSet).length > 0) {
        await chrome.storage.local.set(toSet);
    }
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case "toggleFocusMode":
            handleToggleFocusMode(message.enabled);
            break;

        case "checkSiteBlocked":
            handleCheckSiteBlocked(message.url, sendResponse);
            return true; // Keep message channel open for async response

        case "siteBlocked":
            handleSiteBlocked();
            break;

        default:
            sendResponse({ error: "Unknown action: " + message.action });
            break;
    }
});

// Handle focus mode toggle
async function handleToggleFocusMode(enabled) {
    try {
        await chrome.storage.local.set({ focusMode: enabled });

        // Update badge with error handling
        try {
            await chrome.action.setBadgeText({
                text: enabled ? "ON" : "",
            });

            await chrome.action.setBadgeBackgroundColor({
                color: enabled ? "#4CAF50" : "#FF5722",
            });
        } catch (badgeError) {
            // Badge errors are not critical, continue
        }

        // Notify all content scripts about focus mode change
        try {
            const tabs = await chrome.tabs.query({});
            let reloadedTabs = 0;

            for (const tab of tabs) {
                try {
                    // If Focus Mode is being turned OFF and tab is on block page, reload it
                    if (
                        !enabled &&
                        tab.url &&
                        tab.url.includes(chrome.runtime.getURL("block.html"))
                    ) {
                        // Extract original URL from block page
                        const urlParams = new URLSearchParams(
                            new URL(tab.url).search
                        );
                        const originalUrl = urlParams.get("url");

                        if (originalUrl) {
                            await chrome.tabs.update(tab.id, {
                                url: originalUrl,
                            });
                            reloadedTabs++;
                            continue; // Skip sending message since tab is being reloaded
                        }
                    }

                    // Send message to content script
                    await chrome.tabs.sendMessage(tab.id, {
                        action: "focusModeChanged",
                        enabled: enabled,
                    });
                } catch (tabError) {
                    // Some tabs might not have content script, ignore
                }
            }
        } catch (tabsError) {
            console.warn("Error notifying tabs:", tabsError);
        }
    } catch (error) {
        console.error("Error handling focus mode toggle:", error);
    }
}

// Check if site should be blocked
async function handleCheckSiteBlocked(url, sendResponse) {
    try {
        const result = await chrome.storage.local.get([
            "focusMode",
            "blockedSites",
            "emergencyAccess",
        ]);

        const focusMode = result.focusMode || false;
        const blockedSites =
            result.blockedSites || DEFAULT_SETTINGS.blockedSites;
        const emergencyAccess = result.emergencyAccess || null;

        // Check if emergency access is active and not expired
        if (emergencyAccess && emergencyAccess.enabled) {
            if (Date.now() < emergencyAccess.expires) {
                sendResponse({ blocked: false });
                return;
            } else {
                // Emergency access expired, clean it up
                await chrome.storage.local.remove(["emergencyAccess"]);
            }
        }

        if (!focusMode) {
            sendResponse({ blocked: false });
            return;
        }

        // Check if current URL matches blocked sites
        const currentDomain = extractDomain(url);

        // Handle both old format (strings) and new format (objects)
        let isBlocked = false;
        if (Array.isArray(blockedSites)) {
            isBlocked = blockedSites.some((site) => {
                const siteUrl = typeof site === "string" ? site : site.url;
                return (
                    currentDomain.includes(siteUrl) ||
                    siteUrl.includes(currentDomain)
                );
            });
        }

        sendResponse({ blocked: isBlocked, domain: currentDomain });
    } catch (error) {
        console.error("Error checking site blocked:", error);
        sendResponse({ blocked: false });
    }
}

// Handle site blocked event
async function handleSiteBlocked() {
    try {
        // Update today's stats
        const result = await chrome.storage.local.get(["todayStats"]);
        let todayStats = result.todayStats || DEFAULT_SETTINGS.todayStats;

        // Reset stats if new day
        const today = new Date().toDateString();
        if (todayStats.date !== today) {
            todayStats = {
                blocks: 0,
                date: today,
            };
        }

        todayStats.blocks++;
        await chrome.storage.local.set({ todayStats });

        // Send message to popup if open
        try {
            chrome.runtime.sendMessage({
                action: "updateStats",
                blocks: todayStats.blocks,
            });
        } catch (e) {
            // Popup might not be open, ignore error
        }
    } catch (error) {
        console.error("Error handling site blocked:", error);
    }
}

// Utility function to extract domain from URL
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace("www.", "");
    } catch (error) {
        return url;
    }
}

// Update badge when focus mode changes
chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === "local" && changes.focusMode) {
        const enabled = changes.focusMode.newValue;

        try {
            chrome.action.setBadgeText({
                text: enabled ? "ON" : "",
            });

            chrome.action.setBadgeBackgroundColor({
                color: enabled ? "#4CAF50" : "#FF5722",
            });
        } catch (error) {
            console.warn("Error updating badge:", error);
        }

        // Also notify content scripts when storage changes
        // This handles cases where focus mode is changed from other sources
        try {
            const tabs = await chrome.tabs.query({});
            let reloadedTabs = 0;

            for (const tab of tabs) {
                try {
                    // If Focus Mode is being turned OFF and tab is on block page, reload it
                    if (
                        !enabled &&
                        tab.url &&
                        tab.url.includes(chrome.runtime.getURL("block.html"))
                    ) {
                        // Extract original URL from block page
                        const urlParams = new URLSearchParams(
                            new URL(tab.url).search
                        );
                        const originalUrl = urlParams.get("url");

                        if (originalUrl) {
                            await chrome.tabs.update(tab.id, {
                                url: originalUrl,
                            });
                            reloadedTabs++;
                            continue; // Skip sending message since tab is being reloaded
                        }
                    }

                    // Send message to content script
                    await chrome.tabs.sendMessage(tab.id, {
                        action: "focusModeChanged",
                        enabled: enabled,
                    });
                } catch (tabError) {
                    // Some tabs might not have content script, ignore
                }
            }
        } catch (tabsError) {
            console.warn(
                "Error notifying tabs from storage change:",
                tabsError
            );
        }
    }
});
