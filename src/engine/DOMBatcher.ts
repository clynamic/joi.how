/**
 * DOM Batching System
 *
 * Intercepts DOM manipulation methods during plugin execution and queues them.
 * All operations are applied at once after all plugin phases complete,
 * preventing multiple DOM reflows within a single frame.
 */

type DOMOperation = {
  type:
    | 'setAttribute'
    | 'removeAttribute'
    | 'appendChild'
    | 'removeChild'
    | 'insertBefore';
  target: Element;
  args: any[];
};

const domOperationQueue: DOMOperation[] = [];
const originalMethods: Map<string, any> = new Map();
let isDOMBatchingActive = false;

/**
 * Start intercepting DOM operations and queue them
 */
export function startDOMBatching(): void {
  if (isDOMBatchingActive) return;
  isDOMBatchingActive = true;
  domOperationQueue.length = 0;

  // Store originals if not already stored
  if (originalMethods.size === 0) {
    originalMethods.set('setAttribute', Element.prototype.setAttribute);
    originalMethods.set('removeAttribute', Element.prototype.removeAttribute);
    originalMethods.set('appendChild', Element.prototype.appendChild);
    originalMethods.set('removeChild', Element.prototype.removeChild);
    originalMethods.set('insertBefore', Element.prototype.insertBefore);
  }

  // Override methods to queue operations
  Element.prototype.setAttribute = function (
    this: Element,
    name: string,
    value: string
  ) {
    domOperationQueue.push({
      type: 'setAttribute',
      target: this,
      args: [name, value],
    });
  };

  Element.prototype.removeAttribute = function (this: Element, name: string) {
    domOperationQueue.push({
      type: 'removeAttribute',
      target: this,
      args: [name],
    });
  };

  Element.prototype.appendChild = function <T extends Node>(
    this: Element,
    child: T
  ): T {
    domOperationQueue.push({
      type: 'appendChild',
      target: this,
      args: [child],
    });
    return child;
  } as any;

  Element.prototype.removeChild = function <T extends Node>(
    this: Element,
    child: T
  ): T {
    domOperationQueue.push({
      type: 'removeChild',
      target: this,
      args: [child],
    });
    return child;
  } as any;

  Element.prototype.insertBefore = function <T extends Node>(
    this: Element,
    newNode: T,
    referenceNode: Node | null
  ): T {
    domOperationQueue.push({
      type: 'insertBefore',
      target: this,
      args: [newNode, referenceNode],
    });
    return newNode;
  } as any;
}

/**
 * Restore original DOM methods
 */
export function stopDOMBatching(): void {
  if (!isDOMBatchingActive) return;
  isDOMBatchingActive = false;

  Element.prototype.setAttribute = originalMethods.get('setAttribute') as any;
  Element.prototype.removeAttribute = originalMethods.get(
    'removeAttribute'
  ) as any;
  Element.prototype.appendChild = originalMethods.get('appendChild') as any;
  Element.prototype.removeChild = originalMethods.get('removeChild') as any;
  Element.prototype.insertBefore = originalMethods.get('insertBefore') as any;
}

/**
 * Apply all queued DOM operations in order, then clear the queue
 */
export function flushDOMOperations(): void {
  for (const op of domOperationQueue) {
    const method = originalMethods.get(op.type);
    if (method) {
      method.apply(op.target, op.args);
    }
  }
  domOperationQueue.length = 0;
}
