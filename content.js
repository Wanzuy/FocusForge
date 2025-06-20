// Content Script cho FocusForge
// Chạy trên mọi trang để hỗ trợ blocking và monitoring

class FocusForgeContent {
    constructor() {
        this.init();
    }

    init() {
        // Kiểm tra nếu đây là trang block của extension
        if (window.location.href.includes(chrome.runtime.getURL(""))) {
            return; // Không chạy content script trên trang block
        }

        this.setupPageMonitoring();
        this.setupKeyboardShortcuts();
        this.injectFocusReminders();
    }

    setupPageMonitoring() {
        // Theo dõi focus/blur events để tính thời gian tập trung
        let focusStartTime = Date.now();
        let totalFocusTime = 0;

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                // Trang bị ẩn
                totalFocusTime += Date.now() - focusStartTime;
                this.saveFocusTime(totalFocusTime);
            } else {
                // Trang được focus lại
                focusStartTime = Date.now();
            }
        });

        window.addEventListener("beforeunload", () => {
            totalFocusTime += Date.now() - focusStartTime;
            this.saveFocusTime(totalFocusTime);
        });
    }

    async saveFocusTime(timeSpent) {
        try {
            const today = new Date().toISOString().split("T")[0];
            const hostname = window.location.hostname.replace("www.", "");

            // Chỉ lưu thời gian cho các trang productive
            if (this.isProductiveSite(hostname)) {
                const data = (await chrome.storage.local.get([
                    "focusTime",
                ])) || { focusTime: {} };

                if (!data.focusTime[today]) {
                    data.focusTime[today] = {};
                }

                if (!data.focusTime[today][hostname]) {
                    data.focusTime[today][hostname] = 0;
                }

                data.focusTime[today][hostname] += Math.floor(timeSpent / 1000); // Lưu theo giây

                chrome.runtime.sendMessage({
                    action: "saveFocusTime",
                    data: data.focusTime,
                });
            }
        } catch (error) {
            console.error("Error saving focus time:", error);
        }
    }

    isProductiveSite(hostname) {
        const productiveSites = [
            "github.com",
            "stackoverflow.com",
            "docs.google.com",
            "notion.so",
            "trello.com",
            "slack.com",
            "teams.microsoft.com",
            "codepen.io",
            "codesandbox.io",
            "figma.com",
            "canva.com",
        ];

        return (
            productiveSites.some(
                (site) => hostname.includes(site) || site.includes(hostname)
            ) ||
            hostname.includes("localhost") ||
            hostname.includes("127.0.0.1")
        );
    }

    setupKeyboardShortcuts() {
        document.addEventListener("keydown", (event) => {
            // Ctrl+Shift+F để toggle focus mode nhanh
            if (event.ctrlKey && event.shiftKey && event.key === "F") {
                event.preventDefault();
                this.quickToggleFocus();
            }

            // Ctrl+Shift+S để xem stats nhanh
            if (event.ctrlKey && event.shiftKey && event.key === "S") {
                event.preventDefault();
                this.showQuickStats();
            }
        });
    }

    async quickToggleFocus() {
        try {
            const settings = await chrome.storage.local.get(["focusMode"]);
            const newState = !settings.focusMode;

            chrome.runtime.sendMessage(
                {
                    action: "toggleFocusMode",
                    enabled: newState,
                },
                (response) => {
                    if (response.success) {
                        this.showNotification(
                            newState ? "Focus Mode BẬT" : "Focus Mode TẮT",
                            newState ? "🎯" : "😴"
                        );
                    }
                }
            );
        } catch (error) {
            console.error("Error toggling focus:", error);
        }
    }

    async showQuickStats() {
        chrome.runtime.sendMessage({ action: "getStats" }, (stats) => {
            this.showNotification(
                `Hôm nay: ${stats.todayBlocks} lần bị chặn`,
                "📊",
                3000
            );
        });
    }

    showNotification(message, icon = "🎯", duration = 2000) {
        // Tạo notification đẹp mắt
        const notification = document.createElement("div");
        notification.className = "focusforge-notification";
        notification.innerHTML = `
            <div class="focusforge-notification-content">
                <span class="focusforge-notification-icon">${icon}</span>
                <span class="focusforge-notification-text">${message}</span>
            </div>
        `;

        // Thêm styles
        const style = document.createElement("style");
        style.textContent = `
            .focusforge-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 14px;
                animation: focusforge-slide-in 0.3s ease-out;
            }
            
            .focusforge-notification-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .focusforge-notification-icon {
                font-size: 16px;
            }
            
            @keyframes focusforge-slide-in {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes focusforge-fade-out {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(notification);

        // Tự động ẩn sau duration
        setTimeout(() => {
            notification.style.animation = "focusforge-fade-out 0.3s ease-out";
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            }, 300);
        }, duration);
    }

    injectFocusReminders() {
        // Inject subtle focus reminders vào trang
        this.createFocusWidget();
        this.setupPeriodicReminders();
    }

    async createFocusWidget() {
        const settings = await chrome.storage.local.get([
            "focusMode",
            "showWidget",
        ]);

        if (!settings.focusMode || settings.showWidget === false) return;

        const widget = document.createElement("div");
        widget.id = "focusforge-widget";
        widget.innerHTML = `
            <div class="focusforge-widget-content">
                <div class="focusforge-widget-icon">🎯</div>
                <div class="focusforge-widget-text">Focus</div>
                <div class="focusforge-widget-time" id="focusforge-timer">00:00</div>
            </div>
        `;

        const widgetStyle = document.createElement("style");
        widgetStyle.textContent = `
            #focusforge-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 999998;
                background: rgba(102, 126, 234, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-family: 'Segoe UI', sans-serif;
                font-size: 12px;
                cursor: pointer;
                backdrop-filter: blur(10px);
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
                opacity: 0.7;
            }
            
            #focusforge-widget:hover {
                opacity: 1;
                transform: scale(1.05);
            }
            
            .focusforge-widget-content {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .focusforge-widget-icon {
                font-size: 14px;
            }
            
            .focusforge-widget-text {
                font-weight: 600;
            }
            
            .focusforge-widget-time {
                font-size: 11px;
                opacity: 0.8;
            }
        `;

        document.head.appendChild(widgetStyle);
        document.body.appendChild(widget);

        // Timer
        let startTime = Date.now();
        const timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            const timerElement = document.getElementById("focusforge-timer");
            if (timerElement) {
                timerElement.textContent = `${minutes
                    .toString()
                    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
            } else {
                clearInterval(timer);
            }
        }, 1000);

        // Click để mở popup
        widget.addEventListener("click", () => {
            chrome.runtime.sendMessage({ action: "openPopup" });
        });
    }

    setupPeriodicReminders() {
        // Reminder mỗi 30 phút
        setInterval(() => {
            this.showFocusReminder();
        }, 30 * 60 * 1000);
    }

    async showFocusReminder() {
        const settings = await chrome.storage.local.get([
            "focusMode",
            "reminderEnabled",
        ]);

        if (!settings.focusMode || settings.reminderEnabled === false) return;

        const reminders = [
            "💪 Bạn đang làm rất tốt! Tiếp tục tập trung!",
            "🌟 Hãy thở sâu và tập trung vào mục tiêu hiện tại",
            "⚡ Năng lượng tập trung của bạn rất tuyệt vời!",
            "🎯 Mỗi phút tập trung đều có giá trị",
            "🚀 Bạn đang xây dựng thói quen tuyệt vời!",
        ];

        const randomReminder =
            reminders[Math.floor(Math.random() * reminders.length)];
        this.showNotification(randomReminder, "💡", 3000);
    }
}

// Khởi tạo content script
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        new FocusForgeContent();
    });
} else {
    new FocusForgeContent();
}
