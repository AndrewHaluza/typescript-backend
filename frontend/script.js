// API Configuration
const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Global State
let currentStudent = null;
let currentSchedule = [];
let availableSections = [];

// DOM Elements
const elements = {
    studentSelect: document.getElementById('studentSelect'),
    studentInfo: document.getElementById('studentInfo'),
    studentName: document.getElementById('studentName'),
    studentEmail: document.getElementById('studentEmail'),
    studentId: document.getElementById('studentId'),
    semesterSelect: document.getElementById('semesterSelect'),
    yearSelect: document.getElementById('yearSelect'),
    currentSchedule: document.getElementById('currentSchedule'),
    availableSections: document.getElementById('availableSections'),
    refreshSchedule: document.getElementById('refreshSchedule'),
    refreshSections: document.getElementById('refreshSections'),
    downloadPdf: document.getElementById('downloadPdf'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    notification: document.getElementById('notification'),
    notificationMessage: document.getElementById('notificationMessage'),
    closeNotification: document.getElementById('closeNotification')
};

// Utility Functions
function showLoading() {
    elements.loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    elements.loadingOverlay.style.display = 'none';
}

function showNotification(message, type = 'info') {
    elements.notificationMessage.textContent = message;
    elements.notification.className = `notification ${type}`;
    elements.notification.style.display = 'flex';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        elements.notification.style.display = 'none';
    }, 5000);
}

