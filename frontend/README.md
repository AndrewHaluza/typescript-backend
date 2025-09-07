# University Course Scheduling System - Frontend

This is a comprehensive frontend interface for the University Course Scheduling System with multiple pages and full functionality.

## Features

### 🏠 Landing Page (/)
- Modern welcome page with system overview
- Feature highlights and technology information
- Navigation to enrollment and dashboard

### 📚 Course Enrollment (/enrollment)
- **Student Selection**: Choose from available students
- **Schedule Management**: View current enrollments with detailed information
- **Course Enrollment**: Enroll in available sections with real-time conflict detection
- **Schedule Conflicts**: Visual warnings for time conflicts with detailed messages
- **Search & Filter**: Find courses by subject, code, or instructor
- **Real-time Validation**: Immediate feedback on enrollment capacity and conflicts

### 📊 Dashboard (/dashboard)
- **Schedule Overview**: Complete schedule view with course details
- **PDF Export**: Download formatted schedule as PDF
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

1. **Start the Backend API** (from the `api` directory):
   ```bash
   cd api
   npm run start:dev
   ```

2. **Start the Frontend** (from the `frontend` directory):
   ```bash
   npm install  # Install dependencies (first time only)
   npm start    # Start the Node.js server
   ```

3. **Access the Applications**:
   - **Landing Page**: http://localhost:3000
   - **Course Enrollment**: http://localhost:3000/enrollment
   - **Dashboard**: http://localhost:3000/dashboard
   - **Backend API**: http://127.0.0.1:5000/api

## Course Enrollment Features

### ✅ Schedule Conflict Prevention
Students cannot enroll in overlapping sections as requested:

- **Time-based Detection**: Prevents enrollment in courses with overlapping time periods
- **Day-based Detection**: Checks conflicts across MWF, TR, Daily, and other schedules  
- **Visual Warnings**: Red borders and conflict badges on conflicting sections
- **Detailed Messages**: Specific conflict information with course names and times

#### Example Conflict Scenario:
- If enrolled in "General Chemistry 1" (MWF 8:00-8:50 AM)
- Cannot enroll in any course between 8:00-8:50 AM on Monday, Wednesday, or Friday
- System shows: "Schedule conflict detected! Conflicts with General Chemistry 1 on Mon, Wed, Fri from 8:00 AM to 8:50 AM"

### ✅ Complete Enrollment Workflow
- **Add Sections**: Enroll with automatic conflict checking
- **Remove Sections**: Easy removal with confirmation modals
- **Search Courses**: Find by course name, code, or instructor
- **Real-time Updates**: Live enrollment counts and availability
- **Capacity Limits**: Enforced enrollment maximums

## Project Structure

```
frontend/
├── public/
│   ├── index.html              # Landing page
│   ├── dashboard/
│   │   └── index.html          # Dashboard page
│   ├── enrollment/
│   │   └── index.html          # Course enrollment page
│   └── assets/
│       ├── css/
│       │   ├── main.css        # Landing page styles
│       │   ├── dashboard.css   # Dashboard styles
│       │   └── enrollment.css  # Enrollment page styles
│       └── js/
│           ├── main.js         # Landing page functionality
│           ├── dashboard.js    # Dashboard functionality
│           └── enrollment.js   # Enrollment functionality
├── server.js                   # Express server
├── package.json               # Dependencies
└── README.md                  # This file
```

## API Integration

The frontend uses the existing backend APIs:

- `GET /api/students` - Get all students
- `GET /api/students/{id}/schedule` - Get student's current schedule
- `GET /api/students/{id}/available-sections` - Get available sections
- `POST /api/students/enroll` - Enroll in a section (with conflict detection)
- `DELETE /api/students/enroll` - Remove enrollment
- `GET /api/students/{id}/schedule/pdf` - Download PDF schedule

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge
- Mobile browsers supported
- Responsive design for all screen sizes
