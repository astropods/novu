import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { BEARER_SWAGGER_SECURITY_NAME } from '@novu/application-generic';
import { CommunityUserAuthGuard } from './community.user.auth.guard';

export function RequireAuthentication() {
  return applyDecorators(UseGuards(CommunityUserAuthGuard), ApiBearerAuth(BEARER_SWAGGER_SECURITY_NAME));
}
