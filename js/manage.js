// Manage Page Script cho FocusForge
// Quản lý danh sách website chặn/cho phép

class FocusForgeManage {
    constructor() {
        this.sites = [];
        this.filteredSites = [];
        this.whitelistMode = false;
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.updateUI();
        this.loadSites();
    }

    async loadSettings() {
        const data = await chrome.storage.local.get([
            "blockedSites",
            "whitelist",
            "whitelistMode",
        ]);

        this.sites = data.blockedSites || [];
        this.whitelist = data.whitelist || [];
        this.whitelistMode = data.whitelistMode || false;
    }

    setupEventListeners() {
        // Whitelist mode toggle
        document
            .getElementById("whitelistMode")
            .addEventListener("change", (e) => {
                this.toggleWhitelistMode(e.target.checked);
            });

        // Add site button
        document.getElementById("addSiteBtn").addEventListener("click", () => {
            this.showAddSiteModal();
        });

        // Search functionality
        document
            .getElementById("searchInput")
            .addEventListener("input", (e) => {
                this.filterSites(e.target.value);
            });

        // Bulk actions
        document.getElementById("importBtn").addEventListener("click", () => {
            this.importSites();
        });

        document.getElementById("exportBtn").addEventListener("click", () => {
            this.exportSites();
        });

        document.getElementById("clearAllBtn").addEventListener("click", () => {
            this.clearAllSites();
        });

        // Preset buttons
        document.querySelectorAll(".preset-card").forEach((card) => {
            card.addEventListener("click", () => {
                const preset = card.dataset.preset;
                this.applyPreset(preset);
            });
        });

        // Modal events
        this.setupModalEvents();
    }

    setupModalEvents() {
        const modal = document.getElementById("addSiteModal");
        const closeBtn = document.getElementById("closeModal");
        const cancelBtn = document.getElementById("cancelAdd");
        const confirmBtn = document.getElementById("confirmAdd");

        closeBtn.addEventListener("click", () => this.hideAddSiteModal());
        cancelBtn.addEventListener("click", () => this.hideAddSiteModal());
        confirmBtn.addEventListener("click", () => this.confirmAddSite());

        // Close modal when clicking outside
        window.addEventListener("click", (e) => {
            if (e.target === modal) {
                this.hideAddSiteModal();
            }
        });

        // Auto-fill site name from URL
        document.getElementById("siteUrl").addEventListener("input", (e) => {
            this.autoFillSiteName(e.target.value);
        });
    }

    updateUI() {
        const toggle = document.getElementById("whitelistMode");
        const modeDescription = document.getElementById("modeDescription");
        const listTitle = document.getElementById("listTitle");

        toggle.checked = this.whitelistMode;

        if (this.whitelistMode) {
            modeDescription.textContent =
                "Chỉ cho phép truy cập các website trong danh sách";
            listTitle.textContent = "Danh sách website được phép";
        } else {
            modeDescription.textContent = "Chặn các website trong danh sách";
            listTitle.textContent = "Danh sách website bị chặn";
        }
    }

    async toggleWhitelistMode(enabled) {
        this.whitelistMode = enabled;
        await chrome.storage.local.set({ whitelistMode: enabled });
        this.updateUI();
        this.loadSites();
        this.showNotification(
            enabled
                ? "Đã chuyển sang chế độ Whitelist"
                : "Đã chuyển sang chế độ Blacklist",
            "success"
        );
    }

    loadSites() {
        const currentList = this.whitelistMode ? this.whitelist : this.sites;
        this.filteredSites = [...currentList];
        this.renderSites();
    }

