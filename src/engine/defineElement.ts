type Finalizable = CustomElementConstructor & {
  observedAttributes?: string[];
  finalize?: () => void;
  elementStyles?: unknown[];
  elementProperties?: Map<PropertyKey, unknown>;
};

type Live = HTMLElement & {
  renderRoot?: ShadowRoot | HTMLElement;
  requestUpdate?: () => void;
};

const finalized = (cls: Finalizable) => {
  void cls.observedAttributes;
  cls.finalize?.();
  return cls;
};

const patch = (current: Finalizable, next: Finalizable) => {
  for (const key of Object.getOwnPropertyNames(next.prototype)) {
    if (key === 'constructor') continue;
    const descriptor = Object.getOwnPropertyDescriptor(next.prototype, key);
    if (descriptor) Object.defineProperty(current.prototype, key, descriptor);
  }
  finalized(next);
  if (next.elementStyles) current.elementStyles = next.elementStyles;
  if (next.elementProperties)
    current.elementProperties = next.elementProperties;
};

const instances = (tag: string, root: ParentNode = document): Live[] => {
  const found: Live[] = [];
  for (const el of root.querySelectorAll('*')) {
    if (el.tagName.toLowerCase() === tag) found.push(el as Live);
    if (el.shadowRoot) found.push(...instances(tag, el.shadowRoot));
  }
  return found;
};

const refresh = (el: Live, cls: Finalizable) => {
  const root = el.renderRoot;
  const sheets = cls.elementStyles?.filter(
    (style): style is CSSStyleSheet => style instanceof CSSStyleSheet
  );
  if (root instanceof ShadowRoot && sheets && 'adoptedStyleSheets' in root) {
    root.adoptedStyleSheets = sheets;
  }
  el.requestUpdate?.();
};

export const defineElement = (
  tag: string,
  cls: CustomElementConstructor
): void => {
  const current = customElements.get(tag) as Finalizable | undefined;
  if (!current) {
    customElements.define(tag, cls);
    return;
  }
  if (current === cls) return;
  patch(current, cls);
  for (const el of instances(tag)) refresh(el, current);
};
