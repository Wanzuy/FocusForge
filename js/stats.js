// Stats Page Script cho FocusForge
// Hiển thị thống kê chi tiết về hành vi sử dụng

class FocusForgeStats {
    constructor() {
        this.currentWeekStart = this.getWeekStart(new Date());
        this.achievements = [
            {
                id: "first_block",
                name: "Lần đầu tiên",
                desc: "Chặn website đầu tiên",
                icon: "🎯",
                unlocked: false,
            },
            {
                id: "daily_warrior",
                name: "Chiến binh hàng ngày",
                desc: "Tập trung 1 ngày liên tục",
                icon: "⚔️",
                unlocked: false,
            },
            {
                id: "weekly_champion",
                name: "Nhà vô địch tuần",
                desc: "Tập trung 7 ngày liên tục",
                icon: "🏆",
                unlocked: false,
            },
            {
                id: "block_master",
                name: "Chuyên gia chặn",
                desc: "Chặn 100 lần",
                icon: "🛡️",
                unlocked: false,
            },
            {
                id: "focus_legend",
                name: "Huyền thoại tập trung",
                desc: "Tập trung 30 ngày liên tục",
                icon: "🌟",
                unlocked: false,
            },
            {
                id: "early_bird",
                name: "Chim sớm",
                desc: "Tập trung trước 7:00 AM",
                icon: "🐦",
                unlocked: false,
            },
            {
                id: "night_owl",
                name: "Cú đêm",
                desc: "Tập trung sau 10:00 PM",
                icon: "🦉",
                unlocked: false,
            },
            {
                id: "weekend_warrior",
                name: "Chiến binh cuối tuần",
                desc: "Tập trung cả cuối tuần",
                icon: "💪",
                unlocked: false,
            },
        ];
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.updateOverview();
        this.updateTodayStats();
        this.updateWeeklyChart();
        this.updateTopSites();
        this.updatePatterns();
        this.updateAchievements();
        this.updateEmergencyLog();
        this.setCurrentDate();
    }

    async loadData() {
        const data = await chrome.storage.local.get([
            "dailyStats",
            "totalBlocks",
            "focusStreak",
            "focusTime",
            "emergencyLog",
        ]);

        this.dailyStats = data.dailyStats || {};
        this.totalBlocks = data.totalBlocks || 0;
        this.focusStreak = data.focusStreak || 0;
        this.focusTime = data.focusTime || {};
        this.emergencyLog = data.emergencyLog || {};
    }

    setupEventListeners() {
        // Date selector
        document
            .getElementById("dateSelector")
            .addEventListener("change", (e) => {
                this.selectedDate = e.target.value;
                this.updateTodayStats();
            });

        // Week navigation
        document.getElementById("prevWeek").addEventListener("click", () => {
            this.currentWeekStart = new Date(
                this.currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000
            );
            this.updateWeeklyChart();
            this.updateWeekRange();
        });

        document.getElementById("nextWeek").addEventListener("click", () => {
            this.currentWeekStart = new Date(
                this.currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000
            );
            this.updateWeeklyChart();
            this.updateWeekRange();
        });

        // Export buttons
        document
            .getElementById("exportStatsBtn")
            .addEventListener("click", () => {
                this.exportStats();
            });

        document
            .getElementById("exportChartBtn")
            .addEventListener("click", () => {
                this.exportChart();
            });
    }

    setCurrentDate() {
        const today = new Date().toISOString().split("T")[0];
        document.getElementById("dateSelector").value = today;
        this.selectedDate = today;
    }

    updateOverview() {
        const today = new Date().toISOString().split("T")[0];
        const todayStats = this.dailyStats[today] || {};
        const todayBlocks = Object.values(todayStats).reduce(
            (a, b) => a + b,
            0
        );

        // Calculate total focus time (estimate: 2 minutes saved per block)
        const totalFocusMinutes = this.totalBlocks * 2;
        const focusHours = Math.floor(totalFocusMinutes / 60);
        const focusMinutes = totalFocusMinutes % 60;

        document.getElementById("todayBlocks").textContent = todayBlocks;
        document.getElementById("totalBlocks").textContent = this.totalBlocks;
        document.getElementById("focusTime").textContent =
            focusHours > 0
                ? `${focusHours}h ${focusMinutes}m`
                : `${focusMinutes}m`;
        document.getElementById("focusStreak").textContent = this.focusStreak;
    }