    renderSites() {
        const container = document.getElementById("sitesList");

        if (this.filteredSites.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎯</div>
                    <h3>Chưa có website nào</h3>
                    <p>Thêm website đầu tiên để bắt đầu sử dụng FocusForge</p>
                    <button class="btn btn-primary" onclick="document.getElementById('addSiteBtn').click()">
                        Thêm website
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredSites
            .map(
                (site, index) => `
            <div class="site-item" data-index="${index}">
                <div class="site-info">
                    <div class="site-icon">${this.getSiteIcon(site)}</div>
                    <div class="site-details">
                        <h4>${site.name || site.url || site}</h4>
                        <p>${site.url || site}</p>
                        <span class="site-category">${this.getCategoryName(
                            site.category
                        )}</span>
                    </div>
                </div>
                <div class="site-actions">
                    <button class="btn-icon" onclick="focusForgeManage.editSite(${index})" title="Chỉnh sửa">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                    </button>
                    <button class="btn-icon btn-danger" onclick="focusForgeManage.deleteSite(${index})" title="Xóa">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `
            )
            .join("");
    }

    getSiteIcon(site) {
        const domain = typeof site === "string" ? site : site.url;
        const iconMap = {
            "youtube.com": "📺",
            "facebook.com": "📘",
            "instagram.com": "📷",
            "twitter.com": "🐦",
            "tiktok.com": "🎵",
            "reddit.com": "🤖",
            "netflix.com": "🎬",
            "twitch.tv": "🎮",
        };

        return iconMap[domain] || "🌐";
    }

    getCategoryName(category) {
        const categoryNames = {
            social: "Mạng xã hội",
            entertainment: "Giải trí",
            news: "Tin tức",
            shopping: "Mua sắm",
            other: "Khác",
        };

        return categoryNames[category] || "Khác";
    }

    filterSites(query) {
        const currentList = this.whitelistMode ? this.whitelist : this.sites;

        if (!query.trim()) {
            this.filteredSites = [...currentList];
        } else {
            this.filteredSites = currentList.filter((site) => {
                const siteData =
                    typeof site === "string" ? { url: site, name: site } : site;
                return (
                    siteData.url.toLowerCase().includes(query.toLowerCase()) ||
                    (siteData.name &&
                        siteData.name
                            .toLowerCase()
                            .includes(query.toLowerCase()))
                );
            });
        }

        this.renderSites();
    }

    showAddSiteModal(editIndex = null) {
        const modal = document.getElementById("addSiteModal");
        const title = document.querySelector("#addSiteModal .modal-header h3");
        const confirmBtn = document.getElementById("confirmAdd");

        if (editIndex !== null) {
            title.textContent = "Chỉnh sửa website";
            confirmBtn.textContent = "Cập nhật";
            this.editingIndex = editIndex;
            this.fillEditForm(editIndex);
        } else {
            title.textContent = "Thêm website mới";
            confirmBtn.textContent = "Thêm";
            this.editingIndex = null;
            this.clearForm();
        }

        modal.style.display = "block";
        document.getElementById("siteUrl").focus();
    }

    hideAddSiteModal() {
        document.getElementById("addSiteModal").style.display = "none";
        this.clearForm();
        this.editingIndex = null;
    }

    fillEditForm(index) {
        const currentList = this.whitelistMode ? this.whitelist : this.sites;
        const site = currentList[index];
        const siteData =
            typeof site === "string"
                ? { url: site, name: "", category: "other" }
                : site;

        document.getElementById("siteUrl").value = siteData.url;
        document.getElementById("siteName").value = siteData.name || "";
        document.getElementById("siteCategory").value =
            siteData.category || "other";
    }

    clearForm() {
        document.getElementById("siteUrl").value = "";
        document.getElementById("siteName").value = "";
        document.getElementById("siteCategory").value = "other";
    }

    autoFillSiteName(url) {
        if (!url) return;

        const siteNames = {
            "youtube.com": "YouTube",
            "facebook.com": "Facebook",
            "instagram.com": "Instagram",
            "twitter.com": "Twitter",
            "tiktok.com": "TikTok",
            "reddit.com": "Reddit",
            "netflix.com": "Netflix",
            "twitch.tv": "Twitch",
        };

        const nameField = document.getElementById("siteName");
        if (!nameField.value && siteNames[url]) {
            nameField.value = siteNames[url];
        }
    }

    async confirmAddSite() {
        const url = document.getElementById("siteUrl").value.trim();
        const name = document.getElementById("siteName").value.trim();
        const category = document.getElementById("siteCategory").value;

        if (!url) {
            this.showNotification("Vui lòng nhập URL website", "error");
            return;
        }

        // Validate and clean URL
        const cleanUrl = this.cleanUrl(url);
        if (!this.isValidUrl(cleanUrl)) {
            this.showNotification("URL không hợp lệ", "error");
            return;
        }

        const siteData = {
            url: cleanUrl,
            name: name || cleanUrl,
            category: category,
            addedAt: Date.now(),
        };

        const currentList = this.whitelistMode ? this.whitelist : this.sites;

        // Check for duplicates
        const exists = currentList.some((site, index) => {
            if (this.editingIndex !== null && index === this.editingIndex)
                return false;
            const existingUrl = typeof site === "string" ? site : site.url;
            return existingUrl === cleanUrl;
        });

        if (exists) {
            this.showNotification("Website này đã có trong danh sách", "error");
            return;
        }

        if (this.editingIndex !== null) {
            // Update existing site
            currentList[this.editingIndex] = siteData;
        } else {
            // Add new site
            currentList.push(siteData);
        }

        await this.saveSites();
        this.loadSites();
        this.hideAddSiteModal();

        this.showNotification(
            this.editingIndex !== null
                ? "Đã cập nhật website"
                : "Đã thêm website mới",
            "success"
        );
    }

    cleanUrl(url) {
        // Remove protocol and www
        return url
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .replace(/\/$/, "");
    }

    isValidUrl(url) {
        // Basic URL validation
        const urlPattern =
            /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        return urlPattern.test(url) || url.includes(".");
    }

    editSite(index) {
        this.showAddSiteModal(index);
    }

    async deleteSite(index) {
        const currentList = this.whitelistMode ? this.whitelist : this.sites;
        const site = currentList[index];
        const siteName =
            typeof site === "string" ? site : site.name || site.url;

        if (confirm(`Bạn có chắc muốn xóa "${siteName}" khỏi danh sách?`)) {
            currentList.splice(index, 1);
            await this.saveSites();
            this.loadSites();
            this.showNotification("Đã xóa website", "success");
        }
    }

    async saveSites() {
        if (this.whitelistMode) {
            await chrome.storage.local.set({ whitelist: this.whitelist });
        } else {
            await chrome.storage.local.set({ blockedSites: this.sites });
        }
    }

    async applyPreset(presetName) {
        const presets = {
            social: [
                { url: "facebook.com", name: "Facebook", category: "social" },
                { url: "instagram.com", name: "Instagram", category: "social" },
                { url: "twitter.com", name: "Twitter", category: "social" },
                { url: "tiktok.com", name: "TikTok", category: "social" },
                { url: "snapchat.com", name: "Snapchat", category: "social" },
                { url: "linkedin.com", name: "LinkedIn", category: "social" },
            ],
            entertainment: [
                {
                    url: "youtube.com",
                    name: "YouTube",
                    category: "entertainment",
                },
                {
                    url: "netflix.com",
                    name: "Netflix",
                    category: "entertainment",
                },
                { url: "twitch.tv", name: "Twitch", category: "entertainment" },
                {
                    url: "spotify.com",
                    name: "Spotify",
                    category: "entertainment",
                },
                {
                    url: "primevideo.com",
                    name: "Prime Video",
                    category: "entertainment",
                },
            ],
            news: [
                { url: "reddit.com", name: "Reddit", category: "news" },
                { url: "vnexpress.net", name: "VnExpress", category: "news" },
                { url: "tuoitre.vn", name: "Tuổi Trẻ", category: "news" },
                { url: "thanhnien.vn", name: "Thanh Niên", category: "news" },
            ],
            shopping: [
                { url: "shopee.vn", name: "Shopee", category: "shopping" },
                { url: "lazada.vn", name: "Lazada", category: "shopping" },
                { url: "tiki.vn", name: "Tiki", category: "shopping" },
                { url: "amazon.com", name: "Amazon", category: "shopping" },
            ],
        };

        const preset = presets[presetName];
        if (!preset) return;

        if (
            confirm(
                `Thêm ${
                    preset.length
                } website từ bộ preset "${this.getPresetName(presetName)}"?`
            )
        ) {
            const currentList = this.whitelistMode
                ? this.whitelist
                : this.sites;

            let addedCount = 0;
            preset.forEach((site) => {
                const exists = currentList.some((existing) => {
                    const existingUrl =
                        typeof existing === "string" ? existing : existing.url;
                    return existingUrl === site.url;
                });

                if (!exists) {
                    currentList.push({ ...site, addedAt: Date.now() });
                    addedCount++;
                }
            });

            await this.saveSites();
            this.loadSites();

            this.showNotification(
                `Đã thêm ${addedCount} website mới`,
                "success"
            );
        }
    }

    getPresetName(preset) {
        const names = {
            social: "Mạng xã hội",
            entertainment: "Giải trí",
            news: "Tin tức",
            shopping: "Mua sắm",
        };
        return names[preset] || preset;
    }

    importSites() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,.txt";

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    let importedSites;
                    if (file.name.endsWith(".json")) {
                        importedSites = JSON.parse(e.target.result);
                    } else {
                        // Text file - one URL per line
                        importedSites = e.target.result
                            .split("\n")
                            .filter((line) => line.trim())
                            .map((url) => ({
                                url: this.cleanUrl(url.trim()),
                                category: "other",
                            }));
                    }

                    this.processImport(importedSites);
                } catch (error) {
                    this.showNotification(
                        "Lỗi đọc file: " + error.message,
                        "error"
                    );
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }

