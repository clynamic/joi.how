import { Pipe } from '../State';
import type { Performer } from '../pipes/Effects';

export type ModuleId = string;

export type ModuleOrdering = {
  loadAfter?: ModuleId[];
  loadBefore?: ModuleId[];
};

export type Module = {
  id: ModuleId;
  sdk?: string;
  ordering?: ModuleOrdering;

  activate?: Pipe;
  beforeUpdate?: Pipe;
  update?: Pipe;
  afterUpdate?: Pipe;
  deactivate?: Pipe;

  effects?: Performer<unknown>[];
};

export type ModuleRegistry = Record<ModuleId, Module>;