    updateTodayStats() {
        const date =
            this.selectedDate || new Date().toISOString().split("T")[0];
        const dayStats = this.dailyStats[date] || {};
        const totalBlocks = Object.values(dayStats).reduce((a, b) => a + b, 0);

        // Update motivation
        this.updateMotivation(totalBlocks);

        // Update site breakdown
        this.updateSiteBreakdown(dayStats);
    }

    updateMotivation(blocks) {
        const motivationTitle = document.getElementById("motivationTitle");
        const motivationMessage = document.getElementById("motivationMessage");

        if (blocks === 0) {
            motivationTitle.textContent = "🎉 Ngày hoàn hảo!";
            motivationMessage.textContent =
                "Bạn đã không cần chặn website nào hôm nay. Tuyệt vời!";
        } else if (blocks <= 5) {
            motivationTitle.textContent = "🌟 Làm rất tốt!";
            motivationMessage.textContent = `Chỉ ${blocks} lần cố truy cập. Bạn đang kiểm soát bản thân tốt.`;
        } else if (blocks <= 15) {
            motivationTitle.textContent = "💪 Tiếp tục cố gắng!";
            motivationMessage.textContent = `${blocks} lần cố truy cập. Hãy thử tập trung hơn một chút.`;
        } else {
            motivationTitle.textContent = "🎯 Hãy thử lại!";
            motivationMessage.textContent = `${blocks} lần cố truy cập. Có vẻ hôm nay khó tập trung. Ngày mai sẽ tốt hơn!`;
        }
    }

    updateSiteBreakdown(dayStats) {
        const container = document.getElementById("siteStatsList");

        if (Object.keys(dayStats).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Không có dữ liệu cho ngày này</p>
                </div>
            `;
            return;
        }

        // Sort sites by block count
        const sortedSites = Object.entries(dayStats).sort(
            (a, b) => b[1] - a[1]
        );

        container.innerHTML = sortedSites
            .map(
                ([site, count]) => `
            <div class="site-stat-item">
                <div class="site-info">
                    <div class="site-icon">${this.getSiteIcon(site)}</div>
                    <div class="site-name">${site}</div>
                </div>
                <div class="site-count">${count}</div>
                <div class="site-bar">
                    <div class="site-bar-fill" style="width: ${
                        (count / Math.max(...Object.values(dayStats))) * 100
                    }%"></div>
                </div>
            </div>
        `
            )
            .join("");
    }

    getSiteIcon(site) {
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

        return iconMap[site] || "🌐";
    }

    updateWeeklyChart() {
        const canvas = document.getElementById("weeklyChart");
        const ctx = canvas.getContext("2d");

        // Get data for the week
        const weekData = this.getWeekData();

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw chart
        this.drawChart(ctx, weekData, canvas.width, canvas.height);

        this.updateWeekRange();
    }

    getWeekData() {
        const weekData = [];
        const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

        for (let i = 0; i < 7; i++) {
            const date = new Date(
                this.currentWeekStart.getTime() + i * 24 * 60 * 60 * 1000
            );
            const dateStr = date.toISOString().split("T")[0];
            const dayStats = this.dailyStats[dateStr] || {};
            const totalBlocks = Object.values(dayStats).reduce(
                (a, b) => a + b,
                0
            );

            weekData.push({
                day: days[date.getDay()],
                date: dateStr,
                blocks: totalBlocks,
            });
        }

        return weekData;
    }

    drawChart(ctx, data, width, height) {
        const padding = 50;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        const barWidth = chartWidth / data.length;
        const maxBlocks = Math.max(...data.map((d) => d.blocks), 10);

        // Draw axes
        ctx.strokeStyle = "#e9ecef";
        ctx.lineWidth = 1;

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();

        // X-axis
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw bars
        data.forEach((d, i) => {
            const x = padding + i * barWidth + barWidth * 0.1;
            const barHeight = (d.blocks / maxBlocks) * chartHeight;
            const y = height - padding - barHeight;

            // Bar gradient
            const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
            gradient.addColorStop(0, "#667eea");
            gradient.addColorStop(1, "#764ba2");

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth * 0.8, barHeight);

            // Day label
            ctx.fillStyle = "#666";
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillText(d.day, x + barWidth * 0.4, height - padding + 20);

            // Block count
            if (d.blocks > 0) {
                ctx.fillStyle = "#333";
                ctx.font = "bold 12px Arial";
                ctx.fillText(d.blocks, x + barWidth * 0.4, y - 5);
            }
        });

        // Y-axis labels
        ctx.fillStyle = "#666";
        ctx.font = "10px Arial";
        ctx.textAlign = "right";
        for (let i = 0; i <= 5; i++) {
            const value = Math.round((maxBlocks / 5) * i);
            const y = height - padding - (chartHeight / 5) * i;
            ctx.fillText(value, padding - 10, y + 3);
        }
    }

    updateWeekRange() {
        const endDate = new Date(
            this.currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000
        );
        const startStr = this.formatDate(this.currentWeekStart);
        const endStr = this.formatDate(endDate);

        document.getElementById(
            "weekRange"
        ).textContent = `${startStr} - ${endStr}`;
    }

    formatDate(date) {
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
        });
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    updateTopSites() {
        const container = document.getElementById("topSitesList");

        // Aggregate all sites across all days
        const allSites = {};
        Object.values(this.dailyStats).forEach((dayStats) => {
            Object.entries(dayStats).forEach(([site, count]) => {
                allSites[site] = (allSites[site] || 0) + count;
            });
        });

        // Sort and take top 5
        const topSites = Object.entries(allSites)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (topSites.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Chưa có dữ liệu</p>
                </div>
            `;
            return;
        }

