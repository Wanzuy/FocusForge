// Settings Page Script cho FocusForge
// Quản lý tất cả cài đặt của extension

class FocusForgeSettings {
    constructor() {
        this.settings = {};
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.updateUI();
    }

    async loadSettings() {
        this.settings = await chrome.storage.local.get([
            // Security
            "passwordProtection",
            "password",
            "mindfulUnlock",

            // Automation
            "autoEnable",
            "startupCheck",

            // Emergency
            "emergencyAccess",
            "emergencyDuration",

            // UI
            "showWidget",
            "motivationalMessages",
            "showBadge",

            // Notifications
            "notifyOnStart",
            "notifyOnEnd",
            "reminderEnabled",

            // Other settings
            "focusMode",
            "whitelistMode",
            "blockedSites",
            "whitelist",
            "schedules",
            "dailyStats",
        ]);
    }

    setupEventListeners() {
        // Security settings
        document
            .getElementById("passwordProtection")
            .addEventListener("change", (e) => {
                this.togglePasswordProtection(e.target.checked);
            });

        document
            .getElementById("changePasswordBtn")
            .addEventListener("click", () => {
                this.changePassword();
            });

        document
            .getElementById("mindfulUnlock")
            .addEventListener("change", (e) => {
                this.saveSetting("mindfulUnlock", e.target.checked);
            });

        // Automation settings
        document
            .getElementById("autoEnable")
            .addEventListener("change", (e) => {
                this.saveSetting("autoEnable", e.target.checked);
            });

        document
            .getElementById("startupCheck")
            .addEventListener("change", (e) => {
                this.saveSetting("startupCheck", e.target.checked);
            });

        // Emergency settings
        document
            .getElementById("emergencyAccess")
            .addEventListener("change", (e) => {
                this.saveSetting("emergencyAccess", e.target.checked);
            });

        document
            .getElementById("emergencyDuration")
            .addEventListener("change", (e) => {
                this.saveSetting("emergencyDuration", parseInt(e.target.value));
            });

        // UI settings
        document
            .getElementById("showWidget")
            .addEventListener("change", (e) => {
                this.saveSetting("showWidget", e.target.checked);
            });

        document
            .getElementById("motivationalMessages")
            .addEventListener("change", (e) => {
                this.saveSetting("motivationalMessages", e.target.checked);
            });

        document.getElementById("showBadge").addEventListener("change", (e) => {
            this.saveSetting("showBadge", e.target.checked);
        });

        // Notification settings
        document
            .getElementById("notifyOnStart")
            .addEventListener("change", (e) => {
                this.saveSetting("notifyOnStart", e.target.checked);
            });

        document
            .getElementById("notifyOnEnd")
            .addEventListener("change", (e) => {
                this.saveSetting("notifyOnEnd", e.target.checked);
            });

        document
            .getElementById("reminderEnabled")
            .addEventListener("change", (e) => {
                this.saveSetting("reminderEnabled", e.target.checked);
            });

        // Data management
        document
            .getElementById("exportSettingsBtn")
            .addEventListener("click", () => {
                this.exportSettings();
            });

        document
            .getElementById("importSettingsBtn")
            .addEventListener("click", () => {
                document.getElementById("importSettingsFile").click();
            });

        document
            .getElementById("importSettingsFile")
            .addEventListener("change", (e) => {
                this.importSettings(e.target.files[0]);
            });

        document
            .getElementById("clearStatsBtn")
            .addEventListener("click", () => {
                this.clearStats();
            });

        document
            .getElementById("resetExtensionBtn")
            .addEventListener("click", () => {
                this.resetExtension();
            });

        // Save all button
        document.getElementById("saveAllBtn").addEventListener("click", () => {
            this.saveAllSettings();
        });
    }

