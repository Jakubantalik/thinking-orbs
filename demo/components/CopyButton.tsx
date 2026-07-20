import React, { useRef, useState } from 'react';
import { CheckIcon, CopyIcon } from './icons';

function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

export function CopyButton({ getText }: { getText: () => string }) {
  const [state, setState] = useState<'a' | 'b'>('a');
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleClick = () => {
    copyToClipboard(getText());
    setState('b');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setState('a'), 2000);
  };

  return (
    <button className="copy-btn absolute top-0.5 right-0.5 shrink-0 inline-grid place-items-center size-9 border-none rounded-[10px] bg-transparent cursor-pointer p-0 text-inherit transition-[background-color] duration-150 hover:bg-(--copy-hover) focus-visible:outline-2 focus-visible:outline-[rgba(255,255,255,0.5)] focus-visible:outline-offset-[-2px] focus-visible:rounded-lg [&_svg]:size-4" type="button" data-state={state} onClick={handleClick} aria-label="Copy">
      <span className="t-icon" data-icon="a"><CopyIcon /></span>
      <span className="t-icon" data-icon="b"><CheckIcon /></span>
    </button>
  );
}
