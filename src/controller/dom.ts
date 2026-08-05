import type { OrbInteractionConfig } from './types';

interface DomHooks {
  config: () => Required<OrbInteractionConfig>;
  hover: (active: boolean) => void;
  focus: (active: boolean) => void;
  pointer: (x: number, y: number) => void;
  visibility: (visible: boolean) => void;
}

export function attachOrbDom(canvas: HTMLCanvasElement, hooks: DomHooks): () => void {
  const cleanups: Array<() => void> = [];
  const listen = <K extends keyof HTMLElementEventMap>(type: K, handler: (event: HTMLElementEventMap[K]) => void) => {
    canvas.addEventListener(type, handler as EventListener);
    cleanups.push(() => canvas.removeEventListener(type, handler as EventListener));
  };
  listen('pointerenter', (event) => {
    if (event.pointerType === 'touch' || !hooks.config().hover.enabled) return;
    if (hooks.config().stopPropagation) event.stopPropagation();
    hooks.hover(true);
  });
  listen('pointerleave', (event) => {
    if (event.pointerType === 'touch' || !hooks.config().hover.enabled) return;
    if (hooks.config().stopPropagation) event.stopPropagation();
    hooks.hover(false);
  });
  listen('pointermove', (event) => {
    if (event.pointerType === 'touch' || !hooks.config().hover.enabled) return;
    if (hooks.config().stopPropagation) event.stopPropagation();
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;
    hooks.pointer(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
  });
  listen('pointerdown', (event) => {
    if (hooks.config().pointerdown && hooks.config().stopPropagation) event.stopPropagation();
  });
  listen('focus', () => hooks.focus(true));
  listen('blur', () => hooks.focus(false));

  const observer = typeof IntersectionObserver === 'undefined'
    ? null
    : new IntersectionObserver(([entry]) => hooks.visibility(entry.isIntersecting));
  observer?.observe(canvas);
  if (observer) cleanups.push(() => observer.disconnect());
  const onVisibility = () => hooks.visibility(document.visibilityState !== 'hidden');
  document.addEventListener('visibilitychange', onVisibility);
  cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));
  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
