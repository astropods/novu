import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { FeatureFlagsService, PinoLogger } from '@novu/application-generic';
import { OrganizationRepository } from '@novu/dal';
import { BrandEnrichmentStatus, FeatureFlagsKeysEnum, IBrandEnrichment, OnboardingWorkflowsStatus } from '@novu/shared';
import { captureException } from '@sentry/node';
import { BrandData, BrandRetrievalService } from './brand-retrieval.service';
import { EnrichOrganizationBrandCommand } from './enrich-organization-brand.command';

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'mail.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'yandex.com',
  'live.com',
  'msn.com',
  'me.com',
  'gmx.com',
  'inbox.com',
  '163.com',
  'qq.com',
  'mail.ru',
  'emailsink.dev',
]);

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'minitts.net',
  'azsc.us',
  'emaildisruptor.com',
  'skymail.ink',
  'tutamail.com',
  'kksk.uk',
  'gtempaccount.com',
  'privaterelay.appleid.com',
]);

function isBlockedOrganizationDomain(domain: string): boolean {
  const normalized = domain.toLowerCase();
  if (FREE_EMAIL_DOMAINS.has(normalized) || DISPOSABLE_EMAIL_DOMAINS.has(normalized)) {
    return true;
  }

  // Block country-coded .edu domains like foo.edu.au, bar.edu.br.
  // Top-level .edu (e.g., mit.edu) is intentionally not blocked.
  const labels = normalized.split('.');
  const eduIdx = labels.indexOf('edu');

  return eduIdx > 0 && eduIdx < labels.length - 1;
}

@Injectable()
export class EnrichOrganizationBrand {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly featureFlagsService: FeatureFlagsService,
    private readonly brandRetrievalService: BrandRetrievalService,
    private readonly moduleRef: ModuleRef,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async execute(command: EnrichOrganizationBrandCommand): Promise<void> {
    const isEnabled = await this.featureFlagsService.getFlag({
      key: FeatureFlagsKeysEnum.IS_AI_WORKFLOW_GENERATION_ENABLED,
      defaultValue: false,
      organization: { _id: command.user.organizationId },
    });

    if (!isEnabled) return;

    const domain = this.extractDomain(command.domain);
    if (!domain || isBlockedOrganizationDomain(domain)) {
      await this.organizationRepository.update(
        { _id: command.user.organizationId },
        {
          $set: {
            'brandEnrichment.status': 'not_available' as BrandEnrichmentStatus,
            onboardingWorkflowsStatus: 'skipped' as OnboardingWorkflowsStatus,
          },
        }
      );

      return;
    }

    try {
      await this.organizationRepository.update(
        { _id: command.user.organizationId },
        { $set: { 'brandEnrichment.status': 'pending' as BrandEnrichmentStatus } }
      );

      const brandData = await this.brandRetrievalService.retrieveBrand(domain);

      const hasBrandData =
        !!brandData.companyTitle ||
        !!brandData.companyDescription ||
        !!brandData.logos?.length ||
        !!brandData.colors?.length ||
        !!brandData.industry?.length;
      if (!hasBrandData) {
        await this.organizationRepository.update(
          { _id: command.user.organizationId },
          {
            $set: {
              'brandEnrichment.status': 'not_available' as BrandEnrichmentStatus,
              onboardingWorkflowsStatus: 'skipped' as OnboardingWorkflowsStatus,
            },
          }
        );
        return;
      }

      const enrichment: IBrandEnrichment = {
        companyTitle: brandData.companyTitle,
        companyDescription: brandData.companyDescription,
        logos: brandData.logos,
        colors: brandData.colors,
        status: 'completed' as BrandEnrichmentStatus,
        enrichedAt: new Date().toISOString(),
      };

      if (!brandData.industry?.length) {
        await this.organizationRepository.update(
          { _id: command.user.organizationId },
          {
            $set: {
              brandEnrichment: enrichment,
              onboardingWorkflowsStatus: 'skipped' as OnboardingWorkflowsStatus,
            },
          }
        );

        return;
      }

      enrichment.industry = brandData.industry;

      await this.organizationRepository.update(
        { _id: command.user.organizationId },
        {
          $set: {
            brandEnrichment: enrichment,
            onboardingWorkflowsStatus: 'skipped' as OnboardingWorkflowsStatus,
          },
        }
      );
    } catch (error) {
      this.logger.error(error, 'Failed to enrich organization brand');
      captureException(error, {
        tags: { feature: 'brand-enrichment' },
        extra: { organizationId: command.user.organizationId, domain },
      });

      await this.organizationRepository.update(
        { _id: command.user.organizationId },
        {
          $set: {
            'brandEnrichment.status': 'failed' as BrandEnrichmentStatus,
            onboardingWorkflowsStatus: 'skipped' as OnboardingWorkflowsStatus,
          },
        }
      );
    }
  }

  private extractDomain(input: string): string | null {
    const cleaned = input
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .trim();
    if (!cleaned || !cleaned.includes('.')) return null;

    return cleaned;
  }
}
