import type { OrbScheduler } from './types';

export class OrbRenderLoop {
  private frameId = 0;
  private enabled = true;

  constructor(
    private readonly scheduler: OrbScheduler,
    private readonly render: (now: number) => void
  ) {}

  start(): void {
    if (this.frameId || !this.enabled) return;
    this.frameId = this.scheduler.requestFrame(this.frame);
  }

  stop(): void {
    if (!this.frameId) return;
    this.scheduler.cancelFrame(this.frameId);
    this.frameId = 0;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) this.start();
    else this.stop();
  }

  private frame = (now: number) => {
    this.frameId = 0;
    if (!this.enabled) return;
    this.render(now);
    this.start();
  };
}
