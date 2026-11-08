import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Frames } from '../../engine/Frames';
import Clock, { ClockState } from './clock';
import Pace, { PaceEntry, PaceState } from './pace';
import Dealer from './dice';
import { DiceEvent, DiceEventLabels } from './dice/events';
import { DiceLogEntry, DiceState } from './dice/types';
import { base } from '../../elements/base';

export const TIMELINE_TAG = 'how-joi-classic-timeline';

type Point = { time: number; pace: number; event?: DiceEvent };

const HEIGHT = 160;
const MARGIN = { top: 8, right: 8, bottom: 30, left: 24 };
const X_TICKS = 5;

const findPaceAt = (history: PaceEntry[], time: number): number => {
  let pace = 0;
  for (const entry of history) {
    if (entry.time > time) break;
    pace = entry.pace;
  }
  return pace;
};

const points = (
  history: PaceEntry[] | undefined,
  log: DiceLogEntry[] | undefined,
  total: number
): Point[] => {
  if (!history?.length) return [];
  const eventsByTime = new Map<number, DiceEvent>();
  for (const entry of log ?? []) eventsByTime.set(entry.time, entry.event);
  const result: Point[] = history.map(e => ({
    time: e.time,
    pace: e.pace,
    event: eventsByTime.get(e.time),
  }));
  for (const entry of log ?? []) {
    if (result.some(p => p.time === entry.time)) continue;
    result.push({
      time: entry.time,
      pace: findPaceAt(history, entry.time),
      event: entry.event,
    });
  }
  result.sort((a, b) => a.time - b.time);
  const last = result[result.length - 1];
  if (total > 0 && last.time < total) {
    result.push({ time: total, pace: last.pace });
  }
  return result;
};

@customElement(TIMELINE_TAG)
export class ClassicTimelineElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: block;
        position: relative;
        width: 100%;
        height: ${HEIGHT}px;
      }

      svg {
        display: block;
        width: 100%;
        height: 100%;
        overflow: visible;
      }

      .tick {
        fill: var(--card-color);
        fill-opacity: 0.4;
        font-size: 10px;
      }

      .marker {
        stroke: currentColor;
        stroke-opacity: 0.15;
        stroke-dasharray: 3 3;
      }

      .line {
        fill: none;
        stroke: var(--primary);
        stroke-width: 2;
      }

      .tooltip {
        position: absolute;
        pointer-events: none;
        background: var(--card-background);
        border: 1px solid currentColor;
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 12px;
        line-height: 1.4;
        transform: translate(-50%, calc(-100% - 8px));
        white-space: nowrap;
      }

      .tooltip .time {
        opacity: 0.5;
        margin-bottom: 2px;
      }

      .tooltip .event {
        color: var(--primary);
        margin-top: 2px;
      }
    `,
  ];

  private pace = Frames.watch<PaceState>(this, Pace.paths);
  private dice = Frames.watch<DiceState>(this, Dealer.paths);
  private clock = Frames.watch<ClockState>(this, Clock.paths);

  @state() private accessor width = 0;
  @state() private accessor hovered: Point | null = null;

  private observer = new ResizeObserver(([entry]) => {
    this.width = entry.contentRect.width;
  });

  connectedCallback() {
    super.connectedCallback();
    this.observer.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.observer.disconnect();
  }

  private get total() {
    return this.clock.value?.elapsed ?? 0;
  }

  private get data() {
    return points(this.pace.value?.history, this.dice.value?.log, this.total);
  }

  private scales(data: Point[]) {
    const innerWidth = Math.max(0, this.width - MARGIN.left - MARGIN.right);
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const maxTime = this.total || Math.max(...data.map(p => p.time), 1);
    const maxPace = Math.max(...data.map(p => p.pace), 0) || 1;
    const x = (time: number) => MARGIN.left + (time / maxTime) * innerWidth;
    const y = (pace: number) =>
      MARGIN.top + innerHeight - (pace / maxPace) * innerHeight;
    return { x, y, maxTime, maxPace, innerHeight };
  }

  private onMove(event: PointerEvent, data: Point[]) {
    const rect = this.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const { x } = this.scales(data);
    let nearest: Point | null = null;
    let distance = Infinity;
    for (const point of data) {
      const d = Math.abs(x(point.time) - px);
      if (d < distance) {
        distance = d;
        nearest = point;
      }
    }
    this.hovered = nearest;
  }

  render() {
    const data = this.data;
    const log = this.dice.value?.log;
    if (data.length === 0 && !log?.length) return nothing;
    if (this.width === 0) return html`<svg></svg>`;

    const { x, y, maxTime, maxPace, innerHeight } = this.scales(data);
    const baseline = MARGIN.top + innerHeight;
    const path = data
      .map((p, i) =>
        i === 0 ? `M${x(p.time)},${y(p.pace)}` : `H${x(p.time)}V${y(p.pace)}`
      )
      .join('');
    const xTicks = Array.from(
      { length: X_TICKS },
      (_, i) => (maxTime * i) / (X_TICKS - 1)
    );
    const yTicks = Array.from({ length: X_TICKS }, (_, i) =>
      Number(((maxPace * i) / (X_TICKS - 1)).toFixed(2))
    );
    const hovered = this.hovered;

    return html`
      <svg
        @pointermove=${(e: PointerEvent) => this.onMove(e, data)}
        @pointerleave=${() => (this.hovered = null)}
      >
        ${xTicks.map(
          t => svg`<text class="tick" x=${x(t)} y=${baseline + 18}
            text-anchor="middle">
            ${Clock.format(t)}</text>`
        )}
        ${yTicks.map(
          p => svg`<text class="tick" x=${MARGIN.left - 6} y=${y(p) + 3}
            text-anchor="end">${p}</text>`
        )}
        ${log?.map(
          entry => svg`<line class="marker"
            x1=${x(entry.time)} x2=${x(entry.time)}
            y1=${MARGIN.top} y2=${baseline} />`
        )}
        <path class="line" d=${path} />
      </svg>
      ${hovered
        ? html`<div
            class="tooltip"
            style="left: ${x(hovered.time)}px; top: ${y(hovered.pace)}px"
          >
            <div class="time">${Clock.format(hovered.time)}</div>
            <div>${hovered.pace.toFixed(1)} b/s</div>
            ${hovered.event
              ? html`<div class="event">${DiceEventLabels[hovered.event]}</div>`
              : nothing}
          </div>`
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [TIMELINE_TAG]: ClassicTimelineElement;
  }
}
