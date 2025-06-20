// Block Page Script cho FocusForge
// Xử lý trang bị chặn với thống kê và emergency access

class FocusForgeBlockPage {
    constructor() {
        this.init();
    }

    async init() {
        this.loadBlockedSite();
        await this.loadSettings();
        await this.updateStats();
        this.setupEventListeners();
        this.updateTimeInfo();
        this.startTimer();
        this.showMotivationalMessage();
    }

    loadBlockedSite() {
        const urlParams = new URLSearchParams(window.location.search);
        this.blockedSite = urlParams.get("site") || "website này";
        document.title = `${this.blockedSite} bị chặn - FocusForge`;
    }

    async loadSettings() {
        this.settings = await chrome.storage.local.get([
            "emergencyAccess",
            "schedules",
            "dailyStats",
            "motivationalMessages",
        ]);
    }

    async updateStats() {
        try {
            const today = new Date().toISOString().split("T")[0];
            const stats = this.settings.dailyStats[today] || {};

            // Cập nhật số lần cố truy cập trang này
            const siteAttempts = stats[this.blockedSite] || 0;
            document.getElementById("todayAttempts").textContent = siteAttempts;

            // Cập nhật tổng số lần cố truy cập
            const totalAttempts = Object.values(stats).reduce(
                (a, b) => a + b,
                0
            );

            // Lưu attempt mới
            if (!stats[this.blockedSite]) {
                stats[this.blockedSite] = 0;
            }
            stats[this.blockedSite]++;

            // Lưu lại stats
            const newDailyStats = { ...this.settings.dailyStats };
            newDailyStats[today] = stats;

            await chrome.storage.local.set({ dailyStats: newDailyStats });

            // Cập nhật lại UI
            document.getElementById("todayAttempts").textContent =
                stats[this.blockedSite];
        } catch (error) {
            console.error("Error updating stats:", error);
        }
    }

    setupEventListeners() {
        // Emergency access
        if (this.settings.emergencyAccess) {
            document.getElementById("emergencySection").style.display = "block";

            document
                .getElementById("emergencyBtn")
                .addEventListener("click", () => {
                    this.showEmergencyForm();
                });

            document
                .getElementById("confirmEmergency")
                .addEventListener("click", () => {
                    this.handleEmergencyAccess();
                });

            document
                .getElementById("cancelEmergency")
                .addEventListener("click", () => {
                    this.hideEmergencyForm();
                });
        }

        // Disable focus mode
        document
            .getElementById("disableFocusBtn")
            .addEventListener("click", () => {
                this.disableFocusMode();
            });

        // Keyboard shortcuts
        document.addEventListener("keydown", (e) => {
            // Esc để đóng emergency access
            if (e.key === "Escape") {
                this.hideEmergencyForm();
            }

            // Ctrl+Enter để confirm emergency
            if (e.ctrlKey && e.key === "Enter") {
                const form = document.getElementById("emergencyForm");
                if (form.style.display !== "none") {
                    this.handleEmergencyAccess();
                }
            }
        });
    }

    updateTimeInfo() {
        const schedules = this.settings.schedules || [];
        const activeSchedule = this.getCurrentActiveSchedule(schedules);

        if (activeSchedule) {
            const endTime = activeSchedule.endTime;
            const remainingTime = this.calculateRemainingTime(endTime);

            document.getElementById("endTime").textContent = endTime;
            document.getElementById("remainingTime").textContent =
                remainingTime;
        } else {
            document.getElementById("endTime").textContent = "Không xác định";
            document.getElementById("remainingTime").textContent =
                "Không xác định";
        }
    }

    getCurrentActiveSchedule(schedules) {
        const now = new Date();
        const currentDay = now.toLocaleDateString("en-US", {
            weekday: "lowercase",
        });
        const currentTime = now.toTimeString().slice(0, 5);

        return schedules.find((schedule) => {
            if (!schedule.enabled) return false;
            if (!schedule.days.includes(currentDay)) return false;
            return (
                currentTime >= schedule.startTime &&
                currentTime <= schedule.endTime
            );
        });
    }

    calculateRemainingTime(endTime) {
        const now = new Date();
        const [hours, minutes] = endTime.split(":").map(Number);
        const endDate = new Date(now);
        endDate.setHours(hours, minutes, 0, 0);

        // Nếu thời gian kết thúc đã qua, có thể là ngày hôm sau
        if (endDate < now) {
            endDate.setDate(endDate.getDate() + 1);
        }

        const diff = endDate - now;
        const remainingHours = Math.floor(diff / (1000 * 60 * 60));
        const remainingMinutes = Math.floor(
            (diff % (1000 * 60 * 60)) / (1000 * 60)
        );

        if (remainingHours > 0) {
            return `${remainingHours}h ${remainingMinutes}m`;
        } else {
            return `${remainingMinutes}m`;
        }
    }

