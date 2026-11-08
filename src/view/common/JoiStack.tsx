import React from 'react';
import { createComponent } from '@lit/react';
import { JoiStackElement } from '../../elements/JoiStack';
export type {
  JoiStackDirection,
  JoiStackJustifyContent,
  JoiStackAlignItems,
} from '../../elements/JoiStack';

export const JoiStack = createComponent({
  tagName: 'joi-stack',
  elementClass: JoiStackElement,
  react: React,
});
