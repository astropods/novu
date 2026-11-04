import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InstrumentUsecase } from '@novu/application-generic';
import { GenerateManagedAgentCommand } from './generate-managed-agent.command';

export type GeneratedManagedAgentResult = {
  name: string;
  identifier: string;
  description: string;
  systemPrompt: string;
  tools: string[];
  mcpServers: string[];
  skills: Array<{ skillId: string }>;
};

/** Agent generation needs Novu's enterprise LLM service, so this build always refuses it. */
@Injectable()
export class GenerateManagedAgent {
  @InstrumentUsecase()
  async execute(_command: GenerateManagedAgentCommand): Promise<GeneratedManagedAgentResult> {
    throw new ServiceUnavailableException('Managed agent generation is unavailable in this deployment');
  }
}
