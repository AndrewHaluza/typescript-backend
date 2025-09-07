import { Body, Controller, Delete, Get, Param, Post, Query, Res } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Response } from 'express'
import { EnrollSectionDto, GetStudentScheduleDto, RemoveEnrollmentDto } from './dto/student-enrollment.dto'
import { StudentListDto } from './dto/student-list.dto'
import { StudentService } from './student.service'

@ApiTags('Students')
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all students' })
  @ApiResponse({ status: 200, description: 'List of students.', type: [StudentListDto] })
  async getAllStudents() {
    return this.studentService.getAllStudents()
  }

  @Post('enroll')
  @ApiOperation({ summary: 'Enroll student in a section' })
  @ApiBody({ type: EnrollSectionDto })
  @ApiResponse({ status: 201, description: 'Enrollment successful.' })
  async enrollInSection(@Body() dto: EnrollSectionDto) {
    return this.studentService.enrollInSection(dto)
  }

  @Delete('enroll')
  @ApiOperation({ summary: 'Remove student enrollment from a section' })
  @ApiBody({ type: RemoveEnrollmentDto })
  @ApiResponse({ status: 200, description: 'Enrollment removed.' })
  async removeEnrollment(@Body() dto: RemoveEnrollmentDto) {
    return this.studentService.removeEnrollment(dto)
  }

  @Get(':studentId/schedule')
  @ApiOperation({ summary: "Get a student's schedule" })
  @ApiParam({ name: 'studentId', type: String })
  @ApiQuery({ name: 'semester', required: false })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: 200, description: "Student's schedule." })
  async getStudentSchedule(
    @Param('studentId') studentId: string,
    @Query('semester') semester?: string,
    @Query('year') year?: string,
  ) {
    const dto: GetStudentScheduleDto = {
      studentId,
      semester,
      year: year ? parseInt(year, 10) : undefined,
    }
    return this.studentService.getStudentSchedule(dto)
  }

  @Get(':studentId/available-sections')
  @ApiOperation({ summary: 'Get available sections for a student' })
  @ApiParam({ name: 'studentId', type: String })
  @ApiQuery({ name: 'semester', required: false })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Available sections.' })
  async getAvailableSections(
    @Param('studentId') studentId: string,
    @Query('semester') semester?: string,
    @Query('year') year?: string,
  ) {
    return this.studentService.getAvailableSections(studentId, semester, year ? parseInt(year, 10) : undefined)
  }

  @Get(':studentId/schedule/pdf')
  @ApiOperation({ summary: "Download student's schedule as PDF" })
  @ApiParam({ name: 'studentId', type: String })
  @ApiQuery({ name: 'semester', required: false })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'PDF file.' })
  async downloadSchedulePdf(
    @Param('studentId') studentId: string,
    @Res() res: Response,
    @Query('semester') semester?: string,
    @Query('year') year?: string,
  ) {
    const dto: GetStudentScheduleDto = {
      studentId,
      semester,
      year: year ? parseInt(year, 10) : undefined,
    }

    const pdfBuffer = await this.studentService.generateSchedulePdf(dto)

    const student = await this.studentService.getStudentById(studentId)
    const filename = `schedule_${student.studentId}_${semester || 'current'}_${year || new Date().getFullYear()}.pdf`

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString(),
    })

    res.end(pdfBuffer)
  }
}
