import { Pipe } from '../State';

export type ModuleId = string;

export type ModuleOrdering = {
  loadAfter?: ModuleId[];
  loadBefore?: ModuleId[];
};

export type Module = {
  id: ModuleId;
  name?: string;
  ordering?: ModuleOrdering;

  activate?: Pipe;
  beforeUpdate?: Pipe;
  update?: Pipe;
  afterUpdate?: Pipe;
  deactivate?: Pipe;
};

export type ModuleRegistry = Record<ModuleId, Module>;
