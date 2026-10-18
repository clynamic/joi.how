import { Composer } from '../../engine/Composer';
import { TypedPath } from '../../engine/Lens';
import { Pipe } from '../../engine/State';
import Storage from '../../engine/plugins/Storage';
import { Document, DocumentKind, isDocument, mergeSections } from './documents';

export type LegacyState = { migrating?: string[] };

export type LegacyFields = Record<string, Record<string, string>>;

export const legacySettings: LegacyFields = {
  settings: {
    highRes: 'core.images',
    videoSound: 'core.images',
    gender: 'core.player',
    body: 'core.player',
  },
  home: { ageCheckConfirm: 'core.home' },
};

export const legacyPresets: LegacyFields = {
  settings: {
    gameDuration: 'core.intensity',
    warmupDuration: 'core.warmup',
    climaxChance: 'core.dice.climax',
    ruinChance: 'core.dice.climax',
    minPace: 'core.pace',
    maxPace: 'core.pace',
    steepness: 'core.pace',
    timeshift: 'core.pace',
    events: 'core.dice',
    hypno: 'core.hypno',
    imageDuration: 'core.random_images',
    intenseImages: 'core.random_images',
  },
};

const sections = (
  value: Document,
  plugins: Record<string, string>
): Document => {
  const document: Document = {};
  for (const [field, plugin] of Object.entries(plugins)) {
    if (!(field in value)) continue;
    const section = (document[plugin] ?? {}) as Document;
    document[plugin] = { ...section, [field]: value[field] };
  }
  return document;
};

export const legacyDocument = (
  documents: DocumentKind,
  paths: TypedPath<LegacyState>,
  fields: LegacyFields
) => {
  const keys = Object.keys(fields);
  return {
    start: (): Pipe =>
      Composer.pipe(
        Composer.set(paths.migrating, keys),
        ...keys.map(key => Storage.read(key))
      ),

    update: Composer.pipe(
      ...keys.map(key =>
        Storage.onRead(key, value =>
          Composer.do(({ get, set, pipe }) => {
            const migrating = get(paths.migrating);
            if (!migrating?.includes(key)) return;
            const remaining = migrating.filter(k => k !== key);
            set(paths.migrating, remaining.length ? remaining : undefined);
            if (isDocument(value)) {
              set(
                documents.paths.document,
                mergeSections(
                  sections(value, fields[key]),
                  get(documents.paths.document) ?? {}
                )
              );
              pipe(Storage.remove(key));
            }
            if (remaining.length === 0) {
              pipe(
                documents.land(get(documents.paths.document) ?? {}),
                documents.persist()
              );
            }
          })
        )
      )
    ),
  };
};
