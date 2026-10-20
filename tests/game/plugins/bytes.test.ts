import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import '../../../src/game/plugins/bytes';
import { sdk } from '../../../src/engine/sdk';

describe('Bytes', () => {
  it('should offer the byte store to mods', async () => {
    const blob = new Blob(['mod file'], { type: 'text/plain' });

    await sdk.Bytes.for('me.mod').put('track', blob);

    expect(await sdk.Bytes.for('me.mod').keys()).toEqual(['track']);
  });
});
