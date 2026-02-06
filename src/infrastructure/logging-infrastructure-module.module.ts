import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from 'src/common/config/winston.config';

@Module({
  imports: [
    // Imported Winston Module as global
    WinstonModule.forRoot(winstonConfig),
  ],
})
export class LoggingInfrastructureModuleModule {}