    updateUI() {
        // Security settings
        document.getElementById("passwordProtection").checked =
            this.settings.passwordProtection || false;
        document.getElementById("mindfulUnlock").checked =
            this.settings.mindfulUnlock || false;

        // Show/hide password settings
        const passwordSettings = document.getElementById("passwordSettings");
        passwordSettings.style.display = this.settings.passwordProtection
            ? "block"
            : "none";

        // Automation settings
        document.getElementById("autoEnable").checked =
            this.settings.autoEnable || false;
        document.getElementById("startupCheck").checked =
            this.settings.startupCheck || false;

        // Emergency settings
        document.getElementById("emergencyAccess").checked =
            this.settings.emergencyAccess || false;
        document.getElementById("emergencyDuration").value =
            this.settings.emergencyDuration || 5;

        // UI settings
        document.getElementById("showWidget").checked =
            this.settings.showWidget !== false; // Default true
        document.getElementById("motivationalMessages").checked =
            this.settings.motivationalMessages !== false;
        document.getElementById("showBadge").checked =
            this.settings.showBadge !== false;

        // Notification settings
        document.getElementById("notifyOnStart").checked =
            this.settings.notifyOnStart !== false;
        document.getElementById("notifyOnEnd").checked =
            this.settings.notifyOnEnd !== false;
        document.getElementById("reminderEnabled").checked =
            this.settings.reminderEnabled !== false;
    }

    async togglePasswordProtection(enabled) {
        if (enabled) {
            // Enable password protection
            const password = prompt("Đặt mật khẩu để bảo vệ Focus Mode:");
            if (!password) {
                document.getElementById("passwordProtection").checked = false;
                return;
            }

            if (password.length < 4) {
                this.showNotification(
                    "Mật khẩu phải có ít nhất 4 ký tự",
                    "error"
                );
                document.getElementById("passwordProtection").checked = false;
                return;
            }

            await this.saveSetting("passwordProtection", true);
            await this.saveSetting("password", password);
            this.showNotification("Đã bật bảo vệ mật khẩu", "success");
        } else {
            // Disable password protection
            if (this.settings.password) {
                const currentPassword = prompt(
                    "Nhập mật khẩu hiện tại để tắt bảo vệ:"
                );
                if (currentPassword !== this.settings.password) {
                    this.showNotification("Mật khẩu không đúng", "error");
                    document.getElementById(
                        "passwordProtection"
                    ).checked = true;
                    return;
                }
            }

            await this.saveSetting("passwordProtection", false);
            await this.saveSetting("password", "");
            this.showNotification("Đã tắt bảo vệ mật khẩu", "success");
        }

        this.updateUI();
    }

    async changePassword() {
        const currentPassword =
            document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showNotification("Vui lòng điền đầy đủ thông tin", "error");
            return;
        }

        if (currentPassword !== this.settings.password) {
            this.showNotification("Mật khẩu hiện tại không đúng", "error");
            return;
        }

        if (newPassword.length < 4) {
            this.showNotification(
                "Mật khẩu mới phải có ít nhất 4 ký tự",
                "error"
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification("Mật khẩu xác nhận không khớp", "error");
            return;
        }

        await this.saveSetting("password", newPassword);

        // Clear form
        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";

        this.showNotification("Đã đổi mật khẩu thành công", "success");
    }

    async saveSetting(key, value) {
        this.settings[key] = value;
        await chrome.storage.local.set({ [key]: value });
    }

    async saveAllSettings() {
        // Collect all settings from UI
        const newSettings = {
            // Security
            passwordProtection:
                document.getElementById("passwordProtection").checked,
            mindfulUnlock: document.getElementById("mindfulUnlock").checked,

            // Automation
            autoEnable: document.getElementById("autoEnable").checked,
            startupCheck: document.getElementById("startupCheck").checked,

            // Emergency
            emergencyAccess: document.getElementById("emergencyAccess").checked,
            emergencyDuration: parseInt(
                document.getElementById("emergencyDuration").value
            ),

            // UI
            showWidget: document.getElementById("showWidget").checked,
            motivationalMessages: document.getElementById(
                "motivationalMessages"
            ).checked,
            showBadge: document.getElementById("showBadge").checked,

            // Notifications
            notifyOnStart: document.getElementById("notifyOnStart").checked,
            notifyOnEnd: document.getElementById("notifyOnEnd").checked,
            reminderEnabled: document.getElementById("reminderEnabled").checked,
        };

        // Save all settings
        await chrome.storage.local.set(newSettings);
        Object.assign(this.settings, newSettings);

        this.showNotification("Đã lưu tất cả cài đặt", "success");
    }

