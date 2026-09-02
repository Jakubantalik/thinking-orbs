<template>
  <canvas
    role="img"
    ref="canvas"
    :aria-label="ariaLabel || LABELS[state ?? 'working']"
    :style="{
      width: size ?? 64,
      height: size ?? 64,
      display: 'block',
    }"
  ></canvas>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import {
  attachController,
  createOrbController,
  controllerProps,
  getController,
} from "./orb-controller";
import { LABELS, type OrbSize, type OrbState, type OrbTheme } from "./types";

export interface ThinkingOrbProps {
  state?: OrbState;
  size?: OrbSize;
  theme?: OrbTheme;
  speed?: number;
  paused?: boolean;
  ariaLabel?: string;
}

export default defineComponent({
  name: "thinking-orb",

  props: ["state", "size", "theme", "speed", "paused", "ariaLabel"],

  data() {
    return { LABELS };
  },

  mounted() {
    const el = this.$refs.canvas;
    if (!el) return;
    attachController(
      el,
      createOrbController(
        el,
        controllerProps({
          state: this.state,
          size: this.size,
          theme: this.theme,
          speed: this.speed,
          paused: this.paused,
        })
      )
    );
  },

  watch: {
    onUpdateHook0: {
      handler() {
        const el = this.$refs.canvas;
        const ctl = getController(el);
        if (ctl) {
          ctl.applyProps(
            controllerProps({
              state: this.state,
              size: this.size,
              theme: this.theme,
              speed: this.speed,
              paused: this.paused,
            })
          );
        }
      },
      immediate: true,
    },
  },
  unmounted() {
    const el = this.$refs.canvas;
    const ctl = getController(el);
    if (ctl) ctl.dispose();
  },

  computed: {
    onUpdateHook0() {
      return {
        0: this.state,
        1: this.size,
        2: this.theme,
        3: this.speed,
        4: this.paused,
      };
    },
  },
});
</script>