    startTimer() {
        // Cập nhật thời gian còn lại mỗi phút
        setInterval(() => {
            this.updateTimeInfo();
        }, 60000);
    }

    showMotivationalMessage() {
        const messages = [
            "Bạn đang làm rất tốt! 🌟",
            "Mỗi lần chặn là một bước tiến! 💪",
            "Sự tập trung là siêu năng lực! ⚡",
            "Bạn mạnh mẽ hơn sự cám dỗ! 🎯",
            "Thành công đến từ sự kiên trì! 🚀",
            "Hãy tự hào về bản thân! 👏",
            "Bạn đang xây dựng thói quen tuyệt vời! 🏗️",
        ];

        const randomMessage =
            messages[Math.floor(Math.random() * messages.length)];
        document.getElementById("motivationalText").textContent = randomMessage;

        // Thay đổi message mỗi 10 giây
        setInterval(() => {
            const newMessage =
                messages[Math.floor(Math.random() * messages.length)];
            document.getElementById("motivationalText").textContent =
                newMessage;
        }, 10000);
    }

    showEmergencyForm() {
        document.getElementById("emergencyForm").style.display = "block";
        document.getElementById("emergencyReason").focus();
    }

    hideEmergencyForm() {
        document.getElementById("emergencyForm").style.display = "none";
        document.getElementById("emergencyReason").value = "";
    }

    async handleEmergencyAccess() {
        const reason = document.getElementById("emergencyReason").value.trim();

        if (!reason) {
            alert("Vui lòng nhập lý do khẩn cấp");
            return;
        }

        if (reason.length < 10) {
            alert("Lý do phải có ít nhất 10 ký tự");
            return;
        }

        try {
            const response = await this.sendMessage({
                action: "emergencyAccess",
                reason: reason,
                site: this.blockedSite,
            });

            if (response.success) {
                // Hiển thị thông báo và redirect
                const notification = document.createElement("div");
                notification.className = "emergency-success";
                notification.innerHTML = `
                    <h3>🚨 Truy cập khẩn cấp được cấp</h3>
                    <p>Focus Mode sẽ được tắt trong 5 phút</p>
                    <p>Lý do: ${reason}</p>
                    <p>Đang chuyển hướng trong <span id="countdown">3</span> giây...</p>
                `;

                // Thêm styles
                const style = document.createElement("style");
                style.textContent = `
                    .emergency-success {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: #fff3cd;
                        border: 2px solid #ffeaa7;
                        border-radius: 12px;
                        padding: 24px;
                        text-align: center;
                        z-index: 10000;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    }
                    
                    .emergency-success h3 {
                        color: #856404;
                        margin-bottom: 12px;
                    }
                    
                    .emergency-success p {
                        color: #856404;
                        margin-bottom: 8px;
                    }
                `;

                document.head.appendChild(style);
                document.body.appendChild(notification);

                // Countdown và redirect
                let countdown = 3;
                const countdownElement = document.getElementById("countdown");
                const countdownInterval = setInterval(() => {
                    countdown--;
                    countdownElement.textContent = countdown;

                    if (countdown <= 0) {
                        clearInterval(countdownInterval);
                        window.history.back();
                    }
                }, 1000);
            } else {
                alert("Không thể cấp quyền truy cập khẩn cấp");
            }
        } catch (error) {
            console.error("Error handling emergency access:", error);
            alert("Có lỗi xảy ra: " + error.message);
        }
    }

    async disableFocusMode() {
        // Hiển thị dialog xác nhận
        const confirmed = confirm(
            "Bạn có chắc chắn muốn tắt Focus Mode?\n" +
                "Điều này sẽ cho phép truy cập tất cả các trang web."
        );

        if (!confirmed) return;

        try {
            const response = await this.sendMessage({
                action: "toggleFocusMode",
                enabled: false,
            });

            if (response.success) {
                // Hiển thị thông báo
                const notification = document.createElement("div");
                notification.innerHTML = `
                    <div class="disable-success">
                        <h3>😴 Focus Mode đã được tắt</h3>
                        <p>Bạn có thể truy cập tất cả các trang web</p>
                        <p>Đang chuyển hướng...</p>
                    </div>
                `;

                document.body.appendChild(notification);

                // Redirect sau 2 giây
                setTimeout(() => {
                    window.history.back();
                }, 2000);
            } else {
                alert(
                    "Không thể tắt Focus Mode: " +
                        (response.error || "Lỗi không xác định")
                );
            }
        } catch (error) {
            console.error("Error disabling focus mode:", error);
            alert("Có lỗi xảy ra: " + error.message);
        }
    }

    sendMessage(message) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, resolve);
        });
    }
}

// Khởi tạo block page khi DOM ready
document.addEventListener("DOMContentLoaded", () => {
    new FocusForgeBlockPage();
});
