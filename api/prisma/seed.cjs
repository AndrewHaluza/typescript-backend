const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Clear existing data (optional - for development)
  await prisma.sectionEnrollment.deleteMany()
  await prisma.section.deleteMany()
  await prisma.student.deleteMany()
  await prisma.classroom.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.teacher.deleteMany()

  // Create Teachers
  const teachers = await Promise.all([
    prisma.teacher.create({
      data: {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@university.edu',
        phoneNumber: '555-0101',
        department: 'Computer Science',
        title: 'Professor',
      },
    }),
    prisma.teacher.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@university.edu',
        phoneNumber: '555-0102',
        department: 'Mathematics',
        title: 'Associate Professor',
      },
    }),
    prisma.teacher.create({
      data: {
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@university.edu',
        phoneNumber: '555-0103',
        department: 'Physics',
        title: 'Assistant Professor',
      },
    }),
  ])

  // Create Subjects
  const subjects = await Promise.all([
    prisma.subject.create({
      data: {
        code: 'CS101',
        name: 'Introduction to Computer Science',
        description: 'Basic concepts of programming and computer science',
        credits: 3,
        department: 'Computer Science',
      },
    }),
    prisma.subject.create({
      data: {
        code: 'MATH201',
        name: 'Calculus I',
        description: 'Differential and integral calculus',
        credits: 4,
        department: 'Mathematics',
      },
    }),
    prisma.subject.create({
      data: {
        code: 'PHYS101',
        name: 'General Physics I',
        description: 'Mechanics, heat, and sound',
        credits: 3,
        department: 'Physics',
      },
    }),
    prisma.subject.create({
      data: {
        code: 'CS201',
        name: 'Data Structures',
        description: 'Advanced programming with data structures and algorithms',
        credits: 3,
        department: 'Computer Science',
      },
    }),
  ])

  // Create Classrooms
  const classrooms = await Promise.all([
    prisma.classroom.create({
      data: {
        number: 'CS-101',
        building: 'Computer Science Building',
        capacity: 30,
        type: 'Computer Lab',
      },
    }),
    prisma.classroom.create({
      data: {
        number: 'MATH-205',
        building: 'Mathematics Building',
        capacity: 50,
        type: 'Lecture Hall',
      },
    }),
    prisma.classroom.create({
      data: {
        number: 'PHYS-301',
        building: 'Physics Building',
        capacity: 25,
        type: 'Lab',
      },
    }),
    prisma.classroom.create({
      data: {
        number: 'LH-401',
        building: 'Main Building',
        capacity: 100,
        type: 'Large Lecture Hall',
      },
    }),
  ])

  // Create Students
  const students = await Promise.all([
    prisma.student.create({
      data: {
        studentId: 'STU001',
        firstName: 'Alice',
        lastName: 'Wilson',
        email: 'alice.wilson@student.university.edu',
        phoneNumber: '555-1001',
        dateOfBirth: new Date('2002-05-15'),
        major: 'Computer Science',
        yearLevel: 2,
        gpa: 3.7,
      },
    }),
    prisma.student.create({
      data: {
        studentId: 'STU002',
        firstName: 'Bob',
        lastName: 'Martinez',
        email: 'bob.martinez@student.university.edu',
        phoneNumber: '555-1002',
        dateOfBirth: new Date('2001-08-22'),
        major: 'Mathematics',
        yearLevel: 3,
        gpa: 3.9,
      },
    }),
    prisma.student.create({
      data: {
        studentId: 'STU003',
        firstName: 'Carol',
        lastName: 'Davis',
        email: 'carol.davis@student.university.edu',
        phoneNumber: '555-1003',
        dateOfBirth: new Date('2003-02-10'),
        major: 'Physics',
        yearLevel: 1,
        gpa: 3.5,
      },
    }),
    prisma.student.create({
      data: {
        studentId: 'STU004',
        firstName: 'David',
        lastName: 'Lee',
        email: 'david.lee@student.university.edu',
        phoneNumber: '555-1004',
        dateOfBirth: new Date('2002-11-03'),
        major: 'Computer Science',
        yearLevel: 2,
        gpa: 3.8,
      },
    }),
  ])

  // Create Sections
  const sections = await Promise.all([
    // CS101 - MWF 9:00-9:50 AM
    prisma.section.create({
      data: {
        sectionNumber: '001',
        semester: 'Fall',
        year: 2025,
        scheduleType: 'MONDAY_WEDNESDAY_FRIDAY',
        startTime: new Date('1970-01-01T09:00:00Z'),
        endTime: new Date('1970-01-01T09:50:00Z'),
        maxEnrollment: 30,
        teacherId: teachers[0].id, // John Smith
        subjectId: subjects[0].id, // CS101
        classroomId: classrooms[0].id, // CS-101
      },
    }),
    // MATH201 - TR 10:30-11:50 AM (80 minutes)
    prisma.section.create({
      data: {
        sectionNumber: '001',
        semester: 'Fall',
        year: 2025,
        scheduleType: 'TUESDAY_THURSDAY',
        startTime: new Date('1970-01-01T10:30:00Z'),
        endTime: new Date('1970-01-01T11:50:00Z'),
        maxEnrollment: 50,
        teacherId: teachers[1].id, // Sarah Johnson
        subjectId: subjects[1].id, // MATH201
        classroomId: classrooms[1].id, // MATH-205
      },
    }),
    // PHYS101 - Daily 7:30-8:20 AM
    prisma.section.create({
      data: {
        sectionNumber: '001',
        semester: 'Fall',
        year: 2025,
        scheduleType: 'DAILY',
        startTime: new Date('1970-01-01T07:30:00Z'),
        endTime: new Date('1970-01-01T08:20:00Z'),
        maxEnrollment: 25,
        teacherId: teachers[2].id, // Michael Brown
        subjectId: subjects[2].id, // PHYS101
        classroomId: classrooms[2].id, // PHYS-301
      },
    }),
    // PHYS102 - Daily 7:30-8:20 AM - conflict with PHYS101
    prisma.section.create({
      data: {
        sectionNumber: '002',
        semester: 'Fall',
        year: 2025,
        scheduleType: 'DAILY',
        startTime: new Date('1970-01-01T07:30:00Z'),
        endTime: new Date('1970-01-01T08:20:00Z'),
        maxEnrollment: 25,
        teacherId: teachers[1].id, // Sarah Johnson
        subjectId: subjects[2].id, // PHYS101
        classroomId: classrooms[1].id, // MATH-205
      },
    }),
    // CS201 - MWF 2:00-2:50 PM
    prisma.section.create({
      data: {
        sectionNumber: '001',
        semester: 'Fall',
        year: 2025,
        scheduleType: 'MONDAY_WEDNESDAY_FRIDAY',
        startTime: new Date('1970-01-01T14:00:00Z'),
        endTime: new Date('1970-01-01T14:50:00Z'),
        maxEnrollment: 30,
        teacherId: teachers[0].id, // John Smith
        subjectId: subjects[3].id, // CS201
        classroomId: classrooms[0].id, // CS-101
      },
    }),
  ])

  // Create Section Enrollments
  await Promise.all([
    // Alice enrolls in CS101 and MATH201
    prisma.sectionEnrollment.create({
      data: {
        studentId: students[0].id, // Alice
        sectionId: sections[0].id, // CS101
      },
    }),
    prisma.sectionEnrollment.create({
      data: {
        studentId: students[0].id, // Alice
        sectionId: sections[1].id, // MATH201
      },
    }),
    // Bob enrolls in MATH201 and PHYS101
    prisma.sectionEnrollment.create({
      data: {
        studentId: students[1].id, // Bob
        sectionId: sections[1].id, // MATH201
      },
    }),
    prisma.sectionEnrollment.create({
      data: {
        studentId: students[1].id, // Bob
        sectionId: sections[2].id, // PHYS101
      },
    }),
    // Carol enrolls in PHYS101 and CS101
    prisma.sectionEnrollment.create({
      data: {
        studentId: students[2].id, // Carol
        sectionId: sections[2].id, // PHYS101
      },
    }),
    prisma.sectionEnrollment.create({
      data: {
        studentId: students[2].id, // Carol
        sectionId: sections[0].id, // CS101
      },
    }),
    // David enrolls in CS101 and CS201
    prisma.sectionEnrollment.create({
      data: {
        studentId: students[3].id, // David
        sectionId: sections[0].id, // CS101
      },
    }),
    prisma.sectionEnrollment.create({
      data: {
        studentId: students[3].id, // David
        sectionId: sections[3].id, // CS201
      },
    }),
  ])

  // Update current enrollment counts
  for (const section of sections) {
    const enrollmentCount = await prisma.sectionEnrollment.count({
      where: { sectionId: section.id },
    })
    await prisma.section.update({
      where: { id: section.id },
      data: { currentEnrollment: enrollmentCount },
    })
  }

  await prisma.user.upsert({
    where: { email: 'testuser@example.com' },
    update: {},
    create: {
      email: 'testuser@example.com',
      password: 'testpassword',
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
