import { Composer } from '../engine/Composer';
import { TypedPath } from '../engine/Lens';
import { Pipe } from '../engine/State';
import Storage from '../engine/plugins/Storage';
import {
  Document,
  DocumentKind,
  isDocument,
  mergeSections,
} from '../engine/plugins/Documents';

export type LegacyState = { migrating?: string[] };

export type LegacyFields = Record<string, Record<string, string>>;

export const legacySettings: LegacyFields = {
  settings: {
    highRes: 'how.joi.classic.image',
    videoSound: 'how.joi.classic.image',
    gender: 'how.joi.player',
    body: 'how.joi.player',
  },
  home: { ageCheckConfirm: 'how.joi.home' },
};

export const legacyPresets: LegacyFields = {
  settings: {
    gameDuration: 'how.joi.classic.intensity',
    warmupDuration: 'how.joi.classic.warmup',
    climaxChance: 'how.joi.classic.dice.climax',
    ruinChance: 'how.joi.classic.dice.climax',
    minPace: 'how.joi.classic.pace',
    maxPace: 'how.joi.classic.pace',
    steepness: 'how.joi.classic.pace',
    timeshift: 'how.joi.classic.pace',
    events: 'how.joi.classic.dice',
    hypno: 'how.joi.classic.hypno',
    imageDuration: 'how.joi.classic.random_images',
    intenseImages: 'how.joi.classic.random_images',
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
