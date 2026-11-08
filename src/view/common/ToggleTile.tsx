import React from 'react';
import { createComponent, type EventName } from '@lit/react';
import { JoiToggleTileElement } from '../../elements/JoiToggleTile';
export type { JoiToggleTileType } from '../../elements/JoiToggleTile';

export const JoiToggleTile = createComponent({
  tagName: 'joi-toggle-tile',
  elementClass: JoiToggleTileElement,
  react: React,
  events: {
    onChange: 'change' as EventName<CustomEvent<{ value: boolean }>>,
  },
});
