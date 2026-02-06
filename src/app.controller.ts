import {
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AppService } from './app.service';
import { I18nService } from 'nestjs-i18n';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(
    private readonly appService: AppService,
    private readonly i18n: I18nService,
  ) {}

  @Get()
  getHello(): object {
    return {
      message: `${this.i18n.t('common.HELLO')}`,
      password: "123456789",
      jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNzM4ODQyMzM0LCJleHAiOjE3Mzg4NDU5MzR9.123456789"
    };
  }

  @Get('test')
  testError() {
    throw new InternalServerErrorException(
      this.i18n.t('common.ERROR.BAD_REQUEST'),
    );
  }
}
