import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/config/winston.config';
import { I18nValidationPipe } from 'nestjs-i18n';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Implement winston Logger Settings
    logger: WinstonModule.createLogger(winstonConfig),
  });

  // Config service variables
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('PORT');
  const globalPrefix = configService.getOrThrow<string>('GLOBAL_PREFIX');

  // Set Global Prefix
  app.setGlobalPrefix(globalPrefix);

  // Enbale Versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // HTTP Logging Interceptor
  app.useGlobalInterceptors(new HttpLoggingInterceptor());

  // Global Validation Pipe for i18n
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Start Server !
  await app.listen(port);
}
bootstrap().catch((e) => console.log(`Application failed to start: ${e}`));
