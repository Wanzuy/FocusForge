// Background Service Worker cho FocusForge
// Manifest V3 - Chrome Extension

class FocusForgeBackground {
    constructor() {
        this.initializeExtension();
        this.setupEventListeners();
    }

    initializeExtension() {
        // Khởi tạo cài đặt mặc định khi cài extension
        chrome.runtime.onInstalled.addListener(async () => {
            await this.setDefaultSettings();
            this.setupDailyReset();
        });

        // Khởi tạo khi browser start
        chrome.runtime.onStartup.addListener(() => {
            this.checkAutoEnable();
            this.setupDailyReset();
        });
    }

    async setDefaultSettings() {
        const defaultSettings = {
            // Trạng thái chính
            focusMode: false,

            // Danh sách website chặn
            blockedSites: [
                "youtube.com",
                "facebook.com",
                "tiktok.com",
                "reddit.com",
                "twitter.com",
                "instagram.com",
                "netflix.com",
                "twitch.tv",
            ],

            // Lịch trình chặn
            schedules: [
                {
                    id: "morning",
                    name: "Buổi sáng",
                    startTime: "08:00",
                    endTime: "11:30",
                    days: [
                        "monday",
                        "tuesday",
                        "wednesday",
                        "thursday",
                        "friday",
                    ],
                    enabled: true,
                },
                {
                    id: "afternoon",
                    name: "Buổi chiều",
                    startTime: "13:00",
                    endTime: "17:30",
                    days: [
                        "monday",
                        "tuesday",
                        "wednesday",
                        "thursday",
                        "friday",
                    ],
                    enabled: true,
                },
            ],

            // Bảo mật
            passwordProtection: false,
            password: "",

            // Tính năng nâng cao
            mindfulUnlock: true,
            autoEnable: true,
            whitelistMode: false,
            whitelist: [],

            // Thống kê
            dailyStats: {},
            totalBlocks: 0,
            focusStreak: 0,

            // Cài đặt khác
            emergencyAccess: true,
            motivationalMessages: true,
        };

        // Chỉ set những setting chưa có
        for (const [key, value] of Object.entries(defaultSettings)) {
            const existing = await chrome.storage.local.get(key);
            if (existing[key] === undefined) {
                await chrome.storage.local.set({ [key]: value });
            }
        }
    }

