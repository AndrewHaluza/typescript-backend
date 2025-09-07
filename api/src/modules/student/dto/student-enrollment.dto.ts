import { IsOptional, IsString, IsUUID } from 'class-validator'

export class EnrollSectionDto {
  @IsUUID()
  studentId: string

  @IsUUID()
  sectionId: string
}

export class RemoveEnrollmentDto {
  @IsUUID()
  studentId: string

  @IsUUID()
  sectionId: string
}

export class GetStudentScheduleDto {
  @IsUUID()
  studentId: string

  @IsOptional()
  @IsString()
  semester?: string

  @IsOptional()
  year?: number
}
