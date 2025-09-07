import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { DayOfWeek, SectionScheduleType } from '@prisma/client'
import { plainToInstance } from 'class-transformer'
import { PrismaService } from '../../prisma/prisma.service'
import { EnrollSectionDto, GetStudentScheduleDto, RemoveEnrollmentDto } from './dto/student-enrollment.dto'
import { StudentListDto } from './dto/student-list.dto'
import { StudentDto } from './dto/student.dto'
import { PdfService } from './pdf.service'

@Injectable()
export class StudentService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  async enrollInSection(dto: EnrollSectionDto) {
    const { studentId, sectionId } = dto

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      throw new NotFoundException('Student not found')
    }

    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        subject: true,
        teacher: true,
        classroom: true,
      },
    })

    if (!section) {
      throw new NotFoundException('Section not found')
    }

    const existingEnrollment = await this.prisma.sectionEnrollment.findUnique({
      where: {
        studentId_sectionId: {
          studentId,
          sectionId,
        },
      },
    })

    if (existingEnrollment) {
      throw new ConflictException('Student is already enrolled in this section')
    }

    if (section.currentEnrollment >= section.maxEnrollment) {
      throw new ConflictException('Section is full')
    }

    await this.checkScheduleConflict(studentId, section)

    const enrollment = await this.prisma.sectionEnrollment.create({
      data: {
        studentId,
        sectionId,
      },
      include: {
        section: {
          include: {
            subject: true,
            teacher: true,
            classroom: true,
          },
        },
      },
    })

    await this.prisma.section.update({
      where: { id: sectionId },
      data: {
        currentEnrollment: {
          increment: 1,
        },
      },
    })

    return enrollment
  }

  async removeEnrollment(dto: RemoveEnrollmentDto) {
    const { studentId, sectionId } = dto

    const enrollment = await this.prisma.sectionEnrollment.findUnique({
      where: {
        studentId_sectionId: {
          studentId,
          sectionId,
        },
      },
      include: {
        section: {
          include: {
            subject: true,
          },
        },
      },
    })

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found')
    }

    await this.prisma.sectionEnrollment.delete({
      where: {
        studentId_sectionId: {
          studentId,
          sectionId,
        },
      },
    })

    await this.prisma.section.update({
      where: { id: sectionId },
      data: {
        currentEnrollment: {
          decrement: 1,
        },
      },
    })

    return { message: 'Successfully removed from section', enrollment }
  }

  async getStudentSchedule(dto: GetStudentScheduleDto) {
    const { studentId, semester, year } = dto

    const whereClause: any = {
      studentId,
    }

    if (semester || year) {
      whereClause.section = {}
      if (semester) whereClause.section.semester = semester
      if (year) whereClause.section.year = year
    }

    const enrollments = await this.prisma.sectionEnrollment.findMany({
      where: whereClause,
      include: {
        section: {
          include: {
            subject: true,
            teacher: true,
            classroom: true,
          },
        },
      },
      orderBy: {
        section: {
          startTime: 'asc',
        },
      },
    })

    return enrollments
  }

  private async checkScheduleConflict(studentId: string, newSection: any) {
    const currentEnrollments = await this.prisma.sectionEnrollment.findMany({
      where: {
        studentId,
        section: {
          semester: newSection.semester,
          year: newSection.year,
        },
      },
      include: {
        section: true,
      },
    })

    // Get the days when the new section meets
    const newSectionDays = this.getSectionDays(newSection.scheduleType, newSection.customDays)

    // Check each existing enrollment for conflicts
    for (const enrollment of currentEnrollments) {
      const existingSection = enrollment.section
      const existingSectionDays = this.getSectionDays(existingSection.scheduleType, existingSection.customDays)

      // Check if there are any common days
      const commonDays = newSectionDays.filter(day => existingSectionDays.includes(day))

      if (commonDays.length > 0) {
        // Check if times overlap
        const newStart = new Date(newSection.startTime)
        const newEnd = new Date(newSection.endTime)
        const existingStart = new Date(existingSection.startTime)
        const existingEnd = new Date(existingSection.endTime)

        // Time overlap check: (start1 < end2) && (start2 < end1)
        const timeOverlap = newStart < existingEnd && existingStart < newEnd

        if (timeOverlap) {
          throw new ConflictException(
            `Schedule conflict detected! The new section conflicts with ${existingSection.sectionNumber} on ${commonDays.join(', ')} from ${this.formatTime(existingStart)} to ${this.formatTime(existingEnd)}`,
          )
        }
      }
    }
  }

  private getSectionDays(scheduleType: SectionScheduleType, customDays?: DayOfWeek[]): DayOfWeek[] {
    switch (scheduleType) {
      case SectionScheduleType.MONDAY_WEDNESDAY_FRIDAY:
        return [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY]
      case SectionScheduleType.TUESDAY_THURSDAY:
        return [DayOfWeek.TUESDAY, DayOfWeek.THURSDAY]
      case SectionScheduleType.DAILY:
        return [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY]
      case SectionScheduleType.WEEKEND:
        return [DayOfWeek.SATURDAY, DayOfWeek.SUNDAY]
      case SectionScheduleType.CUSTOM:
        return customDays || []
      default:
        return []
    }
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  async getAvailableSections(studentId: string, semester?: string, year?: number) {
    const whereClause: any = {}

    if (semester) {
      whereClause.semester = semester
    }
    if (year) {
      whereClause.year = year
    }

    const allSections = await this.prisma.section.findMany({
      where: whereClause,
      include: {
        subject: true,
        teacher: true,
        classroom: true,
        enrollments: {
          where: {
            studentId,
          },
        },
      },
    })

    const availableSections = allSections.filter(
      section => section.enrollments.length === 0 && section.currentEnrollment < section.maxEnrollment,
    )

    return availableSections
  }

  async generateSchedulePdf(dto: GetStudentScheduleDto): Promise<Buffer> {
    const { studentId } = dto

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    })
    if (!student) {
      throw new NotFoundException('Student not found')
    }

    const enrollments = await this.getStudentSchedule(dto)

    const scheduleData = {
      student: {
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        major: student.major,
        yearLevel: student.yearLevel,
      },
      sections: enrollments.map(enrollment => ({
        subject: {
          code: enrollment.section.subject.code,
          name: enrollment.section.subject.name,
          credits: enrollment.section.subject.credits,
        },
        teacher: {
          firstName: enrollment.section.teacher.firstName,
          lastName: enrollment.section.teacher.lastName,
          title: enrollment.section.teacher.title,
        },
        classroom: {
          number: enrollment.section.classroom.number,
          building: enrollment.section.classroom.building,
        },
        sectionNumber: enrollment.section.sectionNumber,
        semester: enrollment.section.semester,
        year: enrollment.section.year,
        scheduleType: enrollment.section.scheduleType,
        startTime: enrollment.section.startTime,
        endTime: enrollment.section.endTime,
      })),
    }

    return this.pdfService.generateSchedulePdf(scheduleData)
  }

  async getStudentById(studentId: string): Promise<StudentDto> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    })
    if (!student) {
      throw new NotFoundException('Student not found')
    }
    return plainToInstance(StudentDto, student)
  }

  async getAllStudents(): Promise<StudentListDto[]> {
    const students = await this.prisma.student.findMany({
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    })
    return plainToInstance(StudentListDto, students)
  }
}
