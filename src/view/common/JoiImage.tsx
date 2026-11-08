import React from 'react';
import { createComponent, type EventName } from '@lit/react';
import { JoiImageElement } from '../../elements/JoiImage';
export { JoiImageElement };

export const JoiImage = createComponent({
  tagName: 'joi-image',
  elementClass: JoiImageElement,
  react: React,
  events: {
    onReady: 'ready' as EventName<
      CustomEvent<{ stage: 'thumb' | 'preview' | 'full' }>
    >,
    onThumbready: 'thumbready' as EventName<Event>,
    onPreviewready: 'previewready' as EventName<Event>,
    onFullready: 'fullready' as EventName<Event>,
  },
});
