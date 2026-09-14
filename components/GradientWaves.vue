<template>
  <div
    ref="container"
    class="gradient-waves"
    :class="{ 'gradient-waves-fallback': renderState === 'fallback' }"
    :data-rendering="renderState"
    aria-hidden="true"
  />
</template>

<script setup>
import { Mesh, Program, Renderer, Triangle } from 'ogl';

const props = defineProps({
  theme: { type: String, default: 'dark' },
  speed: { type: Number, default: 0.22 },
  amplitude: { type: Number, default: 2.15 },
  detail: { type: String, default: 'medium' },
  opacity: { type: Number, default: 0.92 },
  mouseInteraction: { type: Boolean, default: true },
  paused: { type: Boolean, default: false },
  verticalOffset: { type: Number, default: 0.16 },
});

const container = ref(null);
const renderState = ref('loading');
const palettes = {
  dark: { horizon: '#07151b', wave: '#1d6373', crest: '#a9d4dc', boost: 1 },
  light: { horizon: '#9dc2cd', wave: '#0f3b48', crest: '#2f6b7a', boost: 2.1 },
};

const vertex = `#version 300 es
in vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution; uniform float iTime; uniform float uSpeed; uniform float uAmplitude;
uniform float uSteps; uniform float uOpacity; uniform vec2 uMouse; uniform float uEnableMouse;
uniform float uOffsetY;
uniform vec3 uHorizonColor; uniform vec3 uWaveColor; uniform vec3 uCrestColor;
out vec4 fragColor; const float MAX_DIST=20000.0;
float plasma(vec3 r,vec2 freq,vec4 tc){
  float mx=r.x+tc.x; mx+=28.0*sin((r.y+mx)/20.0+tc.y);
  float my=r.y-tc.z; my+=14.0*cos(r.x/23.0+tc.w);
  return r.z-(sin(mx*freq.x)*uAmplitude+sin(my*freq.y)*uAmplitude+5.5);
}
float raymarch(vec3 pos,vec3 dir,vec2 freq,vec4 tc){
  float dist=0.0; for(int i=0;i<110;i++){if(float(i)>=uSteps)break; float d=plasma(pos+dist*dir,freq,tc); if(abs(d)<0.1)break; dist+=0.9*d; if(!(abs(dist)<MAX_DIST))return MAX_DIST;} return dist;
}
void main(){
  float T=iTime*uSpeed; vec2 freq=vec2(0.6/7.0,(0.6*0.9)/3.0); vec4 tc=vec4(T/0.130,T/0.810,T/0.200,T/0.710);
  vec2 uv=(gl_FragCoord.xy/iResolution.xy)-0.5; uv.x*=iResolution.x/iResolution.y; uv.y*=-1.0; uv.y+=uOffsetY;
  float ulen=length(uv); float vfov=(3.14159/2.3); vec3 dir=vec3(0.0,0.0,-1.0);
  float c=cos(vfov*ulen),s=sin(vfov*ulen); dir=mat3(1.0,0.0,0.0,0.0,c,-s,0.0,s,c)*dir;
  vec2 nuv=ulen>1e-5?uv/ulen:vec2(1.0,0.0); c=nuv.x;s=nuv.y; dir=mat3(c,-s,0.0,s,c,0.0,0.0,0.0,1.0)*dir;
  c=cos(1.11);s=sin(1.11);dir=mat3(c,0.0,s,0.0,1.0,0.0,-s,0.0,c)*dir;
  if(uEnableMouse>0.5){float yaw=(uMouse.x-0.5)*0.12;float pitch=(uMouse.y-0.5)*0.12;c=cos(yaw);s=sin(yaw);dir=mat3(c,0.0,s,0.0,1.0,0.0,-s,0.0,c)*dir;c=cos(pitch);s=sin(pitch);dir=mat3(1.0,0.0,0.0,0.0,c,-s,0.0,s,c)*dir;}
  float dist=raymarch(vec3(0.0,0.0,30.0),dir,freq,tc); vec3 pos=vec3(0.0,0.0,30.0)+dist*dir;
  float fog=clamp(15.0/max(dist,0.001),0.0,1.0); vec3 body=mix(uWaveColor,uCrestColor,clamp(pos.z*0.08+0.5,0.0,1.0));
  vec3 col=mix(uHorizonColor,body,fog); float alpha=clamp(fog,0.0,1.0)*uOpacity; fragColor=vec4(col*alpha,alpha);
}`;

const toRgb = value => {
  const clean = value.replace('#', '');
  return [0, 2, 4].map(offset => parseInt(clean.slice(offset, offset + 2), 16) / 255);
};
const steps = detail => detail === 'low' ? 40 : detail === 'high' ? 110 : 70;

let context;
let frame = 0;
let resizeObserver;
let intersectionObserver;
let visible = true;
let pageVisible = true;
let reduceMotion = false;
let media;
let elapsed = 0;
let lastFrame = 0;
const mouse = [0.5, 0.5];
const targetMouse = [0.5, 0.5];
let currentColors;
let targetColors;
let currentBoost = 1;
let targetBoost = 1;