    exportSettings() {
        const exportData = {
            exportedAt: new Date().toISOString(),
            version: "1.0.0",
            settings: {
                // Only export non-sensitive settings
                mindfulUnlock: this.settings.mindfulUnlock,
                autoEnable: this.settings.autoEnable,
                startupCheck: this.settings.startupCheck,
                emergencyAccess: this.settings.emergencyAccess,
                emergencyDuration: this.settings.emergencyDuration,
                showWidget: this.settings.showWidget,
                motivationalMessages: this.settings.motivationalMessages,
                showBadge: this.settings.showBadge,
                notifyOnStart: this.settings.notifyOnStart,
                notifyOnEnd: this.settings.notifyOnEnd,
                reminderEnabled: this.settings.reminderEnabled,
                whitelistMode: this.settings.whitelistMode,
                blockedSites: this.settings.blockedSites,
                whitelist: this.settings.whitelist,
                schedules: this.settings.schedules,
            },
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `focusforge-settings-${
            new Date().toISOString().split("T")[0]
        }.json`;
        a.click();

        URL.revokeObjectURL(url);

        this.showNotification("Đã xuất cài đặt thành công", "success");
    }

    async importSettings(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            if (!importData.settings) {
                throw new Error("File không đúng định dạng");
            }

            if (
                confirm(
                    "Nhập cài đặt sẽ ghi đè lên cài đặt hiện tại. Bạn có chắc chắn?"
                )
            ) {
                // Import settings (excluding password)
                const settingsToImport = { ...importData.settings };
                delete settingsToImport.password;
                delete settingsToImport.passwordProtection;

                await chrome.storage.local.set(settingsToImport);
                Object.assign(this.settings, settingsToImport);

                this.updateUI();
                this.showNotification("Đã nhập cài đặt thành công", "success");
            }
        } catch (error) {
            this.showNotification(
                "Lỗi nhập cài đặt: " + error.message,
                "error"
            );
        }

        // Clear file input
        document.getElementById("importSettingsFile").value = "";
    }

    async clearStats() {
        if (
            confirm(
                "Bạn có chắc muốn xóa toàn bộ dữ liệu thống kê? Hành động này không thể hoàn tác."
            )
        ) {
            await chrome.storage.local.set({
                dailyStats: {},
                totalBlocks: 0,
                focusStreak: 0,
                focusTime: {},
                emergencyLog: {},
            });

            this.showNotification("Đã xóa toàn bộ dữ liệu thống kê", "success");
        }
    }

    async resetExtension() {
        if (
            confirm(
                "Bạn có chắc muốn đặt lại extension về cài đặt mặc định? Tất cả dữ liệu sẽ bị mất."
            )
        ) {
            const confirmReset = prompt('Nhập "RESET" để xác nhận:');
            if (confirmReset === "RESET") {
                // Clear all data
                await chrome.storage.local.clear();

                // Reload the page to reinitialize with default settings
                window.location.reload();

                this.showNotification(
                    "Đã đặt lại extension thành công",
                    "success"
                );
            } else {
                this.showNotification("Đặt lại đã bị hủy", "info");
            }
        }
    }

    showNotification(message, type = "info") {
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

        // Add styles if not exists
        if (!document.getElementById("notification-styles")) {
            const style = document.createElement("style");
            style.id = "notification-styles";
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    animation: slideInRight 0.3s ease-out;
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
                
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }
                
                @keyframes slideOutRight {
                    from { opacity: 1; transform: translateX(0); }
                    to { opacity: 0; transform: translateX(100%); }
                }
                
                .password-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    max-width: 300px;
                }
                
                .password-input-group input {
                    padding: 8px 12px;
                    border: 1px solid #e9ecef;
                    border-radius: 6px;
                    font-size: 14px;
                }
                
                .file-input-group {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .shortcuts-info {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                }
                
                .shortcut-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid #e9ecef;
                }
                
                .shortcut-item:last-child {
                    border-bottom: none;
                }
                
                .shortcut-item kbd {
                    background: #e9ecef;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    padding: 4px 8px;
                    font-size: 12px;
                    font-family: monospace;
                    margin: 0 2px;
                }
                
                .settings-footer {
                    margin-top: 40px;
                    padding: 24px;
                    background: #f8f9fa;
                    border-radius: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .version-info p {
                    margin: 0;
                    color: #666;
                    font-size: 14px;
                }
                
                .version-info p:first-child {
                    font-weight: 600;
                    color: #333;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = "slideOutRight 0.3s ease-out";
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    new FocusForgeSettings();
});
