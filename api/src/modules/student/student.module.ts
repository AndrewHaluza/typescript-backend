import { Module } from '@nestjs/common'

import { PrismaModule } from '../../prisma/prisma.module'
import { PdfService } from './pdf.service'
import { StudentController } from './student.controller'
import { StudentService } from './student.service'

@Module({
  imports: [PrismaModule],
  controllers: [StudentController],
  providers: [StudentService, PdfService],
  exports: [StudentService],
})
export class StudentModule {}
