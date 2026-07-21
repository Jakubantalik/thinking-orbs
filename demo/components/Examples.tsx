import React from 'react';
import type { OrbState } from '../../src';
import { ThinkingOrb } from '../../src';

const listeningPillClass =
  'inline-flex items-center gap-3 w-[270px] h-[74px] pl-[9px] pr-8 rounded-full bg-(--pill-fill) shadow-(--pill-stroke) text-(--pill-fg) text-lg leading-6 font-inherit cursor-default';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const chipClass =
  'inline-flex items-center gap-2 h-9 pl-2 pr-3.5 rounded-full bg-(--pill-fill) shadow-(--pill-stroke) text-(--pill-fg) text-xs leading-[14px] font-inherit cursor-default';

const CHIP_STATES: OrbState[] = ['listening', 'working', 'searching', 'shaping'];

// Chip states that render as full large pills (the rest stay compact).
const LARGE_CHIPS = new Set<OrbState>(['working', 'searching']);

const HERO_PILLS: Array<{ state: OrbState; label: string }> = [
  { state: 'solving', label: 'Solving….' },
  { state: 'composing', label: 'Thinking….' },
];

export function Examples({
  speed = 1,
  debug = false,
  bigChips = false,
}: {
  /** Forwarded to every <ThinkingOrb speed={...}/> so the Playground's
   *  speed slider drives these hero examples too. */
  speed?: number;
  /** Dev-only: strip the gray surface fill behind the hero boxes. */
  debug?: boolean;
  /** Dev-only: render the small chips as large pills. */
  bigChips?: boolean;
}) {
  const surface = debug ? 'bg-transparent' : 'bg-(--hero-surface)';
  return (
    <section className="w-full flex flex-col gap-3 mb-12" aria-label="Component demonstrations">
      {/* Two hero pill mocks, side by side */}
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        {HERO_PILLS.map(({ state, label }) => (
          <div
            key={state}
            className={`relative w-full h-[314px] rounded-[30px] ${surface} flex items-center justify-center px-10 py-12 overflow-hidden max-sm:h-auto max-sm:min-h-[200px] max-sm:px-5 max-sm:py-8 max-sm:rounded-[20px]`}
          >
            <div className={listeningPillClass}>
              <ThinkingOrb state={state} size={64} speed={speed} style={{ width: 56, height: 56 }} />
              <span className="t-shimmer" data-text={label}>{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Masonry columns so the mixed-height boxes (large pills full-height,
          small chips half-height) tile with no leftover gaps. */}
      <div className="columns-2 gap-3 max-sm:columns-1">
        {CHIP_STATES.map((state) => {
          const large = bigChips || LARGE_CHIPS.has(state);
          const label = large ? `${cap(state)}….` : `Agent ${state}…`;
          return (
          <div
            key={state}
            className={`relative w-full ${large ? 'h-[314px]' : 'h-[157px]'} mb-3 break-inside-avoid rounded-[30px] ${surface} flex items-center justify-center px-8 py-8 overflow-hidden max-sm:h-auto max-sm:min-h-[200px] max-sm:rounded-[20px]`}
          >
            <div className={large ? listeningPillClass : chipClass}>
              {large ? (
                <ThinkingOrb state={state} size={64} speed={speed} style={{ width: 56, height: 56 }} />
              ) : (
                <ThinkingOrb state={state} size={20} speed={speed} />
              )}
              <span className="t-shimmer" data-text={label}>{label}</span>
            </div>
          </div>
          );
        })}
      </div>
    </section>
  );
}
