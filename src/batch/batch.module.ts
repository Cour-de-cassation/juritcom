import { Module } from '@nestjs/common'
import { BatchService } from './batch.service'
import { ScheduleModule } from '@nestjs/schedule'

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [BatchService],
  exports: [BatchService]
})
export class BatchModule {}
