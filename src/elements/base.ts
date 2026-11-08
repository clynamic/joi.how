import { unsafeCSS } from 'lit';
import nativeCss from '@awesome.me/webawesome/dist/styles/native.css?inline';
import overridesCss from './overrides.css?inline';

export const native = unsafeCSS(nativeCss);

export const overrides = unsafeCSS(overridesCss);

export const base = [native, overrides];
