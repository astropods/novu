import { forwardRef, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { isBetterAuthEnabled, isClerkEnabled } from '@novu/shared';
import { AuthModule } from '../auth/auth.module';
import { EnvironmentsModuleV1 } from '../environments-v1/environments-v1.module';
import { IntegrationModule } from '../integrations/integrations.module';
import { LayoutsV2Module } from '../layouts-v2/layouts.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';
import { EEOrganizationController } from './ee.organization.controller';
import { OrganizationController } from './organization.controller';
import { USE_CASES } from './usecases';

function getControllers() {
  if (isClerkEnabled() || isBetterAuthEnabled()) {
    return [EEOrganizationController];
  }

  return [OrganizationController];
}

@Module({
  imports: [
    SharedModule,
    UserModule,
    EnvironmentsModuleV1,
    IntegrationModule,
    forwardRef(() => AuthModule),
    LayoutsV2Module,
  ],
  controllers: [...getControllers()],
  providers: [...USE_CASES],
  exports: [...USE_CASES],
})
export class OrganizationModule implements NestModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    if (process.env.NOVU_ENTERPRISE !== 'true' && process.env.CI_EE_TEST !== 'true') {
      consumer.apply(AuthGuard).exclude({
        method: RequestMethod.GET,
        path: '/organizations/invite/:inviteToken',
      });
    }
  }
}
