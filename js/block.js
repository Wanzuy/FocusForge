// Block page script for FocusForge
console.log("FocusForge Block Page loaded");

// DOM Elements
const blockedSite = document.getElementById("blockedSite");
const motivationText = document.getElementById("motivationText");
const todayBlocks = document.getElementById("todayBlocks");
const backBtn = document.getElementById("backBtn");
const openPopupBtn = document.getElementById("openPopupBtn");
const emergencyBtn = document.getElementById("emergencyBtn");
const emergencyModal = document.getElementById("emergencyModal");
const confirmEmergency = document.getElementById("confirmEmergency");
const cancelEmergency = document.getElementById("cancelEmergency");

// Motivation messages
const motivationMessages = [
    "💪 Bạn đang rèn luyện sự tập trung. Hãy tiếp tục!",
    "🎯 Mỗi lần từ chối là một bước tiến về phía mục tiêu!",
    "🔥 Sự tự chủ là sức mạnh. Bạn đang thể hiện điều đó!",
    "⭐ Thành công đến từ những quyết định nhỏ như thế này!",
    "🌟 Hôm nay bạn chọn tập trung thay vì xao nhãng!",
    "💎 Bạn đang đầu tư vào tương lai của chính mình!",
    "🚀 Focus Mode: Activated! Bạn đang trong trạng thái tối ưu!",
    "🎨 Creativity flows when distractions are blocked!",
    "⚡ Năng suất cao = Tập trung cao. Bạn đang làm đúng!",
    "🏆 Mỗi lần chặn là một chiến thắng nhỏ!",
];

// URL parameters
const urlParams = new URLSearchParams(window.location.search);
const site = urlParams.get("site") || "website này";
const originalUrl = urlParams.get("url") || "";

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
    setupPage();
    await loadStats();
    attachEventListeners();
});

// Setup page content
function setupPage() {
    // Set blocked site name
    blockedSite.textContent = site;

    // Set random motivation message
    const randomMessage =
        motivationMessages[
            Math.floor(Math.random() * motivationMessages.length)
        ];
    motivationText.textContent = randomMessage;

    // Update page title
    document.title = `${site} đã bị chặn - FocusForge`;
}

// Load statistics
async function loadStats() {
    try {
        const result = await chrome.storage.local.get(["todayStats"]);
        const stats = result.todayStats || { blocks: 0 };

        todayBlocks.textContent = stats.blocks;
    } catch (error) {
        console.error("Error loading stats:", error);
        todayBlocks.textContent = "0";
    }
}

// Attach event listeners
function attachEventListeners() {
    // Back button
    backBtn.addEventListener("click", () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.close();
        }
    });

    // Open popup button
    openPopupBtn.addEventListener("click", () => {
        // This will open the extension popup
        // Note: Can't directly open popup, but can navigate to extension pages
        chrome.tabs.create({
            url: "chrome://extensions/?id=" + chrome.runtime.id,
        });
    });

    // Emergency access button
    emergencyBtn.addEventListener("click", () => {
        emergencyModal.classList.add("active");
    });

    // Confirm emergency access
    confirmEmergency.addEventListener("click", async () => {
        try {
            // Temporarily disable focus mode for 5 minutes
            await chrome.storage.local.set({
                emergencyAccess: {
                    enabled: true,
                    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
                },
            });

            // Redirect to original URL
            if (originalUrl) {
                window.location.href = originalUrl;
            } else {
                window.history.back();
            }
        } catch (error) {
            console.error("Error enabling emergency access:", error);
            alert("Lỗi khi bật truy cập khẩn cấp. Vui lòng thử lại.");
        }
    });

    // Cancel emergency access
    cancelEmergency.addEventListener("click", () => {
        emergencyModal.classList.remove("active");
    });

    // Close modal when clicking outside
    emergencyModal.addEventListener("click", (e) => {
        if (e.target === emergencyModal) {
            emergencyModal.classList.remove("active");
        }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        // Escape to close modal
        if (e.key === "Escape" && emergencyModal.classList.contains("active")) {
            emergencyModal.classList.remove("active");
        }

        // Alt + Left Arrow to go back
        if (e.altKey && e.key === "ArrowLeft") {
            backBtn.click();
        }
    });
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.todayStats) {
        const newStats = changes.todayStats.newValue;
        if (newStats && newStats.blocks) {
            todayBlocks.textContent = newStats.blocks;
        }
    }
});

console.log("FocusForge Block Page ready");
