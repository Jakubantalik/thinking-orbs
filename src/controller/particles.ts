import type { Dot } from '../engine/core';
import { createFrameCapture, hashD, lerp } from '../engine/core';
import { MODE_DRAWS } from '../engine/registry';
import { BASE_PROFILES } from '../engine/profiles';
import { resolvePreset, STATE_TO_MODE } from '../presets';
import type { OrbSize, OrbStateName } from '../types';
import type { CapturedFrame, InternalParticle, OrbParticleTarget, OrbStateProfile } from './types';

function fromTarget(target: OrbParticleTarget, index: number): InternalParticle {
  return {
    id: index,
    x: target.x,
    y: target.y,
    z: target.z ?? 0,
    r: target.radius,
    white: target.brightness ?? 0.1,
    a: target.opacity ?? 1,
    rgb: target.color
  };
}

export function sampleState(
  state: OrbStateName,
  size: OrbSize,
  time: number,
  seed: number,
  profiles: Record<string, OrbStateProfile>
): CapturedFrame {
  const custom = profiles[state];
  if (custom?.particles) {
    const targets = typeof custom.particles === 'function' ? custom.particles({ size, time, seed }) : custom.particles;
    const ordered = targets.every((target) => target.id != null)
      ? [...targets].sort((a, b) => {
          const left = String(a.id);
          const right = String(b.id);
          return left < right ? -1 : left > right ? 1 : 0;
        })
      : targets;
    return { particles: ordered.map(fromTarget), lines: [] };
  }

  if (!custom?.mode && !(state in STATE_TO_MODE)) {
    throw new Error(`thinking-orbs: unknown state "${state}"; register a state profile before using it`);
  }
  const resolved = custom?.mode
    ? { mode: custom.mode, speed: custom.speed ?? 1, opts: { ...BASE_PROFILES[custom.mode], ...custom.opts } }
    : resolvePreset(state as never, size);
  const capture = createFrameCapture();
  MODE_DRAWS[resolved.mode](capture.ctx, size, time * resolved.speed, false, resolved.opts);
  return {
    particles: capture.frame.dots.map((dot, index) => dotToParticle(dot, index)),
    lines: capture.frame.lines
  };
}

function dotToParticle(dot: Dot, id: number): InternalParticle {
  return { id, x: dot.x, y: dot.y, z: dot.z, r: dot.r, white: dot.white, a: dot.a ?? 1, rgb: dot.rgb };
}

function hiddenClone(particle: InternalParticle, id: number): InternalParticle {
  return { ...particle, id, a: 0, r: Math.max(0.01, particle.r * 0.5) };
}

export function expandFrame(frame: CapturedFrame, capacity: number, seed = 1): CapturedFrame {
  if (frame.particles.length === capacity) return frame;
  if (frame.particles.length === 0) {
    return {
      particles: Array.from({ length: capacity }, (_, id) => ({ id, x: 0, y: 0, z: 0, r: 0.01, white: 0, a: 0 })),
      lines: frame.lines
    };
  }
  const particles = frame.particles.slice(0, capacity).map((particle, id) => ({ ...particle, id }));
  for (let id = particles.length; id < capacity; id++) {
    const parent = Math.floor(hashD(id, seed) * frame.particles.length);
    particles.push(hiddenClone(frame.particles[parent], id));
  }
  return { particles, lines: frame.lines };
}

export function interpolateFrames(source: CapturedFrame, target: CapturedFrame, progress: number, seed = 1): CapturedFrame {
  const capacity = Math.max(source.particles.length, target.particles.length);
  const a = expandFrame(source, capacity, seed);
  const b = expandFrame(target, capacity, seed);
  return {
    particles: a.particles.map((from, id) => {
      const to = b.particles[id];
      const fromColor = from.rgb ?? [from.white * 255, from.white * 255, from.white * 255];
      const toColor = to.rgb ?? [to.white * 255, to.white * 255, to.white * 255];
      const rgb = from.rgb || to.rgb
        ? ([0, 1, 2].map((channel) => lerp(fromColor[channel], toColor[channel], progress)) as unknown as readonly [number, number, number])
        : undefined;
      return {
        id,
        x: lerp(from.x, to.x, progress),
        y: lerp(from.y, to.y, progress),
        z: lerp(from.z, to.z, progress),
        r: lerp(from.r, to.r, progress),
        white: lerp(from.white, to.white, progress),
        a: lerp(from.a, to.a, progress),
        rgb
      };
    }),
    lines: [
      ...a.lines.map((line) => ({ ...line, a: (line.a ?? 1) * (1 - progress) })),
      ...b.lines.map((line) => ({ ...line, a: (line.a ?? 1) * progress }))
    ]
  };
}
