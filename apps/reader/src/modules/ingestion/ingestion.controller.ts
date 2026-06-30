import { Controller, Get } from '@nestjs/common';
import { IngestionService } from './ingestion.service';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly _service: IngestionService) {}

  @Get()
  async initialize(): Promise<void> {
    await this._service.initialize();
  }
}
