import { describe, it, expect } from 'vitest';
import { LitElement, html } from 'lit';
import { defineElement } from '../../src/engine/defineElement';

const text = (el: Element) =>
  el.shadowRoot?.textContent?.replace(/\s+/g, ' ').trim();

describe('defineElement', () => {
  it('should register a tag once and leave it in place on a repeated define', () => {
    class First extends LitElement {
      render() {
        return html`<p>first</p>`;
      }
    }
    defineElement('test-element-once', First);
    expect(() => defineElement('test-element-once', First)).not.toThrow();
    expect(customElements.get('test-element-once')).toBe(First);
  });

  it('should swap the render of live instances when a new class takes the tag', async () => {
    class First extends LitElement {
      render() {
        return html`<p>first</p>`;
      }
    }
    class Second extends LitElement {
      render() {
        return html`<p>second</p>`;
      }
    }
    defineElement('test-element-swap', First);
    const el = document.createElement('test-element-swap') as LitElement;
    document.body.append(el);
    await el.updateComplete;
    expect(text(el)).toBe('first');

    defineElement('test-element-swap', Second);
    await el.updateComplete;
    expect(text(el)).toBe('second');

    const later = document.createElement('test-element-swap') as LitElement;
    document.body.append(later);
    await later.updateComplete;
    expect(text(later)).toBe('second');
  });

  it('should reach instances inside other shadow roots', async () => {
    class Inner extends LitElement {
      render() {
        return html`<p>old</p>`;
      }
    }
    class Replacement extends LitElement {
      render() {
        return html`<p>new</p>`;
      }
    }
    class Host extends LitElement {
      render() {
        return html`<test-element-inner></test-element-inner>`;
      }
    }
    defineElement('test-element-inner', Inner);
    defineElement('test-element-host', Host);
    const host = document.createElement('test-element-host') as LitElement;
    document.body.append(host);
    await host.updateComplete;
    const inner = host.shadowRoot!.querySelector(
      'test-element-inner'
    ) as LitElement;
    await inner.updateComplete;
    expect(text(inner)).toBe('old');

    defineElement('test-element-inner', Replacement);
    await inner.updateComplete;
    expect(text(inner)).toBe('new');
  });
});
