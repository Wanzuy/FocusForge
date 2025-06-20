// Popup Script cho FocusForge
// Xử lý giao diện popup chính của extension

class FocusForgePopup {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadCurrentState();
        this.setupEventListeners();
        this.updateUI();
        this.loadStats();
    }

    async loadCurrentState() {
        this.settings = await chrome.storage.local.get([
            "focusMode",
            "passwordProtection",
            "mindfulUnlock",
            "blockedSites",
            "schedules",
            "dailyStats",
            "totalBlocks",
            "focusStreak",
        ]);
    }

    setupEventListeners() {
        // Toggle Focus Mode
        const focusToggle = document.getElementById("focusModeToggle");
        focusToggle.addEventListener("change", (e) => {
            this.handleFocusToggle(e.target.checked);
        });

        // Navigation buttons
        document.getElementById("manageBtn").addEventListener("click", () => {
            this.openManagePage();
        });

        document.getElementById("scheduleBtn").addEventListener("click", () => {
            this.openSchedulePage();
        });

        document.getElementById("settingsBtn").addEventListener("click", () => {
            this.openSettingsPage();
        });

        // Mindful unlock buttons
        document
            .getElementById("confirmDisable")
            .addEventListener("click", () => {
                this.confirmDisableFocus();
            });

        document.getElementById("stayFocused").addEventListener("click", () => {
            this.stayFocused();
        });
    }

    async handleFocusToggle(enabled) {
        try {
            // Nếu đang bật và có mindful unlock
            if (!enabled && this.settings.mindfulUnlock) {
                this.showMindfulUnlock();
                return;
            }

            // Nếu đang bật và có password protection
            if (!enabled && this.settings.passwordProtection) {
                const password = await this.promptPassword();
                if (!password) {
                    document.getElementById("focusModeToggle").checked = true;
                    return;
                }

                const response = await this.sendMessage({
                    action: "checkPassword",
                    password: password,
                });

                if (!response.valid) {
                    this.showError("Mật khẩu không đúng!");
                    document.getElementById("focusModeToggle").checked = true;
                    return;
                }
            }

            await this.toggleFocusMode(enabled);
        } catch (error) {
            console.error("Error handling focus toggle:", error);
            this.showError("Có lỗi xảy ra: " + error.message);
        }
    }

    showMindfulUnlock() {
        const mindfulMessage = document.getElementById("mindfulMessage");
        const mindfulText = document.getElementById("mindfulText");

        const currentHour = new Date().getHours();
        const messages = [
            `Bạn thật sự muốn tắt Focus Mode lúc ${currentHour}h không?`,
            "Hãy nghĩ về mục tiêu mà bạn đã đặt ra hôm nay",
            "Có phải bạn đang cảm thấy chán nản? Hãy thử nghỉ 5 phút thay vì vào mạng xã hội",
            "Bạn có chắc việc này thật sự cần thiết không?",
        ];

        mindfulText.textContent =
            messages[Math.floor(Math.random() * messages.length)];
        mindfulMessage.style.display = "block";

        // Tự động ẩn sau 10 giây
        setTimeout(() => {
            if (mindfulMessage.style.display === "block") {
                this.stayFocused();
            }
        }, 10000);
    }

    async confirmDisableFocus() {
        await this.toggleFocusMode(false);
        document.getElementById("mindfulMessage").style.display = "none";
    }

    stayFocused() {
        document.getElementById("focusModeToggle").checked = true;
        document.getElementById("mindfulMessage").style.display = "none";
        this.showSuccess("Tuyệt vời! Tiếp tục tập trung! 🎯");
    }

    async toggleFocusMode(enabled) {
        const response = await this.sendMessage({
            action: "toggleFocusMode",
            enabled: enabled,
        });

        if (response.success) {
            this.settings.focusMode = enabled;
            this.updateUI();
            this.showSuccess(
                enabled
                    ? "Focus Mode đã được BẬT 🎯"
                    : "Focus Mode đã được TẮT 😴"
            );
        } else {
            throw new Error(response.error || "Không thể thay đổi Focus Mode");
        }
    }

    async promptPassword() {
        return new Promise((resolve) => {
            const password = prompt("Nhập mật khẩu để tắt Focus Mode:");
            resolve(password);
        });
    }

    updateUI() {
        const focusToggle = document.getElementById("focusModeToggle");
        const statusDot = document.getElementById("statusDot");
        const statusText = document.getElementById("statusText");
        const toggleDescription = document.getElementById("toggleDescription");

        focusToggle.checked = this.settings.focusMode;

        if (this.settings.focusMode) {
            statusDot.className = "status-dot active";
            statusText.textContent = "Đang hoạt động";
            toggleDescription.textContent = "Focus Mode đang bật";
        } else {
            statusDot.className = "status-dot inactive";
            statusText.textContent = "Đã tắt";
            toggleDescription.textContent = "Focus Mode đang tắt";
        }

        // Kiểm tra schedule
        if (this.settings.focusMode && this.settings.schedules) {
            const inSchedule = this.isInSchedule(this.settings.schedules);
            if (!inSchedule) {
                statusDot.className = "status-dot paused";
                statusText.textContent = "Ngoài giờ";
                toggleDescription.textContent = "Ngoài thời gian lên lịch";
            }
        }
    }

    isInSchedule(schedules) {
        const now = new Date();
        const currentDay = now.toLocaleDateString("en-US", {
            weekday: "lowercase",
        });
        const currentTime = now.toTimeString().slice(0, 5);

        return schedules.some((schedule) => {
            if (!schedule.enabled) return false;
            if (!schedule.days.includes(currentDay)) return false;
            return (
                currentTime >= schedule.startTime &&
                currentTime <= schedule.endTime
            );
        });
    }

    async loadStats() {
        const stats = await this.sendMessage({ action: "getStats" });

        document.getElementById("todayBlocks").textContent =
            stats.todayBlocks || 0;

        // Tính thời gian tập trung (giả sử mỗi lần chặn = 2 phút tiết kiệm)
        const focusMinutes = (stats.todayBlocks || 0) * 2;
        const focusHours = Math.floor(focusMinutes / 60);
        const remainingMinutes = focusMinutes % 60;

        let focusTimeText = "";
        if (focusHours > 0) {
            focusTimeText = `${focusHours}h${
                remainingMinutes > 0 ? ` ${remainingMinutes}m` : ""
            }`;
        } else {
            focusTimeText = `${remainingMinutes}m`;
        }

        document.getElementById("focusTime").textContent = focusTimeText;
    }

    openManagePage() {
        chrome.tabs.create({
            url: chrome.runtime.getURL("pages/manage.html"),
        });
        window.close();
    }

    openSchedulePage() {
        chrome.tabs.create({
            url: chrome.runtime.getURL("pages/schedule.html"),
        });
        window.close();
    }

    openSettingsPage() {
        chrome.tabs.create({
            url: chrome.runtime.getURL("pages/settings.html"),
        });
        window.close();
    }

    showSuccess(message) {
        this.showNotification(message, "success");
    }

    showError(message) {
        this.showNotification(message, "error");
    }

    showNotification(message, type = "info") {
        // Tạo notification element
        const notification = document.createElement("div");
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${
                        type === "success"
                            ? "✅"
                            : type === "error"
                            ? "❌"
                            : "ℹ️"
                    }
                </span>
                <span class="notification-text">${message}</span>
            </div>
        `;

        // Thêm styles nếu chưa có
        if (!document.getElementById("notification-styles")) {
            const style = document.createElement("style");
            style.id = "notification-styles";
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 10000;
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    animation: slideDown 0.3s ease-out;
                }
                
                .notification-success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .notification-error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                
                .notification-info {
                    background: #d1ecf1;
                    color: #0c5460;
                    border: 1px solid #bee5eb;
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Tự động ẩn sau 3 giây
        setTimeout(() => {
            notification.style.animation = "slideUp 0.3s ease-out";
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    sendMessage(message) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, resolve);
        });
    }
}

// Khởi tạo popup khi DOM ready
document.addEventListener("DOMContentLoaded", () => {
    new FocusForgePopup();
});
