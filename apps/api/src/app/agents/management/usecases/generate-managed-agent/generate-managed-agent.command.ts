import { BaseCommand } from '@novu/application-generic';
import type { AgentRuntime, UserSessionData } from '@novu/shared';
import { IsDefined, IsIn, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const AGENT_RUNTIMES = ['managed', 'self-hosted'] as const satisfies readonly AgentRuntime[];

export class GenerateManagedAgentCommand extends BaseCommand {
  @IsDefined()
  @IsObject()
  user: UserSessionData;

  @IsDefined()
  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  prompt: string;

  /**
   * Target runtime for the generated agent. `managed` (default) populates Claude
   * tools/MCPs/skills from the catalog; `self-hosted` returns only name, identifier and
   * systemPrompt so the caller can wire up their own runtime.
   */
  @IsOptional()
  @IsString()
  @IsIn(AGENT_RUNTIMES)
  runtime?: AgentRuntime;

  /**
   * Request-scoped abort signal.
   *
   * Intentionally undecorated: any class-validator/class-transformer decorator would
   * cause TypeScript to emit `design:type = AbortSignal`, and `BaseCommand.create`
   * (which runs the payload through `plainToInstance`) would then attempt
   * `new AbortSignal()` — which throws `ERR_ILLEGAL_CONSTRUCTOR`. The controller
   * assigns this field directly on the command instance after `create(...)`.
   */
  signal?: AbortSignal;

  clientIp?: string;
}
