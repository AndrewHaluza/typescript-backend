import { PdfService } from './pdf.service'

describe('PdfService', () => {
  let service: PdfService

  beforeEach(() => {
    service = new PdfService()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should generate a PDF buffer for valid schedule data', async () => {
    const scheduleData = {
      student: {
        firstName: 'Alice',
        lastName: 'Smith',
        studentId: 'S123',
        major: 'CS',
        yearLevel: 2,
      },
      sections: [
        {
          subject: { code: 'CS101', name: 'Intro to CS', credits: 3 },
          teacher: { firstName: 'Bob', lastName: 'Jones', title: 'Prof.' },
          classroom: { number: '101', building: 'Main' },
          sectionNumber: 'A',
          semester: 'Fall',
          year: 2025,
          scheduleType: 'MONDAY_WEDNESDAY_FRIDAY',
          startTime: new Date('1970-01-01T08:00:00Z'),
          endTime: new Date('1970-01-01T09:00:00Z'),
        },
      ],
    }
    const buffer = await service.generateSchedulePdf(scheduleData)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('should handle empty sections gracefully', async () => {
    const scheduleData = {
      student: {
        firstName: 'Alice',
        lastName: 'Smith',
        studentId: 'S123',
      },
      sections: [],
    }
    const buffer = await service.generateSchedulePdf(scheduleData)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('should format time correctly', () => {
    const date = new Date('1970-01-01T13:45:00Z')
    const formatted = (service as any).formatTime(date)
    expect(typeof formatted).toBe('string')
    expect(formatted).toMatch(/\d{1,2}:\d{2}/)
  })

  it('should format schedule type', () => {
    expect((service as any).formatScheduleType('MONDAY_WEDNESDAY_FRIDAY')).toBe('MWF')
    expect((service as any).formatScheduleType('TUESDAY_THURSDAY')).toBe('TR')
    expect((service as any).formatScheduleType('DAILY')).toBe('MTWRF')
    expect((service as any).formatScheduleType('WEEKEND')).toBe('SS')
    expect((service as any).formatScheduleType('CUSTOM')).toBe('Custom')
    expect((service as any).formatScheduleType('OTHER')).toBe('OTHER')
  })
})