    setupEventListeners() {
        // Lắng nghe tabs được tạo/cập nhật
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === "loading" && tab.url) {
                this.checkBlockPage(tab.url, tabId);
            }
        });

        // Lắng nghe tabs được kích hoạt
        chrome.tabs.onActivated.addListener(async (activeInfo) => {
            const tab = await chrome.tabs.get(activeInfo.tabId);
            if (tab.url) {
                this.checkBlockPage(tab.url, activeInfo.tabId);
            }
        });

        // Lắng nghe tin nhắn từ content script và popup
        chrome.runtime.onMessage.addListener(
            (message, sender, sendResponse) => {
                this.handleMessage(message, sender, sendResponse);
                return true; // Async response
            }
        );

        // Alarm cho auto-enable và reset hàng ngày
        chrome.alarms.onAlarm.addListener((alarm) => {
            this.handleAlarm(alarm);
        });
    }

    async checkBlockPage(url, tabId) {
        try {
            const settings = await chrome.storage.local.get([
                "focusMode",
                "blockedSites",
                "schedules",
                "whitelistMode",
                "whitelist",
            ]);

            // Không chặn nếu focus mode tắt
            if (!settings.focusMode) return;

            // Kiểm tra thời gian
            if (!this.isInSchedule(settings.schedules)) return;

            const hostname = new URL(url).hostname.replace("www.", "");
            let shouldBlock = false;

            if (settings.whitelistMode) {
                // Whitelist mode: chặn tất cả trừ whitelist
                shouldBlock = !settings.whitelist.some(
                    (site) => hostname.includes(site) || site.includes(hostname)
                );
            } else {
                // Blacklist mode: chỉ chặn những site trong danh sách
                shouldBlock = settings.blockedSites.some(
                    (site) => hostname.includes(site) || site.includes(hostname)
                );
            }

            if (shouldBlock) {
                await this.blockPage(tabId, hostname);
                await this.updateStats(hostname);
            }
        } catch (error) {
            console.error("Error checking block page:", error);
        }
    }

    isInSchedule(schedules) {
        const now = new Date();
        const currentDay = now.toLocaleDateString("en-US", {
            weekday: "lowercase",
        });
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM

        return schedules.some((schedule) => {
            if (!schedule.enabled) return false;
            if (!schedule.days.includes(currentDay)) return false;
            return (
                currentTime >= schedule.startTime &&
                currentTime <= schedule.endTime
            );
        });
    }

    async blockPage(tabId, hostname) {
        try {
            // Redirect đến trang block
            const blockUrl = chrome.runtime.getURL(
                `block.html?site=${encodeURIComponent(hostname)}`
            );
            await chrome.tabs.update(tabId, { url: blockUrl });
        } catch (error) {
            console.error("Error blocking page:", error);
        }
    }

    async updateStats(hostname) {
        try {
            const today = new Date().toISOString().split("T")[0];
            const stats = await chrome.storage.local.get([
                "dailyStats",
                "totalBlocks",
            ]);

            if (!stats.dailyStats[today]) {
                stats.dailyStats[today] = {};
            }

            if (!stats.dailyStats[today][hostname]) {
                stats.dailyStats[today][hostname] = 0;
            }

            stats.dailyStats[today][hostname]++;
            stats.totalBlocks = (stats.totalBlocks || 0) + 1;

            await chrome.storage.local.set({
                dailyStats: stats.dailyStats,
                totalBlocks: stats.totalBlocks,
            });

            // Cập nhật badge
            const todayTotal = Object.values(stats.dailyStats[today]).reduce(
                (a, b) => a + b,
                0
            );
            chrome.action.setBadgeText({ text: todayTotal.toString() });
            chrome.action.setBadgeBackgroundColor({ color: "#667eea" });
        } catch (error) {
            console.error("Error updating stats:", error);
        }
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case "toggleFocusMode":
                    await this.toggleFocusMode(
                        message.enabled,
                        message.password
                    );
                    sendResponse({ success: true });
                    break;

                case "getStats":
                    const stats = await this.getDailyStats();
                    sendResponse(stats);
                    break;

                case "emergencyAccess":
                    await this.handleEmergencyAccess(
                        message.reason,
                        message.site
                    );
                    sendResponse({ success: true });
                    break;

                case "checkPassword":
                    const isValid = await this.checkPassword(message.password);
                    sendResponse({ valid: isValid });
                    break;

                default:
                    sendResponse({ error: "Unknown action" });
            }
        } catch (error) {
            console.error("Error handling message:", error);
            sendResponse({ error: error.message });
        }
    }

    async toggleFocusMode(enabled, password = "") {
        const settings = await chrome.storage.local.get([
            "passwordProtection",
            "password",
        ]);

        // Kiểm tra password nếu đang tắt focus mode
        if (!enabled && settings.passwordProtection) {
            const isValid = await this.checkPassword(password);
            if (!isValid) {
                throw new Error("Mật khẩu không đúng");
            }
        }

        await chrome.storage.local.set({ focusMode: enabled });

        // Cập nhật icon
        const iconPath = enabled ? "icons/icon-active" : "icons/icon";
        chrome.action.setIcon({
            path: {
                16: `${iconPath}16.png`,
                32: `${iconPath}32.png`,
                48: `${iconPath}48.png`,
                128: `${iconPath}128.png`,
            },
        });

        // Cập nhật badge
        if (enabled) {
            chrome.action.setBadgeText({ text: "ON" });
            chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
        } else {
            chrome.action.setBadgeText({ text: "" });
        }
    }

    async getDailyStats() {
        const today = new Date().toISOString().split("T")[0];
        const stats = await chrome.storage.local.get([
            "dailyStats",
            "totalBlocks",
            "focusStreak",
        ]);

        const todayStats = stats.dailyStats[today] || {};
        const todayTotal = Object.values(todayStats).reduce((a, b) => a + b, 0);

        return {
            todayBlocks: todayTotal,
            totalBlocks: stats.totalBlocks || 0,
            focusStreak: stats.focusStreak || 0,
            siteBreakdown: todayStats,
        };
    }

    async checkPassword(inputPassword) {
        const settings = await chrome.storage.local.get(["password"]);
        return settings.password === inputPassword;
    }

    async handleEmergencyAccess(reason, site) {
        // Log emergency access
        const today = new Date().toISOString().split("T")[0];
        const emergencyLog = (await chrome.storage.local.get([
            "emergencyLog",
        ])) || { emergencyLog: {} };

        if (!emergencyLog.emergencyLog[today]) {
            emergencyLog.emergencyLog[today] = [];
        }

        emergencyLog.emergencyLog[today].push({
            site,
            reason,
            timestamp: new Date().toISOString(),
        });

        await chrome.storage.local.set(emergencyLog);

        // Tạm thời tắt focus mode trong 5 phút
        await chrome.storage.local.set({
            focusMode: false,
            emergencyMode: true,
            emergencyEndTime: Date.now() + 5 * 60 * 1000, // 5 phút
        });

        // Set alarm để bật lại
        chrome.alarms.create("endEmergency", {
            when: Date.now() + 5 * 60 * 1000,
        });
    }

    async handleAlarm(alarm) {
        switch (alarm.name) {
            case "dailyReset":
                await this.resetDailyStats();
                break;
            case "autoEnable":
                await this.autoEnableFocusMode();
                break;
            case "endEmergency":
                await this.endEmergencyMode();
                break;
        }
    }

    setupDailyReset() {
        // Reset stats lúc 0:00 hàng ngày
        chrome.alarms.create("dailyReset", {
            when: this.getNextMidnight(),
            periodInMinutes: 24 * 60,
        });
    }

    getNextMidnight() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        return midnight.getTime();
    }

    async resetDailyStats() {
        const today = new Date().toISOString().split("T")[0];
        const stats = await chrome.storage.local.get(["dailyStats"]);

        // Xóa stats cũ hơn 30 ngày
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        Object.keys(stats.dailyStats).forEach((date) => {
            if (new Date(date) < thirtyDaysAgo) {
                delete stats.dailyStats[date];
            }
        });

        await chrome.storage.local.set({ dailyStats: stats.dailyStats });

        // Reset badge
        chrome.action.setBadgeText({ text: "" });
    }

    async checkAutoEnable() {
        const settings = await chrome.storage.local.get([
            "autoEnable",
            "schedules",
        ]);

        if (settings.autoEnable && this.isInSchedule(settings.schedules)) {
            await this.toggleFocusMode(true);
        }
    }

    async autoEnableFocusMode() {
        const settings = await chrome.storage.local.get(["autoEnable"]);
        if (settings.autoEnable) {
            await this.toggleFocusMode(true);
        }
    }

    async endEmergencyMode() {
        await chrome.storage.local.set({
            focusMode: true,
            emergencyMode: false,
            emergencyEndTime: null,
        });
    }
}

// Khởi tạo background service
new FocusForgeBackground();