    async processImport(importedSites) {
        if (!Array.isArray(importedSites)) {
            this.showNotification("Định dạng file không hợp lệ", "error");
            return;
        }

        const currentList = this.whitelistMode ? this.whitelist : this.sites;
        let addedCount = 0;

        importedSites.forEach((site) => {
            const siteData =
                typeof site === "string"
                    ? { url: site, category: "other" }
                    : site;
            if (!siteData.url) return;

            const cleanUrl = this.cleanUrl(siteData.url);
            const exists = currentList.some((existing) => {
                const existingUrl =
                    typeof existing === "string" ? existing : existing.url;
                return existingUrl === cleanUrl;
            });

            if (!exists && this.isValidUrl(cleanUrl)) {
                currentList.push({
                    url: cleanUrl,
                    name: siteData.name || cleanUrl,
                    category: siteData.category || "other",
                    addedAt: Date.now(),
                });
                addedCount++;
            }
        });

        await this.saveSites();
        this.loadSites();

        this.showNotification(`Đã import ${addedCount} website`, "success");
    }

    exportSites() {
        const currentList = this.whitelistMode ? this.whitelist : this.sites;
        const exportData = {
            exportedAt: new Date().toISOString(),
            whitelistMode: this.whitelistMode,
            sites: currentList,
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `focusforge-sites-${
            new Date().toISOString().split("T")[0]
        }.json`;
        a.click();

        URL.revokeObjectURL(url);

        this.showNotification("Đã xuất danh sách website", "success");
    }

    async clearAllSites() {
        const currentList = this.whitelistMode ? this.whitelist : this.sites;

        if (
            confirm(
                `Bạn có chắc muốn xóa tất cả ${currentList.length} website?`
            )
        ) {
            if (this.whitelistMode) {
                this.whitelist = [];
                await chrome.storage.local.set({ whitelist: [] });
            } else {
                this.sites = [];
                await chrome.storage.local.set({ blockedSites: [] });
            }

            this.loadSites();
            this.showNotification("Đã xóa tất cả website", "success");
        }
    }

    showNotification(message, type = "info") {
        // Create notification element
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
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
                
                .site-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    margin-bottom: 8px;
                    transition: all 0.2s ease;
                }
                
                .site-item:hover {
                    border-color: #667eea;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
                }
                
                .site-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .site-icon {
                    font-size: 24px;
                }
                
                .site-details h4 {
                    margin: 0 0 4px 0;
                    font-size: 16px;
                    color: #333;
                }
                
                .site-details p {
                    margin: 0 0 4px 0;
                    color: #666;
                    font-size: 14px;
                }
                
                .site-category {
                    font-size: 12px;
                    color: #667eea;
                    background: #f8f9ff;
                    padding: 2px 8px;
                    border-radius: 12px;
                }
                
                .site-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .btn-icon {
                    padding: 8px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: #f8f9fa;
                    color: #666;
                }
                
                .btn-icon:hover {
                    background: #e9ecef;
                }
                
                .btn-icon.btn-danger {
                    color: #dc3545;
                }
                
                .btn-icon.btn-danger:hover {
                    background: #f8d7da;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #666;
                }
                
                .empty-icon {
                    font-size: 4rem;
                    margin-bottom: 20px;
                }
                
                .empty-state h3 {
                    margin-bottom: 12px;
                    color: #333;
                }
                
                .empty-state p {
                    margin-bottom: 24px;
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
let focusForgeManage;
document.addEventListener("DOMContentLoaded", () => {
    focusForgeManage = new FocusForgeManage();
});
