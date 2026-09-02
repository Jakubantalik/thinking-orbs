"use client";
import * as React from "react";
import { useRef, useEffect } from "react";

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
  const canvas = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const el = canvas.current;
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
  }, []);
  useEffect(() => {
    const el = canvas.current;
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
  }, [props.state, props.size, props.theme, props.speed, props.paused]);
  useEffect(() => {
    return () => {
      const el = canvas.current;
      const ctl = getController(el);
      if (ctl) ctl.dispose();
    };
  }, []);

  return (
    <canvas
      role="img"
      ref={canvas}
      aria-label={props.ariaLabel || LABELS[props.state ?? "working"]}
      style={{
        width: props.size ?? 64,
        height: props.size ?? 64,
        display: "block",
      }}
    />
  );
}

export default ThinkingOrb;
