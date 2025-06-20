// Schedule Page Script cho FocusForge
// Quản lý lịch trình chặn website

class FocusForgeSchedule {
    constructor() {
        this.schedules = [];
        this.currentSchedule = null;
        this.templates = {
            workday: {
                name: "Giờ làm việc chuẩn",
                schedules: [
                    {
                        name: "Buổi sáng",
                        startTime: "08:00",
                        endTime: "12:00",
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
                        name: "Buổi chiều",
                        startTime: "13:00",
                        endTime: "17:00",
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
            },
            student: {
                name: "Sinh viên học tập",
                schedules: [
                    {
                        name: "Sáng sớm",
                        startTime: "07:00",
                        endTime: "11:00",
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
                        name: "Chiều",
                        startTime: "13:00",
                        endTime: "17:00",
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
                        name: "Tối",
                        startTime: "19:00",
                        endTime: "22:00",
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
            },
            freelancer: {
                name: "Freelancer linh hoạt",
                schedules: [
                    {
                        name: "Sáng",
                        startTime: "09:00",
                        endTime: "12:00",
                        days: [
                            "monday",
                            "tuesday",
                            "wednesday",
                            "thursday",
                            "friday",
                            "saturday",
                            "sunday",
                        ],
                        enabled: true,
                    },
                    {
                        name: "Chiều",
                        startTime: "14:00",
                        endTime: "18:00",
                        days: [
                            "monday",
                            "tuesday",
                            "wednesday",
                            "thursday",
                            "friday",
                            "saturday",
                            "sunday",
                        ],
                        enabled: true,
                    },
                ],
            },
            morning: {
                name: "Chỉ buổi sáng",
                schedules: [
                    {
                        name: "Tập trung sáng",
                        startTime: "06:00",
                        endTime: "12:00",
                        days: [
                            "monday",
                            "tuesday",
                            "wednesday",
                            "thursday",
                            "friday",
                            "saturday",
                            "sunday",
                        ],
                        enabled: true,
                    },
                ],
            },
        };
        this.init();
    }

    async init() {
        await this.loadSchedules();
        this.setupEventListeners();
        this.updateCurrentStatus();
        this.renderSchedules();
        this.renderWeeklyView();
    }

    async loadSchedules() {
        const data = await chrome.storage.local.get(["schedules", "focusMode"]);
        this.schedules = data.schedules || [];
        this.focusMode = data.focusMode || false;
    }

    setupEventListeners() {
        // Add schedule button
        document
            .getElementById("addScheduleBtn")
            .addEventListener("click", () => {
                this.showScheduleModal();
            });

        // Template button
        document.getElementById("templateBtn").addEventListener("click", () => {
            this.showTemplateModal();
        });

        // Schedule modal events
        this.setupScheduleModalEvents();

        // Template modal events
        this.setupTemplateModalEvents();
    }

    setupScheduleModalEvents() {
        const modal = document.getElementById("scheduleModal");
        const closeBtn = document.getElementById("closeScheduleModal");
        const cancelBtn = document.getElementById("cancelSchedule");
        const saveBtn = document.getElementById("saveSchedule");
        const deleteBtn = document.getElementById("deleteSchedule");

        closeBtn.addEventListener("click", () => this.hideScheduleModal());
        cancelBtn.addEventListener("click", () => this.hideScheduleModal());
        saveBtn.addEventListener("click", () => this.saveSchedule());
        deleteBtn.addEventListener("click", () => this.deleteSchedule());

        // Close modal when clicking outside
        window.addEventListener("click", (e) => {
            if (e.target === modal) {
                this.hideScheduleModal();
            }
        });
    }

    setupTemplateModalEvents() {
        const modal = document.getElementById("templateModal");
        const closeBtn = document.getElementById("closeTemplateModal");
        const cancelBtn = document.getElementById("cancelTemplate");
        const applyBtn = document.getElementById("applyTemplate");

        closeBtn.addEventListener("click", () => this.hideTemplateModal());
        cancelBtn.addEventListener("click", () => this.hideTemplateModal());
        applyBtn.addEventListener("click", () => this.applySelectedTemplate());

        // Template selection
        document.querySelectorAll(".template-card").forEach((card) => {
            card.addEventListener("click", () => {
                document
                    .querySelectorAll(".template-card")
                    .forEach((c) => c.classList.remove("selected"));
                card.classList.add("selected");
                this.selectedTemplate = card.dataset.template;
            });
        });

        // Close modal when clicking outside
        window.addEventListener("click", (e) => {
            if (e.target === modal) {
                this.hideTemplateModal();
            }
        });
    }

    updateCurrentStatus() {
        const now = new Date();
        const currentDay = now.toLocaleDateString("en-US", {
            weekday: "lowercase",
        });
        const currentTime = now.toTimeString().slice(0, 5);

        const activeSchedule = this.schedules.find((schedule) => {
            if (!schedule.enabled) return false;
            if (!schedule.days.includes(currentDay)) return false;
            return (
                currentTime >= schedule.startTime &&
                currentTime <= schedule.endTime
            );
        });

        const statusIcon = document.getElementById("currentStatusIcon");
        const statusTitle = document.getElementById("currentStatusTitle");
        const statusDesc = document.getElementById("currentStatusDesc");
        const nextScheduleTime = document.getElementById("nextScheduleTime");

        if (activeSchedule && this.focusMode) {
            statusIcon.textContent = "🎯";
            statusTitle.textContent = "Đang hoạt động";
            statusDesc.textContent = `Focus Mode đang chạy theo lịch "${activeSchedule.name}"`;
            nextScheduleTime.textContent = `Kết thúc lúc ${activeSchedule.endTime}`;
        } else if (this.focusMode) {
            statusIcon.textContent = "⏸️";
            statusTitle.textContent = "Ngoài giờ";
            statusDesc.textContent =
                "Focus Mode bật nhưng ngoài thời gian lên lịch";

            const nextSchedule = this.getNextSchedule();
            if (nextSchedule) {
                nextScheduleTime.textContent = `Lịch tiếp theo: ${nextSchedule.name} lúc ${nextSchedule.startTime}`;
            } else {
                nextScheduleTime.textContent = "Không có lịch tiếp theo";
            }
        } else {
            statusIcon.textContent = "😴";
            statusTitle.textContent = "Đã tắt";
            statusDesc.textContent = "Focus Mode hiện không hoạt động";
            nextScheduleTime.textContent =
                "Bật Focus Mode để sử dụng lịch trình";
        }
    }

    getNextSchedule() {
        const now = new Date();
        const currentDay = now.toLocaleDateString("en-US", {
            weekday: "lowercase",
        });
        const currentTime = now.toTimeString().slice(0, 5);

        // Find schedules for today that haven't started yet
        const todaySchedules = this.schedules
            .filter((schedule) => {
                return (
                    schedule.enabled &&
                    schedule.days.includes(currentDay) &&
                    currentTime < schedule.startTime
                );
            })
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

        if (todaySchedules.length > 0) {
            return todaySchedules[0];
        }

        // Find next day's first schedule
        const dayOrder = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
        ];
        const currentDayIndex = dayOrder.indexOf(currentDay);

        for (let i = 1; i <= 7; i++) {
            const nextDayIndex = (currentDayIndex + i) % 7;
            const nextDay = dayOrder[nextDayIndex];

            const nextDaySchedules = this.schedules
                .filter((schedule) => {
                    return schedule.enabled && schedule.days.includes(nextDay);
                })
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

            if (nextDaySchedules.length > 0) {
                return {
                    ...nextDaySchedules[0],
                    day: this.getDayName(nextDay),
                };
            }
        }

        return null;
    }

    getDayName(day) {
        const dayNames = {
            monday: "Thứ 2",
            tuesday: "Thứ 3",
            wednesday: "Thứ 4",
            thursday: "Thứ 5",
            friday: "Thứ 6",
            saturday: "Thứ 7",
            sunday: "Chủ nhật",
        };
        return dayNames[day] || day;
    }

    renderSchedules() {
        const container = document.getElementById("schedulesList");

        if (this.schedules.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <h3>Chưa có lịch trình nào</h3>
                    <p>Tạo lịch trình đầu tiên để bắt đầu tập trung</p>
                    <button class="btn btn-primary" onclick="document.getElementById('addScheduleBtn').click()">
                        Thêm lịch trình
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.schedules
            .map(
                (schedule, index) => `
            <div class="schedule-item ${
                schedule.enabled ? "enabled" : "disabled"
            }" data-index="${index}">
                <div class="schedule-info">
                    <div class="schedule-header">
                        <h4>${schedule.name}</h4>
                        <div class="schedule-status">
                            <label class="toggle-switch">
                                <input type="checkbox" ${
                                    schedule.enabled ? "checked" : ""
                                } 
                                       onchange="focusForgeSchedule.toggleSchedule(${index})">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="schedule-details">
                        <div class="time-range">
                            <span class="time">${schedule.startTime}</span>
                            <span class="separator">→</span>
                            <span class="time">${schedule.endTime}</span>
                        </div>
                        <div class="days-list">
                            ${schedule.days
                                .map(
                                    (day) =>
                                        `<span class="day-badge">${this.getDayShort(
                                            day
                                        )}</span>`
                                )
                                .join("")}
                        </div>
                    </div>
                </div>
                <div class="schedule-actions">
                    <button class="btn-icon" onclick="focusForgeSchedule.editSchedule(${index})" title="Chỉnh sửa">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                    </button>
                    <button class="btn-icon btn-danger" onclick="focusForgeSchedule.deleteScheduleConfirm(${index})" title="Xóa">
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

    getDayShort(day) {
        const dayShorts = {
            monday: "T2",
            tuesday: "T3",
            wednesday: "T4",
            thursday: "T5",
            friday: "T6",
            saturday: "T7",
            sunday: "CN",
        };
        return dayShorts[day] || day;
    }

    renderWeeklyView() {
        const days = [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
        ];

        days.forEach((day) => {
            const slotsContainer = document.getElementById(`${day}-slots`);
            const daySchedules = this.schedules.filter(
                (schedule) => schedule.enabled && schedule.days.includes(day)
            );

            slotsContainer.innerHTML = "";

            daySchedules.forEach((schedule) => {
                const slot = document.createElement("div");
                slot.className = "schedule-slot";
                slot.style.cssText = this.calculateSlotPosition(
                    schedule.startTime,
                    schedule.endTime
                );
                slot.innerHTML = `
                    <div class="slot-content">
                        <span class="slot-name">${schedule.name}</span>
                        <span class="slot-time">${schedule.startTime}-${schedule.endTime}</span>
                    </div>
                `;
                slotsContainer.appendChild(slot);
            });
        });
    }

    calculateSlotPosition(startTime, endTime) {
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = this.timeToMinutes(endTime);
        const dayStartMinutes = 6 * 60; // 6:00 AM
        const dayEndMinutes = 22 * 60; // 10:00 PM
        const dayDuration = dayEndMinutes - dayStartMinutes;

        const top = ((startMinutes - dayStartMinutes) / dayDuration) * 100;
        const height = ((endMinutes - startMinutes) / dayDuration) * 100;

        return `
            position: absolute;
            top: ${Math.max(0, top)}%;
            height: ${height}%;
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 4px;
            padding: 4px;
            font-size: 11px;
            opacity: 0.9;
        `;
    }

    timeToMinutes(time) {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    }

    showScheduleModal(editIndex = null) {
        const modal = document.getElementById("scheduleModal");
        const modalTitle = document.getElementById("modalTitle");
        const deleteBtn = document.getElementById("deleteSchedule");

        if (editIndex !== null) {
            modalTitle.textContent = "Chỉnh sửa lịch trình";
            deleteBtn.style.display = "inline-flex";
            this.currentSchedule = editIndex;
            this.fillScheduleForm(editIndex);
        } else {
            modalTitle.textContent = "Thêm lịch trình mới";
            deleteBtn.style.display = "none";
            this.currentSchedule = null;
            this.clearScheduleForm();
        }

        modal.style.display = "block";
        document.getElementById("scheduleName").focus();
    }

    hideScheduleModal() {
        document.getElementById("scheduleModal").style.display = "none";
        this.currentSchedule = null;
        this.clearScheduleForm();
    }

    fillScheduleForm(index) {
        const schedule = this.schedules[index];

        document.getElementById("scheduleName").value = schedule.name;
        document.getElementById("startTime").value = schedule.startTime;
        document.getElementById("endTime").value = schedule.endTime;
        document.getElementById("enableSchedule").checked = schedule.enabled;

        // Clear all day checkboxes first
        document
            .querySelectorAll(".day-checkbox input")
            .forEach((cb) => (cb.checked = false));
        // Check the selected days
        schedule.days.forEach((day) => {
            const checkbox = document.querySelector(`input[value="${day}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }

    clearScheduleForm() {
        document.getElementById("scheduleName").value = "";
        document.getElementById("startTime").value = "08:00";
        document.getElementById("endTime").value = "17:00";
        document.getElementById("enableSchedule").checked = true;

        // Check weekdays by default
        document.querySelectorAll(".day-checkbox input").forEach((cb) => {
            cb.checked = [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
            ].includes(cb.value);
        });
    }

    async saveSchedule() {
        const name = document.getElementById("scheduleName").value.trim();
        const startTime = document.getElementById("startTime").value;
        const endTime = document.getElementById("endTime").value;
        const enabled = document.getElementById("enableSchedule").checked;

        if (!name) {
            this.showNotification("Vui lòng nhập tên lịch trình", "error");
            return;
        }

        if (startTime >= endTime) {
            this.showNotification(
                "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc",
                "error"
            );
            return;
        }

        const selectedDays = Array.from(
            document.querySelectorAll(".day-checkbox input:checked")
        ).map((cb) => cb.value);

        if (selectedDays.length === 0) {
            this.showNotification("Vui lòng chọn ít nhất một ngày", "error");
            return;
        }

        const scheduleData = {
            id:
                this.currentSchedule !== null
                    ? this.schedules[this.currentSchedule].id
                    : Date.now().toString(),
            name,
            startTime,
            endTime,
            days: selectedDays,
            enabled,
            createdAt:
                this.currentSchedule !== null
                    ? this.schedules[this.currentSchedule].createdAt
                    : Date.now(),
            updatedAt: Date.now(),
        };

        if (this.currentSchedule !== null) {
            // Update existing schedule
            this.schedules[this.currentSchedule] = scheduleData;
        } else {
            // Add new schedule
            this.schedules.push(scheduleData);
        }

        await this.saveSchedulesToStorage();
        this.renderSchedules();
        this.renderWeeklyView();
        this.updateCurrentStatus();
        this.hideScheduleModal();

        this.showNotification(
            this.currentSchedule !== null
                ? "Đã cập nhật lịch trình"
                : "Đã thêm lịch trình mới",
            "success"
        );
    }

    async deleteScheduleConfirm(index) {
        const schedule = this.schedules[index];
        if (confirm(`Bạn có chắc muốn xóa lịch trình "${schedule.name}"?`)) {
            this.schedules.splice(index, 1);
            await this.saveSchedulesToStorage();
            this.renderSchedules();
            this.renderWeeklyView();
            this.updateCurrentStatus();
            this.showNotification("Đã xóa lịch trình", "success");
        }
    }

    async deleteSchedule() {
        if (this.currentSchedule !== null) {
            const schedule = this.schedules[this.currentSchedule];
            if (
                confirm(`Bạn có chắc muốn xóa lịch trình "${schedule.name}"?`)
            ) {
                this.schedules.splice(this.currentSchedule, 1);
                await this.saveSchedulesToStorage();
                this.renderSchedules();
                this.renderWeeklyView();
                this.updateCurrentStatus();
                this.hideScheduleModal();
                this.showNotification("Đã xóa lịch trình", "success");
            }
        }
    }

    editSchedule(index) {
        this.showScheduleModal(index);
    }

    async toggleSchedule(index) {
        this.schedules[index].enabled = !this.schedules[index].enabled;
        this.schedules[index].updatedAt = Date.now();

        await this.saveSchedulesToStorage();
        this.renderSchedules();
        this.renderWeeklyView();
        this.updateCurrentStatus();

        this.showNotification(
            `Đã ${this.schedules[index].enabled ? "bật" : "tắt"} lịch trình "${
                this.schedules[index].name
            }"`,
            "success"
        );
    }

    showTemplateModal() {
        document.getElementById("templateModal").style.display = "block";
        this.selectedTemplate = null;
        document
            .querySelectorAll(".template-card")
            .forEach((card) => card.classList.remove("selected"));
    }

    hideTemplateModal() {
        document.getElementById("templateModal").style.display = "none";
        this.selectedTemplate = null;
    }

    async applySelectedTemplate() {
        if (!this.selectedTemplate) {
            this.showNotification("Vui lòng chọn một mẫu lịch trình", "error");
            return;
        }

        const template = this.templates[this.selectedTemplate];
        if (!template) return;

        if (
            confirm(
                `Áp dụng mẫu "${template.name}"? Điều này sẽ thêm ${template.schedules.length} lịch trình mới.`
            )
        ) {
            template.schedules.forEach((schedule) => {
                this.schedules.push({
                    ...schedule,
                    id:
                        Date.now().toString() +
                        Math.random().toString(36).substr(2, 9),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            });

            await this.saveSchedulesToStorage();
            this.renderSchedules();
            this.renderWeeklyView();
            this.updateCurrentStatus();
            this.hideTemplateModal();

            this.showNotification(
                `Đã áp dụng mẫu "${template.name}"`,
                "success"
            );
        }
    }

    async saveSchedulesToStorage() {
        await chrome.storage.local.set({ schedules: this.schedules });
    }

    showNotification(message, type = "info") {
        // Implementation similar to manage.js
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
                
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }
                
                .schedule-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border: 1px solid #e9ecef;
                    border-radius: 12px;
                    margin-bottom: 12px;
                    transition: all 0.2s ease;
                }
                
                .schedule-item.disabled {
                    opacity: 0.6;
                    background: #f8f9fa;
                }
                
                .schedule-item:hover {
                    border-color: #667eea;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
                }
                
                .schedule-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .schedule-header h4 {
                    margin: 0;
                    color: #333;
                    font-size: 16px;
                }
                
                .schedule-details {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }
                
                .time-range {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    color: #667eea;
                }
                
                .time {
                    background: #f0f4ff;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 14px;
                }
                
                .separator {
                    color: #666;
                }
                
                .days-list {
                    display: flex;
                    gap: 4px;
                }
                
                .day-badge {
                    background: #e9ecef;
                    color: #495057;
                    padding: 2px 6px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                }
                
                .schedule-actions {
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
                
                .btn-icon.btn-danger:hover {
                    background: #f8d7da;
                    color: #dc3545;
                }
                
                .template-card.selected {
                    border-color: #667eea;
                    background: #f0f4ff;
                }
                
                .week-calendar {
                    display: flex;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    overflow: hidden;
                    background: white;
                }
                
                .time-axis {
                    width: 60px;
                    background: #f8f9fa;
                    border-right: 1px solid #e9ecef;
                }
                
                .time-slot {
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    color: #666;
                    border-bottom: 1px solid #e9ecef;
                }
                
                .days-grid {
                    flex: 1;
                    display: flex;
                }
                
                .day-column {
                    flex: 1;
                    border-right: 1px solid #e9ecef;
                }
                
                .day-column:last-child {
                    border-right: none;
                }
                
                .day-header {
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8f9fa;
                    border-bottom: 1px solid #e9ecef;
                    font-weight: 600;
                    font-size: 14px;
                }
                
                .day-slots {
                    height: 540px;
                    position: relative;
                }
                
                .schedule-slot {
                    cursor: pointer;
                }
                
                .slot-content {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    justify-content: center;
                    text-align: center;
                }
                
                .slot-name {
                    font-weight: 600;
                    margin-bottom: 2px;
                }
                
                .slot-time {
                    font-size: 10px;
                    opacity: 0.9;
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
let focusForgeSchedule;
document.addEventListener("DOMContentLoaded", () => {
    focusForgeSchedule = new FocusForgeSchedule();
});