function hideNotification() {
    elements.notification.style.display = 'none';
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

async function fetchStudents() {
    return await apiRequest('/students');
}

async function fetchStudentSchedule(studentId, semester, year) {
    const params = new URLSearchParams();
    if (semester) params.append('semester', semester);
    if (year) params.append('year', year.toString());
    
    return await apiRequest(`/students/${studentId}/schedule?${params}`);
}

async function fetchAvailableSections(studentId, semester, year) {
    const params = new URLSearchParams();
    if (semester) params.append('semester', semester);
    if (year) params.append('year', year.toString());
    
    return await apiRequest(`/students/${studentId}/available-sections?${params}`);
}

async function enrollInSection(studentId, sectionId) {
    return await apiRequest('/students/enroll', {
        method: 'POST',
        body: JSON.stringify({ studentId, sectionId })
    });
}

async function removeEnrollment(studentId, sectionId) {
    return await apiRequest('/students/enroll', {
        method: 'DELETE',
        body: JSON.stringify({ studentId, sectionId })
    });
}

function downloadSchedulePdf(studentId, semester, year) {
    const params = new URLSearchParams();
    if (semester) params.append('semester', semester);
    if (year) params.append('year', year.toString());
    
    const url = `${API_BASE_URL}/students/${studentId}/schedule/pdf?${params}`;
    window.open(url, '_blank');
}

// UI Rendering Functions
function renderStudentInfo(student) {
    elements.studentName.textContent = `${student.firstName} ${student.lastName}`;
    elements.studentEmail.textContent = student.email;
    elements.studentId.textContent = student.id;
    elements.studentInfo.style.display = 'block';
}

function formatTime(timeString) {
    // Convert from HH:MM:SS to readable format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function formatScheduleType(scheduleType) {
    const scheduleMap = {
        'MWF': 'Monday, Wednesday, Friday',
        'TR': 'Tuesday, Thursday',
        'DAILY': 'Daily',
        'MW': 'Monday, Wednesday',
        'WF': 'Wednesday, Friday'
    };
    return scheduleMap[scheduleType] || scheduleType;
}

function renderSchedule(schedule) {
    if (!schedule || schedule.length === 0) {
        elements.currentSchedule.innerHTML = '<p class="loading">No enrolled sections found</p>';
        return;
    }

    const scheduleHTML = schedule.map(enrollment => {
        const section = enrollment.section;
        return `
            <div class="schedule-item">
                <h3>${section.subject.name}</h3>
                <div class="subject-code">${section.subject.code}</div>
                <div class="schedule-details">
                    <strong>Schedule:</strong> ${formatScheduleType(section.scheduleType)}<br>
                    <strong>Time:</strong> ${formatTime(section.startTime)} - ${formatTime(section.endTime)}<br>
                    <strong>Room:</strong> ${section.classroom.building} ${section.classroom.number}<br>
                    <strong>Credits:</strong> ${section.subject.credits}
                </div>
                <div class="teacher-info">
                    <strong>Instructor:</strong> ${section.teacher.firstName} ${section.teacher.lastName}
                </div>
                <div class="actions">
                    <button class="btn btn-danger" onclick="handleRemoveEnrollment('${enrollment.sectionId}')">
                        Remove
                    </button>
                </div>
            </div>
        `;
    }).join('');

    elements.currentSchedule.innerHTML = scheduleHTML;
}

function renderAvailableSections(sections) {
    if (!sections || sections.length === 0) {
        elements.availableSections.innerHTML = '<p class="loading">No available sections found</p>';
        return;
    }

    const sectionsHTML = sections.map(section => {
        const isConflict = section.hasConflict;
        const isFull = section.currentEnrollment >= section.maxEnrollment;
        
        return `
            <div class="section-item ${isConflict ? 'conflict' : ''}">
                ${isConflict ? '<div class="conflict-warning">⚠️ Schedule Conflict</div>' : ''}
                <h3>${section.subject.name}</h3>
                <div class="subject-code">${section.subject.code}</div>
                <div class="schedule-details">
                    <strong>Schedule:</strong> ${formatScheduleType(section.scheduleType)}<br>
                    <strong>Time:</strong> ${formatTime(section.startTime)} - ${formatTime(section.endTime)}<br>
                    <strong>Room:</strong> ${section.classroom.building} ${section.classroom.number}<br>
                    <strong>Credits:</strong> ${section.subject.credits}
                </div>
                <div class="teacher-info">
                    <strong>Instructor:</strong> ${section.teacher.firstName} ${section.teacher.lastName}
                </div>
                <div class="section-enrollment">
                    <div class="enrollment-info ${isFull ? 'enrollment-full' : ''}">
                        Enrollment: ${section.currentEnrollment}/${section.maxEnrollment}
                        ${isFull ? '(FULL)' : ''}
                    </div>
                    <button 
                        class="btn ${isFull || isConflict ? 'btn-secondary' : 'btn-success'}" 
                        onclick="handleEnrollment('${section.id}')"
                        ${isFull ? 'disabled' : ''}
                    >
                        ${isFull ? 'Full' : isConflict ? 'Enroll (Conflict)' : 'Enroll'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    elements.availableSections.innerHTML = sectionsHTML;
}

// Event Handlers
async function handleStudentChange() {
    const studentId = elements.studentSelect.value;
    if (!studentId) {
        elements.studentInfo.style.display = 'none';
        elements.currentSchedule.innerHTML = '<p class="loading">Select a student to view their schedule</p>';
        elements.availableSections.innerHTML = '<p class="loading">Select a student to view available sections</p>';
        return;
    }

    try {
        showLoading();
        
        // Find student info
        const students = await fetchStudents();
        currentStudent = students.find(s => s.id === studentId);
        
        if (currentStudent) {
            renderStudentInfo(currentStudent);
            await refreshData();
        }
    } catch (error) {
        showNotification(`Error loading student data: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

async function refreshData() {
    if (!currentStudent) return;

    try {
        const semester = elements.semesterSelect.value;
        const year = parseInt(elements.yearSelect.value);

        // Fetch both schedule and available sections
        const [schedule, sections] = await Promise.all([
            fetchStudentSchedule(currentStudent.id, semester, year),
            fetchAvailableSections(currentStudent.id, semester, year)
        ]);

        currentSchedule = schedule;
        availableSections = sections;

        renderSchedule(schedule);
        renderAvailableSections(sections);
    } catch (error) {
        showNotification(`Error refreshing data: ${error.message}`, 'error');
    }
}

async function handleEnrollment(sectionId) {
    if (!currentStudent) return;

    try {
        showLoading();
        await enrollInSection(currentStudent.id, sectionId);
        showNotification('Successfully enrolled in section!', 'success');
        await refreshData();
    } catch (error) {
        showNotification(`Enrollment failed: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

async function handleRemoveEnrollment(sectionId) {
    if (!currentStudent) return;

    if (!confirm('Are you sure you want to remove this enrollment?')) {
        return;
    }

    try {
        showLoading();
        await removeEnrollment(currentStudent.id, sectionId);
        showNotification('Successfully removed enrollment!', 'success');
        await refreshData();
    } catch (error) {
        showNotification(`Failed to remove enrollment: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function handleDownloadPdf() {
    if (!currentStudent) {
        showNotification('Please select a student first', 'error');
        return;
    }

    const semester = elements.semesterSelect.value;
    const year = parseInt(elements.yearSelect.value);
    
    try {
        downloadSchedulePdf(currentStudent.id, semester, year);
        showNotification('PDF download started!', 'success');
    } catch (error) {
        showNotification(`Failed to download PDF: ${error.message}`, 'error');
    }
}

// Initialize Application
async function initializeApp() {
    try {
        showLoading();
        
        // Load students into dropdown
        const students = await fetchStudents();
        const studentOptions = students.map(student => 
            `<option value="${student.id}">${student.firstName} ${student.lastName}</option>`
        ).join('');
        
        elements.studentSelect.innerHTML = `
            <option value="">Select a student...</option>
            ${studentOptions}
        `;

        // Set default semester/year
        const currentYear = new Date().getFullYear();
        elements.yearSelect.value = currentYear.toString();
        
        // Add event listeners
        elements.studentSelect.addEventListener('change', handleStudentChange);
        elements.semesterSelect.addEventListener('change', refreshData);
        elements.yearSelect.addEventListener('change', refreshData);
        elements.refreshSchedule.addEventListener('click', refreshData);
        elements.refreshSections.addEventListener('click', refreshData);
        elements.downloadPdf.addEventListener('click', handleDownloadPdf);
        elements.closeNotification.addEventListener('click', hideNotification);

        hideLoading();
        showNotification('Application loaded successfully!', 'success');
    } catch (error) {
        hideLoading();
        showNotification(`Failed to initialize application: ${error.message}`, 'error');
    }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Make functions available globally for inline event handlers
window.handleEnrollment = handleEnrollment;
window.handleRemoveEnrollment = handleRemoveEnrollment;