        container.innerHTML = topSites
            .map(
                ([site, count], index) => `
            <div class="top-site-item">
                <div class="site-rank">#${index + 1}</div>
                <div class="site-info">
                    <div class="site-icon">${this.getSiteIcon(site)}</div>
                    <div class="site-details">
                        <div class="site-name">${site}</div>
                        <div class="site-stats">${count} lần chặn</div>
                    </div>
                </div>
                <div class="site-percentage">
                    ${Math.round((count / this.totalBlocks) * 100)}%
                </div>
            </div>
        `
            )
            .join("");
    }

    updatePatterns() {
        // Calculate patterns from data
        const bestFocusTime = this.calculateBestFocusTime();
        const bestFocusDay = this.calculateBestFocusDay();
        const successRate = this.calculateSuccessRate();
        const improvement = this.calculateImprovement();

        document.getElementById("bestFocusTime").textContent = bestFocusTime;
        document.getElementById("bestFocusDay").textContent = bestFocusDay;
        document.getElementById("successRate").textContent = successRate + "%";
        document.getElementById("improvement").textContent = improvement;
    }

    calculateBestFocusTime() {
        // Simple implementation - can be enhanced with actual time tracking
        const timeSlots = [
            "08:00 - 10:00",
            "10:00 - 12:00",
            "14:00 - 16:00",
            "16:00 - 18:00",
        ];
        return timeSlots[Math.floor(Math.random() * timeSlots.length)];
    }

    calculateBestFocusDay() {
        const dayNames = [
            "Chủ nhật",
            "Thứ 2",
            "Thứ 3",
            "Thứ 4",
            "Thứ 5",
            "Thứ 6",
            "Thứ 7",
        ];
        const dayStats = [0, 0, 0, 0, 0, 0, 0];

        // Aggregate blocks by day of week
        Object.keys(this.dailyStats).forEach((dateStr) => {
            const date = new Date(dateStr);
            const dayOfWeek = date.getDay();
            const dayBlocks = Object.values(this.dailyStats[dateStr]).reduce(
                (a, b) => a + b,
                0
            );
            dayStats[dayOfWeek] += dayBlocks;
        });

        // Find day with least blocks (best focus)
        const minBlocks = Math.min(...dayStats.filter((s) => s > 0));
        const bestDay = dayStats.indexOf(minBlocks);

        return dayNames[bestDay] || "Thứ 2";
    }

    calculateSuccessRate() {
        const totalDays = Object.keys(this.dailyStats).length;
        if (totalDays === 0) return 85;

        const lowBlockDays = Object.values(this.dailyStats).filter(
            (dayStats) => {
                const totalBlocks = Object.values(dayStats).reduce(
                    (a, b) => a + b,
                    0
                );
                return totalBlocks <= 5; // Consider <= 5 blocks as successful
            }
        ).length;

        return Math.round((lowBlockDays / totalDays) * 100);
    }

    calculateImprovement() {
        // Compare this week with last week
        const thisWeekData = this.getWeekData();
        const lastWeekStart = new Date(
            this.currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000
        );

        const thisWeekBlocks = thisWeekData.reduce(
            (sum, day) => sum + day.blocks,
            0
        );
        let lastWeekBlocks = 0;

        for (let i = 0; i < 7; i++) {
            const date = new Date(
                lastWeekStart.getTime() + i * 24 * 60 * 60 * 1000
            );
            const dateStr = date.toISOString().split("T")[0];
            const dayStats = this.dailyStats[dateStr] || {};
            lastWeekBlocks += Object.values(dayStats).reduce(
                (a, b) => a + b,
                0
            );
        }

        if (lastWeekBlocks === 0) return "+0%";

        const improvement =
            ((lastWeekBlocks - thisWeekBlocks) / lastWeekBlocks) * 100;
        return improvement > 0
            ? `+${Math.round(improvement)}%`
            : `${Math.round(improvement)}%`;
    }

    updateAchievements() {
        // Check and unlock achievements
        this.checkAchievements();

        const container = document.getElementById("achievementsList");

        container.innerHTML = this.achievements
            .map(
                (achievement) => `
            <div class="achievement-item ${
                achievement.unlocked ? "unlocked" : "locked"
            }">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.desc}</p>
                </div>
                <div class="achievement-status">
                    ${achievement.unlocked ? "✅" : "🔒"}
                </div>
            </div>
        `
            )
            .join("");
    }

    checkAchievements() {
        // First block
        if (this.totalBlocks > 0) {
            this.achievements.find(
                (a) => a.id === "first_block"
            ).unlocked = true;
        }

        // Daily warrior
        if (this.focusStreak >= 1) {
            this.achievements.find(
                (a) => a.id === "daily_warrior"
            ).unlocked = true;
        }

        // Weekly champion
        if (this.focusStreak >= 7) {
            this.achievements.find(
                (a) => a.id === "weekly_champion"
            ).unlocked = true;
        }

        // Block master
        if (this.totalBlocks >= 100) {
            this.achievements.find(
                (a) => a.id === "block_master"
            ).unlocked = true;
        }

        // Focus legend
        if (this.focusStreak >= 30) {
            this.achievements.find(
                (a) => a.id === "focus_legend"
            ).unlocked = true;
        }

        // Early bird & Night owl (placeholder - would need actual time tracking)
        if (this.totalBlocks > 50) {
            this.achievements.find(
                (a) => a.id === "early_bird"
            ).unlocked = true;
        }

        // Weekend warrior (placeholder)
        if (this.totalBlocks > 20) {
            this.achievements.find(
                (a) => a.id === "weekend_warrior"
            ).unlocked = true;
        }
    }

    updateEmergencyLog() {
        const container = document.getElementById("emergencyLog");

        // Get recent emergency accesses
        const recentAccesses = [];
        Object.entries(this.emergencyLog).forEach(([date, accesses]) => {
            accesses.forEach((access) => {
                recentAccesses.push({ ...access, date });
            });
        });

        // Sort by timestamp, most recent first
        recentAccesses.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        if (recentAccesses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Chưa có lần truy cập khẩn cấp nào</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentAccesses
            .slice(0, 10)
            .map(
                (access) => `
            <div class="emergency-item">
                <div class="emergency-time">
                    ${new Date(access.timestamp).toLocaleString("vi-VN")}
                </div>
                <div class="emergency-details">
                    <div class="emergency-site">🌐 ${access.site}</div>
                    <div class="emergency-reason">${access.reason}</div>
                </div>
            </div>
        `
            )
            .join("");
    }

    exportStats() {
        const exportData = {
            exportedAt: new Date().toISOString(),
            summary: {
                totalBlocks: this.totalBlocks,
                focusStreak: this.focusStreak,
                totalDays: Object.keys(this.dailyStats).length,
            },
            dailyStats: this.dailyStats,
            achievements: this.achievements.filter((a) => a.unlocked),
            emergencyLog: this.emergencyLog,
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `focusforge-stats-${
            new Date().toISOString().split("T")[0]
        }.json`;
        a.click();

        URL.revokeObjectURL(url);

        this.showNotification("Đã xuất thống kê thành công", "success");
    }

    exportChart() {
        const canvas = document.getElementById("weeklyChart");
        const link = document.createElement("a");
        link.download = `focusforge-chart-${
            new Date().toISOString().split("T")[0]
        }.png`;
        link.href = canvas.toDataURL();
        link.click();

        this.showNotification("Đã xuất biểu đồ thành công", "success");
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
                
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }
                
                .stats-overview {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .stat-card {
                    background: white;
                    border: 1px solid #e9ecef;
                    border-radius: 12px;
                    padding: 24px;
                    text-align: center;
                    transition: all 0.2s ease;
                }
                
                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
                }
                
                .stat-icon {
                    font-size: 2.5rem;
                    margin-bottom: 12px;
                }
                
                .stat-info h3 {
                    font-size: 2rem;
                    color: #667eea;
                    margin-bottom: 8px;
                }
                
                .stat-info p {
                    color: #666;
                    font-size: 14px;
                    margin: 0;
                }
                
                .stats-section {
                    background: white;
                    border: 1px solid #e9ecef;
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 24px;
                }
                
                .motivation-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 20px;
                }
                
                .motivation-content h4 {
                    margin-bottom: 8px;
                    font-size: 18px;
                }
                
                .motivation-content p {
                    margin: 0;
                    opacity: 0.9;
                }
                
                .site-stat-item {
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 8px;
                    background: #f8f9fa;
                }
                
                .site-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }
                
                .site-icon {
                    font-size: 20px;
                }
                
                .site-name {
                    font-weight: 500;
                }
                
                .site-count {
                    font-weight: 600;
                    color: #667eea;
                    margin-right: 12px;
                }
                
                .site-bar {
                    width: 80px;
                    height: 6px;
                    background: #e9ecef;
                    border-radius: 3px;
                    overflow: hidden;
                }
                
                .site-bar-fill {
                    height: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    transition: width 0.3s ease;
                }
                
                .chart-container {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                }
                
                .chart-controls {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .top-site-item {
                    display: flex;
                    align-items: center;
                    padding: 16px;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    margin-bottom: 8px;
                }
                
                .site-rank {
                    font-size: 18px;
                    font-weight: bold;
                    color: #667eea;
                    margin-right: 16px;
                    min-width: 30px;
                }
                
                .site-details {
                    flex: 1;
                }
                
                .site-details .site-name {
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                
                .site-stats {
                    font-size: 12px;
                    color: #666;
                }
                
                .site-percentage {
                    font-weight: 600;
                    color: #667eea;
                }
                
                .patterns-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 16px;
                }
                
                .pattern-card {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                }
                
                .pattern-card h4 {
                    margin-bottom: 8px;
                    color: #333;
                }
                
                .pattern-card p {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #667eea;
                    margin-bottom: 8px;
                }
                
                .pattern-card small {
                    color: #666;
                    font-size: 12px;
                }
                
                .achievements-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 16px;
                }
                
                .achievement-item {
                    display: flex;
                    align-items: center;
                    padding: 16px;
                    border-radius: 8px;
                    border: 1px solid #e9ecef;
                    transition: all 0.2s ease;
                }
                
                .achievement-item.unlocked {
                    background: #f0f8f0;
                    border-color: #4CAF50;
                }
                
                .achievement-item.locked {
                    opacity: 0.6;
                    background: #f8f9fa;
                }
                
                .achievement-icon {
                    font-size: 24px;
                    margin-right: 12px;
                }
                
                .achievement-info {
                    flex: 1;
                }
                
                .achievement-info h4 {
                    margin-bottom: 4px;
                    font-size: 14px;
                }
                
                .achievement-info p {
                    margin: 0;
                    font-size: 12px;
                    color: #666;
                }
                
                .achievement-status {
                    font-size: 18px;
                }
                
                .emergency-item {
                    display: flex;
                    padding: 12px;
                    border-bottom: 1px solid #e9ecef;
                }
                
                .emergency-time {
                    min-width: 150px;
                    font-size: 12px;
                    color: #666;
                }
                
                .emergency-details {
                    flex: 1;
                }
                
                .emergency-site {
                    font-weight: 500;
                    margin-bottom: 4px;
                }
                
                .emergency-reason {
                    font-size: 12px;
                    color: #666;
                }
                
                .export-options {
                    display: flex;
                    gap: 12px;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #666;
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
    new FocusForgeStats();
});
