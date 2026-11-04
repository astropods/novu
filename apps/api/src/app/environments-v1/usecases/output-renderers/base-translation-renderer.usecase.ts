import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { LayoutDto, PinoLogger } from '@novu/application-generic';
import { LocalizationResourceEnum, NotificationTemplateEntity, OrganizationEntity } from '@novu/dal';
import { FullPayloadForRender } from './render-command';

type TranslationContext = {
  i18nInstance: unknown;
  liquidEngine: unknown;
  locale: string;
  resourceId: string;
};

type TranslationTarget = {
  variables: FullPayloadForRender;
  environmentId: string;
  organizationId: string;
  resourceId?: string;
  resourceType?: LocalizationResourceEnum;
  locale?: string;
  organization?: OrganizationEntity;
};

/** Translation ships only in Novu's enterprise build, so every method returns its input unchanged. */
@Injectable()
export abstract class BaseTranslationRendererUsecase {
  constructor(
    protected moduleRef: ModuleRef,
    protected logger: PinoLogger
  ) {}

  protected async processTranslations({
    controls,
  }: TranslationTarget & {
    controls: Record<string, unknown>;
    resourceEntity?: NotificationTemplateEntity | LayoutDto;
  }): Promise<Record<string, unknown>> {
    return controls;
  }

  protected async processStringTranslations({ content }: TranslationTarget & { content: string }): Promise<string> {
    return content;
  }

  protected async createTranslationContext(
    _target: Omit<TranslationTarget, 'variables'> & { resourceEntity?: NotificationTemplateEntity | LayoutDto }
  ): Promise<TranslationContext | null> {
    return null;
  }

  protected async processStringWithContext({
    content,
  }: {
    context: TranslationContext | null;
    content: string;
    variables: FullPayloadForRender;
  }): Promise<string> {
    return content;
  }
}
