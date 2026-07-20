import React, { forwardRef } from 'react';
import { PauseIcon, PlayIcon } from './icons';

export const PlayPauseToggle = forwardRef<HTMLButtonElement, { playing: boolean; onToggle: () => void; className?: string }>(
  function PlayPauseToggle({ playing, onToggle, className = '' }, ref) {
    const state = playing ? 'b' : 'a';
    return (
      <button
        ref={ref}
        className={`playground-play-toggle z-[2] inline-grid place-items-center size-8 border-0 rounded-full bg-(--toggle-bg) text-(--toggle-color) cursor-pointer transition-[background-color,color] duration-200 [-webkit-tap-highlight-color:transparent] hover:bg-(--toggle-hover) hover:text-(--toggle-hover-color) focus-visible:outline-2 focus-visible:outline-[rgba(255,255,255,0.5)] focus-visible:outline-offset-2 [&_.t-icon_svg]:size-3.5 [&_.t-icon_svg]:fill-current [&_.t-icon_svg]:stroke-none ${className}`.trim()}
        type="button"
        data-state={state}
        onClick={onToggle}
        aria-pressed={playing}
        aria-label={playing ? 'Pause shader animation' : 'Play shader animation'}
      >
        <span className="t-icon" data-icon="a"><PlayIcon /></span>
        <span className="t-icon" data-icon="b"><PauseIcon /></span>
      </button>
    );
  }
);
