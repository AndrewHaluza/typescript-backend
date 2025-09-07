import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../../prisma/prisma.service'
import { PdfService } from './pdf.service'
import { StudentService } from './student.service'

const mockPrisma = {
  student: { findUnique: jest.fn(), findMany: jest.fn() },
  section: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  sectionEnrollment: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
}
const mockPdfService = { generateSchedulePdf: jest.fn() }

describe('StudentService', () => {
  let service: StudentService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PdfService, useValue: mockPdfService },
      ],
    }).compile()
    service = module.get<StudentService>(StudentService)
    jest.clearAllMocks()
  })

  describe('enrollInSection', () => {
    it('throws if student not found', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null)
      await expect(service.enrollInSection({ studentId: '1', sectionId: '2' })).rejects.toThrow(NotFoundException)
    })
    it('throws if section not found', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: '1' })
      mockPrisma.section.findUnique.mockResolvedValue(null)
      await expect(service.enrollInSection({ studentId: '1', sectionId: '2' })).rejects.toThrow(NotFoundException)
    })
    it('throws if already enrolled', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: '1' })
      mockPrisma.section.findUnique.mockResolvedValue({ id: '2', currentEnrollment: 0, maxEnrollment: 10 })
      mockPrisma.sectionEnrollment.findUnique.mockResolvedValue({ id: 'enroll' })
      await expect(service.enrollInSection({ studentId: '1', sectionId: '2' })).rejects.toThrow(ConflictException)
    })
    it('throws if section is full', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: '1' })
      mockPrisma.section.findUnique.mockResolvedValue({ id: '2', currentEnrollment: 10, maxEnrollment: 10 })
      mockPrisma.sectionEnrollment.findUnique.mockResolvedValue(null)
      await expect(service.enrollInSection({ studentId: '1', sectionId: '2' })).rejects.toThrow(ConflictException)
    })
    it('enrolls student if no conflicts', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: '1' })
      mockPrisma.section.findUnique.mockResolvedValue({
        id: '2',
        currentEnrollment: 0,
        maxEnrollment: 10,
        semester: 'Fall',
        year: 2025,
        scheduleType: 'MONDAY_WEDNESDAY_FRIDAY',
        customDays: [],
        startTime: '1970-01-01T08:00:00Z',
        endTime: '1970-01-01T09:00:00Z',
      })
      mockPrisma.sectionEnrollment.findUnique.mockResolvedValue(null)
      mockPrisma.sectionEnrollment.findMany.mockResolvedValue([])
      mockPrisma.sectionEnrollment.create.mockResolvedValue({ id: 'enroll' })
      mockPrisma.section.update.mockResolvedValue({})
      await expect(service.enrollInSection({ studentId: '1', sectionId: '2' })).resolves.toEqual({ id: 'enroll' })
    })
  })

  describe('removeEnrollment', () => {
    it('throws if enrollment not found', async () => {
      mockPrisma.sectionEnrollment.findUnique.mockResolvedValue(null)
      await expect(service.removeEnrollment({ studentId: '1', sectionId: '2' })).rejects.toThrow(NotFoundException)
    })
    it('removes enrollment', async () => {
      mockPrisma.sectionEnrollment.findUnique.mockResolvedValue({ id: 'enroll', section: {} })
      mockPrisma.sectionEnrollment.delete.mockResolvedValue({})
      mockPrisma.section.update.mockResolvedValue({})
      await expect(service.removeEnrollment({ studentId: '1', sectionId: '2' })).resolves.toHaveProperty('message')
    })
  })

  describe('getStudentSchedule', () => {
    it('returns enrollments', async () => {
      mockPrisma.sectionEnrollment.findMany.mockResolvedValue([{ id: 'enroll' }])
      await expect(service.getStudentSchedule({ studentId: '1' })).resolves.toEqual([{ id: 'enroll' }])
    })
  })

  describe('getAvailableSections', () => {
    it('returns available sections', async () => {
      mockPrisma.section.findMany.mockResolvedValue([
        { id: '1', enrollments: [], currentEnrollment: 0, maxEnrollment: 10 },
        { id: '2', enrollments: [{ studentId: '1' }], currentEnrollment: 1, maxEnrollment: 10 },
      ])
      await expect(service.getAvailableSections('1')).resolves.toEqual([
        { id: '1', enrollments: [], currentEnrollment: 0, maxEnrollment: 10 },
      ])
    })
  })

  describe('generateSchedulePdf', () => {
    it('throws if student not found', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null)
      await expect(service.generateSchedulePdf({ studentId: '1' })).rejects.toThrow(NotFoundException)
    })
    it('returns pdf buffer', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({
        firstName: 'A',
        lastName: 'B',
        studentId: '1',
        major: 'CS',
        yearLevel: 1,
      })
      mockPrisma.sectionEnrollment.findMany.mockResolvedValue([])
      mockPdfService.generateSchedulePdf.mockResolvedValue(Buffer.from('pdf'))
      await expect(service.generateSchedulePdf({ studentId: '1' })).resolves.toEqual(Buffer.from('pdf'))
    })
  })

  describe('getStudentById', () => {
    it('throws if student not found', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null)
      await expect(service.getStudentById('1')).rejects.toThrow(NotFoundException)
    })
    it('returns student dto', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({
        id: '1',
        studentId: '1',
        firstName: 'A',
        lastName: 'B',
        major: 'CS',
        yearLevel: 1,
      })
      await expect(service.getStudentById('1')).resolves.toHaveProperty('id', '1')
    })
  })

  describe('getAllStudents', () => {
    it('returns student list', async () => {
      mockPrisma.student.findMany.mockResolvedValue([
        { id: '1', studentId: '1', firstName: 'A', lastName: 'B', email: 'a@b.com', createdAt: new Date() },
      ])
      await expect(service.getAllStudents()).resolves.toHaveLength(1)
    })
  })
})
