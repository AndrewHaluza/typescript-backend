import { Injectable } from '@nestjs/common'

const PDFDocument = require('pdfkit')

interface ScheduleData {
  student: {
    firstName: string
    lastName: string
    studentId: string
    major?: string
    yearLevel?: number
  }
  sections: Array<{
    subject: {
      code: string
      name: string
      credits: number
    }
    teacher: {
      firstName: string
      lastName: string
      title?: string
    }
    classroom: {
      number: string
      building: string
    }
    sectionNumber: string
    semester: string
    year: number
    scheduleType: string
    startTime: Date
    endTime: Date
  }>
}

@Injectable()
export class PdfService {
  async generateSchedulePdf(scheduleData: ScheduleData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: {
            top: 25,
            bottom: 25,
            left: 25,
            right: 25,
          },
        })

        const chunks: Buffer[] = []
        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('University Course Schedule', { align: 'center' }).moveDown()

        // Student Information
        doc.fontSize(14).font('Helvetica-Bold').text('Student Information:', { underline: true }).moveDown(0.5)

        doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Name: ${scheduleData.student.firstName} ${scheduleData.student.lastName}`)
          .text(`Student ID: ${scheduleData.student.studentId}`)

        if (scheduleData.student.major) {
          doc.text(`Major: ${scheduleData.student.major}`)
        }

        if (scheduleData.student.yearLevel) {
          doc.text(`Year Level: ${scheduleData.student.yearLevel}`)
        }

        // Get semester/year from first section if available
        if (scheduleData.sections.length > 0) {
          const firstSection = scheduleData.sections[0]
          doc.text(`Semester: ${firstSection.semester} ${firstSection.year}`)
        }

        doc.moveDown()

        // Course Schedule Table
        doc.fontSize(14).font('Helvetica-Bold').text('Course Schedule:', { underline: true }).moveDown(0.5)

        if (scheduleData.sections.length === 0) {
          doc.fontSize(12).font('Helvetica').text('No courses enrolled for this semester.')
        } else {
          // Table headers
          const tableTop = doc.y
          const tableLeft = 30
          const columnWidths = {
            subject: 70,
            title: 120,
            section: 40,
            time: 80,
            days: 60,
            teacher: 80,
            classroom: 80,
            credits: 40,
          }

          let currentX = tableLeft

          // Draw table headers
          doc.fontSize(10).font('Helvetica-Bold').text('Subject', currentX, tableTop, { width: columnWidths.subject })

          currentX += columnWidths.subject
          doc.text('Course Title', currentX, tableTop, { width: columnWidths.title })

          currentX += columnWidths.title
          doc.text('Sec', currentX, tableTop, { width: columnWidths.section })

          currentX += columnWidths.section
          doc.text('Time', currentX, tableTop, { width: columnWidths.time })

          currentX += columnWidths.time
          doc.text('Days', currentX, tableTop, { width: columnWidths.days })

          currentX += columnWidths.days
          doc.text('Teacher', currentX, tableTop, { width: columnWidths.teacher })

          currentX += columnWidths.teacher
          doc.text('Room', currentX, tableTop, { width: columnWidths.classroom })

          currentX += columnWidths.classroom
          doc.text('Credits', currentX, tableTop, { width: columnWidths.credits })

          // Draw header line
          doc
            .moveTo(tableLeft, tableTop + 15)
            .lineTo(tableLeft + Object.values(columnWidths).reduce((a, b) => a + b, 0), tableTop + 15)
            .stroke()

          // Table rows
          let currentY = tableTop + 25
          doc.font('Helvetica').fontSize(9)

          // Sort sections by time for better readability
          const sortedSections = scheduleData.sections.sort((a, b) => {
            return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          })

          for (const section of sortedSections) {
            // Check if we need a new page
            if (currentY > 700) {
              doc.addPage()
              currentY = 50
            }

            currentX = tableLeft

            // Subject code
            doc.text(section.subject.code, currentX, currentY, { width: columnWidths.subject })

            // Course title (truncated if too long)
            currentX += columnWidths.subject
            const truncatedTitle =
              section.subject.name.length > 18 ? section.subject.name.substring(0, 15) + '...' : section.subject.name
            doc.text(truncatedTitle, currentX, currentY, { width: columnWidths.title })

            // Section number
            currentX += columnWidths.title
            doc.text(section.sectionNumber, currentX, currentY, { width: columnWidths.section })

            // Time
            currentX += columnWidths.section
            const startTime = this.formatTime(new Date(section.startTime))
            const endTime = this.formatTime(new Date(section.endTime))
            doc.text(`${startTime}-${endTime}`, currentX, currentY, { width: columnWidths.time })

            // Days
            currentX += columnWidths.time
            const days = this.formatScheduleType(section.scheduleType)
            doc.text(days, currentX, currentY, { width: columnWidths.days })

            // Teacher
            currentX += columnWidths.days
            const teacherName = `${section.teacher.firstName} ${section.teacher.lastName}`
            const truncatedTeacher = teacherName.length > 12 ? teacherName.substring(0, 9) + '...' : teacherName
            doc.text(truncatedTeacher, currentX, currentY, { width: columnWidths.teacher })

            // Classroom
            currentX += columnWidths.teacher
            const classroom = `${section.classroom.number}, ${section.classroom.building}`
            const truncatedClassroom = classroom.length > 12 ? classroom.substring(0, 9) + '...' : classroom
            doc.text(truncatedClassroom, currentX, currentY, { width: columnWidths.classroom })

            // Credits
            currentX += columnWidths.classroom
            doc.text(section.subject.credits.toString(), currentX, currentY, { width: columnWidths.credits })

            currentY += 20
          }

          // Total credits
          const totalCredits = scheduleData.sections.reduce((sum, section) => sum + section.subject.credits, 0)
          const tableWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0)
          doc
            .moveDown()
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(`Total Credits: ${totalCredits}`, tableLeft, doc.y, { width: tableWidth, align: 'right' })
        }

        // Footer
        doc
          .fontSize(8)
          .font('Helvetica')
          .text(`Generated on ${new Date().toLocaleDateString()}`, 50, 750, { align: 'center' })

        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  private formatScheduleType(scheduleType: string): string {
    switch (scheduleType) {
      case 'MONDAY_WEDNESDAY_FRIDAY':
        return 'MWF'
      case 'TUESDAY_THURSDAY':
        return 'TR'
      case 'DAILY':
        return 'MTWRF'
      case 'WEEKEND':
        return 'SS'
      case 'CUSTOM':
        return 'Custom'
      default:
        return scheduleType
    }
  }
}
