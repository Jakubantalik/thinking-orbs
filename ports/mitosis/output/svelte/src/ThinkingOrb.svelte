<script context="module" lang="ts">
  export interface ThinkingOrbProps {
    state?: OrbState;
    size?: OrbSize;
    theme?: OrbTheme;
    speed?: number;
    paused?: boolean;
    ariaLabel?: string;
  }
</script>

<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  import {
    attachController,
    createOrbController,
    controllerProps,
    getController,
  } from "./orb-controller";
  import { LABELS, type OrbSize, type OrbState, type OrbTheme } from "./types";

  export let state: ThinkingOrbProps["state"] = undefined;
  export let size: ThinkingOrbProps["size"] = undefined;
  export let theme: ThinkingOrbProps["theme"] = undefined;
  export let speed: ThinkingOrbProps["speed"] = undefined;
  export let paused: ThinkingOrbProps["paused"] = undefined;
  export let ariaLabel: ThinkingOrbProps["ariaLabel"] = undefined;
  function stringifyStyles(stylesObj) {
    let styles = "";
    for (let key in stylesObj) {
      const dashedKey = key.replace(/[A-Z]/g, function (match) {
        return "-" + match.toLowerCase();
      });
      styles += dashedKey + ":" + stylesObj[key] + ";";
    }
    return styles;
  }

  let canvas;

  onMount(() => {
    const el = canvas;
    if (!el) return;
    attachController(
      el,
      createOrbController(
        el,
        controllerProps({
          state: state,
          size: size,
          theme: theme,
          speed: speed,
          paused: paused,
        })
      )
    );
  });

  function onUpdateFn_0(..._args: any[]) {
    const el = canvas;
    const ctl = getController(el);
    if (ctl) {
      ctl.applyProps(
        controllerProps({
          state: state,
          size: size,
          theme: theme,
          speed: speed,
          paused: paused,
        })
      );
    }
  }

  $: onUpdateFn_0(...[state, size, theme, speed, paused]);

  onDestroy(() => {
    const el = canvas;
    const ctl = getController(el);
    if (ctl) ctl.dispose();
  });
</script>

<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
<canvas
  style={stringifyStyles({
    width: size ?? 64,
    height: size ?? 64,
    display: "block",
  })}
  role="img"
  bind:this={canvas}
  aria-label={ariaLabel || LABELS[state ?? "working"]}
></canvas>
