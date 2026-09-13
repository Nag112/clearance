import type { CompressInput } from "./types";
import type { Processor } from "./processor";

export class ProcessorRegistry {
  private readonly processors: Processor[] = [];

  register(processor: Processor): void {
    this.processors.push(processor);
  }

  match(input: CompressInput): Processor | undefined {
    return this.processors.find((processor) => processor.canHandle(input));
  }

  findByName(name: string): Processor | undefined {
    return this.processors.find((p) => p.name === name);
  }

  list(): readonly Processor[] {
    return this.processors;
  }
}
