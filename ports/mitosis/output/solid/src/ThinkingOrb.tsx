import { onMount, on, createEffect, createMemo } from "solid-js";

export interface ThinkingOrbProps {
  state?: OrbState;
  size?: OrbSize;
  theme?: OrbTheme;
  speed?: number;
  paused?: boolean;
  ariaLabel?: string;
}

import {
  attachController,
  createOrbController,
  controllerProps,
  getController,
} from "./orb-controller";
import { LABELS, type OrbSize, type OrbState, type OrbTheme } from "./types";

function ThinkingOrb(props: ThinkingOrbProps) {
  let canvas: HTMLCanvasElement | null;

  onMount(() => {
    const el = canvas;
    if (!el) return;
    attachController(
      el,
      createOrbController(
        el,
        controllerProps({
          state: props.state,
          size: props.size,
          theme: props.theme,
          speed: props.speed,
          paused: props.paused,
        })
      )
    );
  });

  const onUpdateFn_0_props_state = createMemo(() => props.state);
  const onUpdateFn_0_props_size = createMemo(() => props.size);
  const onUpdateFn_0_props_theme = createMemo(() => props.theme);
  const onUpdateFn_0_props_speed = createMemo(() => props.speed);
  const onUpdateFn_0_props_paused = createMemo(() => props.paused);
  function onUpdateFn_0() {
    const el = canvas;
    const ctl = getController(el);
    if (ctl) {
      ctl.applyProps(
        controllerProps({
          state: props.state,
          size: props.size,
          theme: props.theme,
          speed: props.speed,
          paused: props.paused,
        })
      );
    }
  }
  createEffect(
    on(
      () => [
        onUpdateFn_0_props_state(),
        onUpdateFn_0_props_size(),
        onUpdateFn_0_props_theme(),
        onUpdateFn_0_props_speed(),
        onUpdateFn_0_props_paused(),
      ],
      onUpdateFn_0
    )
  );

  return (
    <>
      <canvas
        role="img"
        ref={canvas!}
        aria-label={props.ariaLabel || LABELS[props.state ?? "working"]}
        style={{
          width: props.size ?? 64,
          height: props.size ?? 64,
          display: "block",
        }}
      ></canvas>
    </>
  );
}

export default ThinkingOrb;
