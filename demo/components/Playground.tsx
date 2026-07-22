import React, { useState } from 'react';
import type { OrbSize, OrbState } from '../../src';
import { ThinkingOrb } from '../../src';
import { cn } from '../lib/utils';
import { CopyButton } from './CopyButton';
import { PlayPauseToggle } from './PlayPauseToggle';

const STATES: OrbState[] = ['working', 'searching', 'solving', 'listening', 'composing', 'shaping'];
const SIZES: OrbSize[] = [64, 20];
const COLORS: ReadonlyArray<{ label: string; value?: string }> = [
  { label: 'Theme default' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Sky', value: '#0ea5e9' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amber', value: '#f59e0b' },
];

const SPEED_MIN = 25;
const SPEED_MAX = 300;

function buildSnippet(state: OrbState, size: OrbSize, speed: number, color?: string) {
  const props = [`state="${state}"`, `size={${size}}`];
  if (color) props.push(`color="${color}"`);
  if (speed !== 100) props.push(`speed={${(speed / 100).toFixed(2)}}`);
  return `import { ThinkingOrb } from 'thinking-orbs';\n\n<ThinkingOrb ${props.join(' ')} />`;
}

const tabBtnBase = 'flex items-center justify-center h-9 px-3 border-none rounded-lg font-[Inter,sans-serif] text-[13px] font-normal leading-[14px] cursor-pointer transition-[background-color,color] duration-150 whitespace-nowrap [-webkit-tap-highlight-color:transparent] hover:bg-(--tab-hover-bg) hover:text-(--tab-hover-color) focus-visible:outline-2 focus-visible:outline-[rgba(255,255,255,0.5)] focus-visible:outline-offset-2';

function TabBtn({ active, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button
      {...props}
      className={cn(
        tabBtnBase,
        active
          ? 'bg-(--tab-active-bg) text-(--tab-active-color) shadow-(--tab-active-shadow)'
          : 'bg-(--tab-bg) text-(--tab-color)',
      )}
      type="button"
    />
  );
}

export function Playground({
  speed,
  onSpeedChange,
}: {
  /** Speed as percent (25..300), lifted to App so it also drives the hero examples. */
  speed: number;
  onSpeedChange: (value: number) => void;
}) {
  const [state, setState] = useState<OrbState>('listening');
  const [size, setSize] = useState<OrbSize>(64);
  const [color, setColor] = useState<string | undefined>();
  // Playground starts paused so the page loads quietly; the PlayPauseToggle
  // below only flips this local state, so the surrounding Examples keep
  // auto-playing regardless.
  const [paused, setPaused] = useState(true);

  const snippet = buildSnippet(state, size, speed, color);
  const fillPct = ((speed - SPEED_MIN) / (SPEED_MAX - SPEED_MIN)) * 100;

  return (
    <section className="w-full flex flex-col gap-1.5 mb-12" aria-label="Interactive playground">
      <h2 className="text-base font-normal leading-[34px] text-(--section-title-color)">Playground</h2>

      <div className="flex flex-col gap-4 bg-(--panel-bg) rounded-[10px] p-4">
        <div className="flex items-end gap-6 max-sm:flex-col max-sm:items-stretch max-sm:gap-4">
          <div className="flex flex-col gap-[9px] min-w-0" role="radiogroup" aria-label="Orb state">
            <span className="text-xs font-normal leading-[14px] text-(--text-muted)">State</span>
            <div className="flex gap-2 items-center flex-wrap">
              {STATES.map((s) => (
                <TabBtn key={s} active={state === s} onClick={() => setState(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </TabBtn>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-end gap-6 max-sm:flex-col max-sm:items-stretch max-sm:gap-4">
          <div className="flex flex-col gap-[9px] min-w-0" role="radiogroup" aria-label="Orb size">
            <span className="text-xs font-normal leading-[14px] text-(--text-muted)">Size</span>
            <div className="flex gap-2 items-center">
              {SIZES.map((s) => (
                <TabBtn key={s} active={size === s} onClick={() => setSize(s)}>
                  {s}px
                </TabBtn>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[9px] min-w-[100px] w-[140px] max-sm:w-full">
            <span className="text-xs font-normal leading-[14px] text-(--text-muted)">Speed</span>
            <div className="strength-track relative w-full h-9 rounded-lg bg-(--strength-bg) shadow-(--strength-shadow) overflow-hidden cursor-grab active:cursor-grabbing hover:bg-(--strength-hover)">
              <div className="absolute top-0 left-0 bottom-0 rounded-lg bg-(--strength-fill-bg) shadow-(--strength-shadow) transition-[width] duration-[80ms] ease-out pointer-events-none" style={{ width: `${fillPct}%` }} />
              <span className="absolute top-0 left-[11px] h-full flex items-center text-[11px] font-normal leading-[14px] text-(--text-muted) whitespace-nowrap pointer-events-none z-[1]">{(speed / 100).toFixed(2)}×</span>
              <input
                className="strength-input appearance-none absolute inset-0 w-full h-full m-0 p-0 bg-transparent cursor-grab opacity-0 z-[2] active:cursor-grabbing"
                type="range"
                min={SPEED_MIN}
                max={SPEED_MAX}
                step={5}
                value={speed}
                onChange={(e) => onSpeedChange(Number(e.target.value))}
                aria-label="Animation speed"
              />
            </div>
          </div>

          <div className="flex flex-col gap-[9px] min-w-0" role="group" aria-label="Orb color">
            <span className="text-xs font-normal leading-[14px] text-(--text-muted)">Color</span>
            <div className="flex gap-2 items-center flex-wrap">
              {COLORS.map((option) => {
                const active = color === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    aria-label={option.label}
                    aria-pressed={active}
                    title={option.label}
                    onClick={() => setColor(option.value)}
                    className="h-9 w-9 shrink-0 rounded-full border-2 cursor-pointer transition-transform duration-150 hover:scale-105 focus-visible:outline-2 focus-visible:outline-(--text-muted) focus-visible:outline-offset-2"
                    style={{
                      background: option.value ?? 'linear-gradient(135deg, #ffffff 50%, #111111 50%)',
                      borderColor: active ? 'var(--text-muted)' : 'transparent',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-full min-h-[304px] rounded-[10px] bg-(--surface) flex flex-col items-center justify-center p-12 gap-6 max-sm:p-6">
        <ThinkingOrb
          key={`${state}-${size}-${color ?? 'default'}`}
          state={state}
          size={size}
          color={color}
          speed={speed / 100}
          paused={paused}
        />
        <PlayPauseToggle playing={!paused} onToggle={() => setPaused((p) => !p)} className="max-sm:absolute max-sm:bottom-6 max-sm:left-1/2 max-sm:-translate-x-1/2" />
      </div>

      <div className="flex items-start h-auto bg-(--code-bg) rounded-[10px] py-1.5 pr-10 pl-3 overflow-hidden relative max-sm:hidden">
        <code className="font-[Roboto_Mono,monospace] text-sm leading-[22px] text-(--code-text) whitespace-pre overflow-x-auto min-w-0 flex-1">{snippet}</code>
        <CopyButton getText={() => snippet} />
      </div>
    </section>
  );
}
