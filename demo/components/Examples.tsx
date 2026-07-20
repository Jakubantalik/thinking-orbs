import React from 'react';
import type { OrbState } from '../../src';
import { ThinkingOrb } from '../../src';

const listeningPillClass =
  'inline-flex items-center gap-3.5 h-16 pl-4 pr-8 rounded-full bg-(--mock-chat-bg) shadow-(--mock-chat-shadow) text-(--pill-fg) text-lg leading-6 font-inherit cursor-default';
const chipClass =
  'inline-flex items-center gap-2 h-9 pl-2.5 pr-3.5 rounded-full bg-(--chip-bg) shadow-(--chip-shadow) text-(--chip-color) text-xs leading-[14px] font-inherit cursor-default';

const CHIP_STATES: OrbState[] = ['working', 'solving', 'composing', 'shaping'];

export function Examples({
  speed = 1,
}: {
  /** Forwarded to every <ThinkingOrb speed={...}/> so the Playground's
   *  speed slider drives these hero examples too. */
  speed?: number;
}) {
  return (
    <section className="w-full flex flex-col gap-3 mb-12" aria-label="Component demonstrations">
      {/* Listening pill mock */}
      <div className="relative w-full h-[314px] rounded-[30px] bg-(--surface) flex items-center justify-center px-10 py-12 overflow-hidden max-sm:h-auto max-sm:min-h-[200px] max-sm:px-5 max-sm:py-8 max-sm:rounded-[20px]">
        <div className={listeningPillClass}>
          <ThinkingOrb state="listening" size={64} speed={speed} style={{ width: 40, height: 40 }} />
          <span className="opacity-80">Listening&hellip;.</span>
        </div>
      </div>

      {/* 2×2 grid of agent chips */}
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        {CHIP_STATES.map((state) => (
          <div
            key={state}
            className="relative w-full h-[142px] rounded-[30px] bg-(--surface) flex items-center justify-center px-8 py-8 overflow-hidden max-sm:rounded-[20px]"
          >
            <div className={chipClass}>
              <ThinkingOrb state={state} size={20} speed={speed} />
              <span>Agent thinking&hellip;</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
