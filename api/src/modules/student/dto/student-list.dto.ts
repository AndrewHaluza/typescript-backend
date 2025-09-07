import { ApiProperty } from '@nestjs/swagger'

export class StudentListDto {
  @ApiProperty({ example: 'b54ea860-d91b-4eeb-8fec-e7c4ed04526e' })
  id: string

  @ApiProperty({ example: 'STU003' })
  studentId: string

  @ApiProperty({ example: 'Carol' })
  firstName: string

  @ApiProperty({ example: 'Davis' })
  lastName: string

  @ApiProperty({ example: 'carol.davis@student.university.edu' })
  email: string

  @ApiProperty({ example: '2025-09-07T11:25:05.501Z', type: String })
  createdAt: Date
}
