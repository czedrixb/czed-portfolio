<template>
  <section ref="viewer" class="image-viewer" role="dialog" aria-modal="true" aria-label="Expanded project image" tabindex="-1">
    <div class="viewer-toolbar"><span aria-live="polite">{{ Math.round(scale * 100) }}%</span><button aria-label="Zoom out" @click="zoom(scale - .25)">−</button><button aria-label="Zoom in" @click="zoom(scale + .25)">+</button><button aria-label="Reset image fit" @click="reset">Fit</button><button aria-label="Close image viewer" @click="$emit('close')">Close ×</button></div>
    <div ref="canvas" class="viewer-canvas" :style="{ cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in' }" @wheel.prevent="wheel" @dblclick="toggle" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up">
      <img ref="img" :src="image.src" :alt="image.alt" draggable="false" :style="{ transform: 'translate(' + x + 'px,' + y + 'px) scale(' + scale + ')', transition: dragging ? 'none' : 'transform 200ms cubic-bezier(.22,1,.36,1)' }" @load="reset" />
    </div>
  </section>
</template>
<script setup>
defineProps({ image:Object });
const emit = defineEmits(['close']);
const viewer = ref(null), canvas = ref(null), img = ref(null), scale = ref(1), x = ref(0), y = ref(0), dragging = ref(false);
const pointers = new Map(); let lastTap = 0;
function clamp() {
  if (!canvas.value || !img.value?.naturalWidth) return;
  const w = canvas.value.clientWidth, h = canvas.value.clientHeight;
  const fit = Math.min(w / img.value.naturalWidth, h / img.value.naturalHeight);
  const bx = Math.max(0,(img.value.naturalWidth * fit * scale.value - w)/2);
  const by = Math.max(0,(img.value.naturalHeight * fit * scale.value - h)/2);
  x.value = Math.max(-bx, Math.min(bx,x.value)); y.value = Math.max(-by,Math.min(by,y.value));
}
function zoom(next, cx = 0, cy = 0) { next = Math.max(1,Math.min(4,next)); const ratio = next/scale.value; x.value = cx-(cx-x.value)*ratio; y.value = cy-(cy-y.value)*ratio; scale.value = next; clamp(); }
function reset() { scale.value=1; x.value=0; y.value=0; }
function center(event) { const b=canvas.value.getBoundingClientRect(); return [event.clientX-b.x-b.width/2,event.clientY-b.y-b.height/2]; }
function wheel(event) { dragging.value=true; zoom(scale.value*Math.exp(-event.deltaY*.002),...center(event)); }
function toggle(event) { zoom(scale.value === 1 ? 2 : 1,...center(event)); }
function down(e) { canvas.value.setPointerCapture(e.pointerId); pointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); dragging.value=true; }
function move(e) {
  const prev=pointers.get(e.pointerId); if(!prev) return;
  const other=[...pointers.entries()].find(([id])=>id!==e.pointerId)?.[1];
  if(other) { const before=Math.hypot(prev.x-other.x,prev.y-other.y); const after=Math.hypot(e.clientX-other.x,e.clientY-other.y); if(before>0) { const b=canvas.value.getBoundingClientRect(); zoom(scale.value*after/before,(e.clientX+other.x)/2-b.x-b.width/2,(e.clientY+other.y)/2-b.y-b.height/2); } }
  else if(scale.value>1) { x.value+=e.clientX-prev.x; y.value+=e.clientY-prev.y; clamp(); }
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
}
function up(e) { pointers.delete(e.pointerId); dragging.value=pointers.size>0; if(e.pointerType==='touch') { const now=Date.now(); if(now-lastTap<280) toggle(e); lastTap=now; } }
function keydown(e) {
  if(e.key==='Escape') { e.preventDefault(); e.stopImmediatePropagation(); emit('close'); }
  if(e.key==='Tab') { const items=viewer.value.querySelectorAll('button'); if(e.shiftKey&&(document.activeElement===items[0]||document.activeElement===viewer.value)) { e.preventDefault(); items[items.length-1].focus(); } else if(!e.shiftKey&&document.activeElement===items[items.length-1]) {e.preventDefault();items[0].focus();} }
}
onMounted(() => { viewer.value.focus(); document.addEventListener('keydown',keydown,true); window.addEventListener('resize',clamp); });
onBeforeUnmount(() => { document.removeEventListener('keydown',keydown,true); window.removeEventListener('resize',clamp); });
</script>