function setTargetPalette(theme, immediate = false) {
  const palette = palettes[theme] || palettes.dark;
  targetColors = [toRgb(palette.horizon), toRgb(palette.wave), toRgb(palette.crest)];
  targetBoost = palette.boost ?? 1;
  if (immediate || !currentColors) currentColors = targetColors.map(color => [...color]);
  if (immediate) currentBoost = targetBoost;
}

function updateUniformColors() {
  if (!context || !targetColors) return;
  const rate = reduceMotion ? 1 : 0.055;
  const keys = ['uHorizonColor', 'uWaveColor', 'uCrestColor'];
  keys.forEach((key, index) => {
    currentColors[index].forEach((value, channel) => {
      currentColors[index][channel] += (targetColors[index][channel] - value) * rate;
      context.program.uniforms[key].value[channel] = currentColors[index][channel];
    });
  });
  currentBoost += (targetBoost - currentBoost) * rate;
  context.program.uniforms.uOpacity.value = props.opacity * currentBoost;
}

function shouldAnimate() {
  return visible && pageVisible && !props.paused && !reduceMotion;
}

function render(time = performance.now()) {
  if (!context) return;
  if (lastFrame) elapsed += Math.min(time - lastFrame, 50);
  lastFrame = time;
  context.program.uniforms.iTime.value = elapsed * 0.001;
  mouse[0] += (targetMouse[0] - mouse[0]) * 0.045;
  mouse[1] += (targetMouse[1] - mouse[1]) * 0.045;
  context.program.uniforms.uMouse.value.set(mouse);
  updateUniformColors();
  context.renderer.render({ scene: context.mesh });
  frame = shouldAnimate() ? requestAnimationFrame(render) : 0;
}

function start() {
  if (!frame && shouldAnimate()) { lastFrame = 0; frame = requestAnimationFrame(render); }
  else if (!shouldAnimate()) render();
}

function stop() {
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
}

watch(() => props.theme, value => { setTargetPalette(value, reduceMotion); start(); });
watch(() => [props.speed, props.amplitude, props.detail, props.opacity, props.mouseInteraction, props.paused, props.verticalOffset], () => {
  if (!context) return;
  const uniforms = context.program.uniforms;
  uniforms.uSpeed.value = props.speed;
  uniforms.uAmplitude.value = props.amplitude;
  uniforms.uSteps.value = steps(props.detail);
  uniforms.uOpacity.value = props.opacity * currentBoost;
  uniforms.uEnableMouse.value = props.mouseInteraction ? 1 : 0;
  uniforms.uOffsetY.value = props.verticalOffset;
  props.paused ? stop() : start();
});

onMounted(() => {
  setTargetPalette(props.theme, true);
  media = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduceMotion = media.matches;
  try {
    const renderer = new Renderer({ webgl: 2, alpha: true, premultipliedAlpha: true, antialias: false, dpr: Math.min(devicePixelRatio || 1, 1.5) });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const program = new Program(gl, {
      vertex, fragment,
      uniforms: {
        iResolution: { value: new Float32Array([1, 1]) }, iTime: { value: 0 },
        uSpeed: { value: props.speed }, uAmplitude: { value: props.amplitude },
        uSteps: { value: steps(props.detail) }, uOpacity: { value: props.opacity * currentBoost },
        uMouse: { value: new Float32Array(mouse) }, uEnableMouse: { value: props.mouseInteraction ? 1 : 0 },
        uOffsetY: { value: props.verticalOffset },
        uHorizonColor: { value: new Float32Array(currentColors[0]) },
        uWaveColor: { value: new Float32Array(currentColors[1]) },
        uCrestColor: { value: new Float32Array(currentColors[2]) },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    context = { renderer, program, mesh, gl, canvas: gl.canvas };
    container.value.appendChild(gl.canvas);
    const resize = () => {
      const rect = container.value.getBoundingClientRect();
      renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height));
      program.uniforms.iResolution.value.set([gl.drawingBufferWidth, gl.drawingBufferHeight]);
      renderer.render({ scene: mesh });
    };
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container.value);
    intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? start() : stop(); });
    intersectionObserver.observe(container.value);
    const pointerMove = event => { targetMouse[0] = event.clientX / innerWidth; targetMouse[1] = 1 - event.clientY / innerHeight; };
    const pointerLeave = () => { targetMouse[0] = 0.5; targetMouse[1] = 0.5; };
    const visibilityChange = () => { pageVisible = !document.hidden; pageVisible ? start() : stop(); };
    const motionChange = event => { reduceMotion = event.matches; reduceMotion ? stop() : start(); render(); };
    window.addEventListener('pointermove', pointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', pointerLeave);
    document.addEventListener('visibilitychange', visibilityChange);
    media.addEventListener('change', motionChange);
    context.cleanup = () => {
      window.removeEventListener('pointermove', pointerMove);
      document.documentElement.removeEventListener('pointerleave', pointerLeave);
      document.removeEventListener('visibilitychange', visibilityChange);
      media.removeEventListener('change', motionChange);
    };
    resize();
    renderState.value = reduceMotion ? 'static' : 'active';
    start();
  } catch {
    renderState.value = 'fallback';
  }
});

onBeforeUnmount(() => {
  stop();
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  context?.cleanup?.();
  context?.canvas?.remove();
  context?.gl?.getExtension('WEBGL_lose_context')?.loseContext();
  context = null;
});
</script>
