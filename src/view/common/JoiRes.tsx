import React from 'react';
import { createComponent, type EventName } from '@lit/react';
import { JoiResElement } from '../../elements/JoiRes';
export { JoiResElement };

export const JoiRes = createComponent({
  tagName: 'joi-res',
  elementClass: JoiResElement,
  react: React,
  events: {
    onLoad: 'load' as EventName<CustomEvent<Event>>,
    onError: 'error' as EventName<CustomEvent<Event>>,
    onLoadedmetadata: 'loadedmetadata' as EventName<CustomEvent<Event>>,
  },
});
