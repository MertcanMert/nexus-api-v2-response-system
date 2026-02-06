import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigInfrastructureModule } from './infrastructure/config-infrastructure-module.module';
import { LoggingInfrastructureModuleModule } from './infrastructure/logging-infrastructure-module.module';
import { I18nInfrastructureModule } from './infrastructure/i18n-infrastructure-module.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { RequestMethod } from '@nestjs/common';

@Module({
  imports: [
    ConfigInfrastructureModule,
    LoggingInfrastructureModuleModule,
    I18nInfrastructureModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global Exception Filter (Error Handling)
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes(
        { path: '', method: RequestMethod.ALL },
        { path: '*path', method: RequestMethod.ALL },
      );
  }
}

