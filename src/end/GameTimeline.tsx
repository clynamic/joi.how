import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  TooltipProps,
} from 'recharts';
import { useGameFrame } from '../game/hooks';
import Pace, { type PaceEntry } from '../game/plugins/pace';
import Dealer from '../game/plugins/dealer';
import Clock from '../game/plugins/clock';
import { DiceEventLabels, type DiceEvent } from '../types';
import type { DiceLogEntry } from '../game/plugins/dice/types';
import { formatTime } from '../utils';

type DataPoint = {
  time: number;
  pace: number;
  event?: DiceEvent;
};

const GraphTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const point: DataPoint = payload[0].payload;

  return (
    <div
      style={{
        background: 'var(--card-background)',
        border: '1px solid currentColor',
        borderRadius: 6,
        padding: '6px 10px',
        fontSize: 12,
      }}
    >
      <div style={{ opacity: 0.5, marginBottom: 2 }}>
        {formatTime(point.time)}
      </div>
      <div>{point.pace.toFixed(1)} b/s</div>
      {point.event && (
        <div style={{ color: 'var(--primary)', marginTop: 2 }}>
          {DiceEventLabels[point.event]}
        </div>
      )}
    </div>
  );
};

export const GameTimeline = () => {
  const paceState = useGameFrame(Pace.paths) as
    | { history?: PaceEntry[] }
    | undefined;
  const diceState = useGameFrame(Dealer.paths) as
    | { log?: DiceLogEntry[] }
    | undefined;
  const clockState = useGameFrame(Clock.paths) as
    | { elapsed?: number }
    | undefined;

  const totalTime =
    typeof clockState?.elapsed === 'number' ? clockState.elapsed : 0;

  const history = paceState?.history;
  const log = diceState?.log;

  const data = useMemo(() => {
    if (!history?.length) return [];

    const eventsByTime = new Map<number, DiceEvent>();
    if (log) {
      for (const entry of log) {
        eventsByTime.set(entry.time, entry.event);
      }
    }

    const points: DataPoint[] = history.map(e => ({
      time: e.time,
      pace: e.pace,
      event: eventsByTime.get(e.time),
    }));

    if (log) {
      for (const entry of log) {
        if (!points.some(p => p.time === entry.time)) {
          const pace = findPaceAt(history, entry.time);
          points.push({ time: entry.time, pace, event: entry.event });
        }
      }
    }

    points.sort((a, b) => a.time - b.time);

    const last = points[points.length - 1];
    if (totalTime > 0 && last.time < totalTime) {
      points.push({ time: totalTime, pace: last.pace });
    }

    return points;
  }, [history, log, totalTime]);

  if (data.length === 0 && !log?.length) return null;

  return (
    <ResponsiveContainer width='100%' height={160}>
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
      >
        <XAxis
          dataKey='time'
          type='number'
          domain={[0, totalTime || 'auto']}
          tickFormatter={formatTime}
          tick={{ fill: 'var(--card-color)', fillOpacity: 0.4, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey='pace'
          tick={{ fill: 'var(--card-color)', fillOpacity: 0.4, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<GraphTooltip />} />
        {log?.map((entry, i) => (
          <ReferenceLine
            key={i}
            x={entry.time}
            stroke='currentColor'
            strokeOpacity={0.15}
            strokeDasharray='3 3'
          />
        ))}
        <Line
          type='stepAfter'
          dataKey='pace'
          stroke='var(--primary)'
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

function findPaceAt(history: PaceEntry[], time: number): number {
  let pace = 0;
  for (const entry of history) {
    if (entry.time > time) break;
    pace = entry.pace;
  }
  return pace;
}
