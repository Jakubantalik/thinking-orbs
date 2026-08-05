import { useState } from 'react';
import type { OrbState, OrbTransitionEvent, TransitionDefinition } from '../../src';
import { ThinkingOrb } from '../../src';

const STATES: OrbState[] = [
  'idle',
  'thinking',
  'working',
  'searching',
  'solving',
  'listening',
  'connecting',
  'weaving',
  'composing',
  'breathing',
  'shaping',
  'success',
  'error'
];
const PRESETS: Record<string, TransitionDefinition> = {
  gentle: { duration: 650, easing: 'ease-in-out' },
  snappy: { duration: 180, easing: 'ease-out' },
  linear: { duration: 450, easing: 'linear' }
};
const INTERACTION = {
  hover: { enabled: true, scale: 1.08, intensity: 0.24, parallax: 0.16, transitionDuration: 220 },
  focus: { enabled: true, useHoverStyle: true }
} as const;

export function TransitionShowcase() {
  const [state, setState] = useState<OrbState>('idle');
  const [preset, setPreset] = useState('gentle');
  const [reduced, setReduced] = useState(false);
  const [event, setEvent] = useState('ready');

  const describe = (name: string) => (detail: OrbTransitionEvent) => {
    setEvent(`${name} ${detail.from} → ${detail.to} ${Math.round(detail.progress * 100)}%`);
  };
  const interrupt = () => {
    setState('searching');
    window.setTimeout(() => setState('composing'), 120);
  };

  return (
    <section id="transitions" className="w-full flex flex-col gap-3 mb-12" aria-label="State transitions and interactions">
      <h2 className="text-base font-normal leading-[34px] text-(--section-title-color)">Transitions & interaction</h2>
      <div className="grid grid-cols-[minmax(220px,1fr)_2fr] gap-3 max-sm:grid-cols-1">
        <div className="min-h-[260px] rounded-[10px] bg-(--surface) flex flex-col items-center justify-center gap-5 p-8">
          <ThinkingOrb
            data-testid="transition-orb"
            state={state}
            size={64}
            transition={preset}
            transitionPresets={PRESETS}
            interaction={INTERACTION}
            reducedMotion={reduced}
            aria-label={`Demo orb: ${state}`}
            onOrbTransitionStart={describe('start')}
            onOrbTransitionProgress={describe('progress')}
            onOrbTransitionEnd={describe('end')}
            onOrbTransitionCancel={describe('cancel')}
          />
          <span data-testid="functional-state" className="text-sm capitalize">{state}</span>
          <span data-testid="transition-event" className="font-[Roboto_Mono,monospace] text-[11px] text-(--text-muted)">{event}</span>
        </div>
        <div className="rounded-[10px] bg-(--panel-bg) p-4 flex flex-col gap-4">
          <fieldset className="flex flex-wrap gap-2 border-0">
            <legend className="text-xs text-(--text-muted) mb-2">One-click states (a second click interrupts)</legend>
            {STATES.map((value) => (
              <button key={value} type="button" data-state-button={value} onClick={() => setState(value)} className="h-9 px-3 rounded-lg bg-(--tab-bg) text-(--tab-color) cursor-pointer border-0 capitalize">
                {value}
              </button>
            ))}
          </fieldset>
          <fieldset className="flex flex-wrap gap-2 border-0">
            <legend className="text-xs text-(--text-muted) mb-2">Transition preset</legend>
            {Object.keys(PRESETS).map((value) => (
              <button key={value} type="button" aria-pressed={preset === value} onClick={() => setPreset(value)} className="h-9 px-3 rounded-lg bg-(--tab-bg) text-(--tab-color) cursor-pointer border-0 capitalize">
                {value}
              </button>
            ))}
          </fieldset>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" data-testid="interrupt" onClick={interrupt} className="h-9 px-3 rounded-lg bg-(--tab-active-bg) text-(--tab-active-color) cursor-pointer border-0">Interrupt demo</button>
            <label className="text-xs flex items-center gap-2">
              <input data-testid="reduced-motion" type="checkbox" checked={reduced} onChange={(change) => setReduced(change.target.checked)} />
              Simulate reduced motion
            </label>
          </div>
        </div>
      </div>
      <fieldset className="grid grid-cols-3 gap-3 max-sm:grid-cols-1 border-0">
        <legend className="sr-only">Transition preset comparison</legend>
        {Object.keys(PRESETS).map((name) => (
          <div key={name} className="rounded-[10px] bg-(--surface) min-h-28 flex items-center justify-center gap-3 capitalize">
            <ThinkingOrb state={state} size={64} transition={name} transitionPresets={PRESETS} reducedMotion={reduced} />
            <span className="text-xs">{name}</span>
          </div>
        ))}
      </fieldset>
    </section>
  );
}
