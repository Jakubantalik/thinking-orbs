import { OrbController } from './OrbController';
import type { OrbControllerOptions } from './types';

export function createOrb(canvas: HTMLCanvasElement, options?: OrbControllerOptions): OrbController {
  return new OrbController(canvas, options);
}
