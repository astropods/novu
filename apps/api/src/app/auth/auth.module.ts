import { Global, MiddlewareConsumer, Module } from '@nestjs/common';
import { configure, getCommunityAuthModuleConfig } from './community.auth.module.config';

@Global()
@Module(getCommunityAuthModuleConfig())
export class AuthModule {
  public configure(consumer: MiddlewareConsumer) {
    configure(consumer);
  }
}
