import { paint, paintLines } from '../engine/core';
import type { CapturedFrame, InternalParticle, OrbInteractionConfig, OrbSnapshot } from './types';
import type { OrbStateName } from '../types';

export interface InteractionVisualState {
  amount: number;
  pointerX: number;
  pointerY: number;
}

export function applyInteraction(
  frame: CapturedFrame,
  size: number,
  config: OrbInteractionConfig,
  visual: InteractionVisualState
): CapturedFrame {
  if (visual.amount <= 0) return frame;
  const hover = config.hover ?? {};
  const scale = 1 + ((hover.scale ?? 1.04) - 1) * visual.amount;
  const intensity = (hover.intensity ?? 0.18) * visual.amount;
  const parallax = (hover.parallax ?? 0.12) * visual.amount * size * 0.08;
  const center = size / 2;
  return {
    particles: frame.particles.map((particle) => overlayParticle(particle, center, scale, intensity, parallax, visual)),
    lines: frame.lines
  };
}

function overlayParticle(
  particle: InternalParticle,
  center: number,
  scale: number,
  intensity: number,
  parallax: number,
  visual: InteractionVisualState
): InternalParticle {
  const depth = Math.max(0, Math.min(1, particle.z / (center * 2) + 0.5));
  const depthOffset = 0.35 + depth * 0.65;
  return {
    ...particle,
    x: center + (particle.x - center) * scale + visual.pointerX * parallax * depthOffset,
    y: center + (particle.y - center) * scale + visual.pointerY * parallax * depthOffset,
    r: particle.r * (1 + intensity * 0.15),
    white: Math.max(0, particle.white - intensity * 0.2),
    a: Math.min(1, particle.a * (1 + intensity * 0.35))
  };
}

export function paintFrame(
  ctx: CanvasRenderingContext2D,
  frame: CapturedFrame,
  size: number,
  dpr: number,
  dark: boolean
): void {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  paintLines(ctx, frame.lines, dark);
  paint(
    ctx,
    frame.particles.map(({ x, y, z, r, white, a, rgb }) => ({ x, y, z, r, white, a, rgb })),
    dark
  );
}

export function resizeCanvas(canvas: HTMLCanvasElement, size: number): number {
  const dpr = Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1);
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  return dpr;
}

export function makeSnapshot(
  state: OrbStateName,
  transitioning: boolean,
  interactionAmount: number,
  frame?: CapturedFrame
): OrbSnapshot {
  const particles = (frame?.particles ?? []).map((particle) => ({ ...particle }));
  return { state, transitioning, particleCount: particles.length, interactionAmount, particles };
}
