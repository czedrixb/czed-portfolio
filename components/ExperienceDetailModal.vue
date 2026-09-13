<template>
  <Teleport to="body">
    <div v-if="isOpen" ref="overlay" class="overlay" @pointerdown="onBackdropPointerDown" @click.self="backdropDown && close()">
      <section ref="tray" class="project-tray experience-tray" role="dialog" aria-modal="true" aria-labelledby="experience-tray-title" tabindex="-1">
        <header class="tray-header">
          <div><p class="eyebrow">Work experience</p><h2 id="experience-tray-title">Experience</h2><p class="tray-subtitle">Product delivery across web, mobile and AI.</p></div>
          <div class="tray-header-actions"><div class="tray-controls"><button aria-label="Close work experience details" @click="close">Close</button></div><a href="/pdf/RESUME-2025-CZEDRIX-BARCENA.pdf" target="_blank" rel="noopener" class="lime-button">View full CV &#8599;</a></div>
        </header>
        <ol class="experience-detail-list">
          <li v-for="job in experience" :key="job.company" class="experience-detail">
            <div class="experience-detail-heading"><div><h3>{{ job.company }}</h3><p class="experience-role">{{ job.role }}</p></div><p class="experience-period">{{ job.period }}</p></div>
            <p class="experience-summary">{{ job.summary }}</p>
            <ul v-if="job.highlights" class="experience-highlights"><li v-for="highlight in job.highlights" :key="highlight">{{ highlight }}</li></ul>
            <ul class="tray-tech"><li v-for="tech in job.tech" :key="tech">{{ tech }}</li></ul>
          </li>
        </ol>
      </section>
    </div>
  </Teleport>
</template>
<script setup>
const props = defineProps({ experience: Array, open: Boolean, origin: Object });
const emit = defineEmits(['close']);
const overlay = ref(null), tray = ref(null), backdropDown = ref(false);
const { lock, unlock } = useScrollLock();
const isOpen = computed(() => props.open);
let trayAnimation, backdropAnimation, closing = false;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function cleanupAnimations() { trayAnimation?.cancel(); backdropAnimation?.cancel(); trayAnimation = null; backdropAnimation = null; }
function getOriginTransform() { const target = tray.value?.getBoundingClientRect(), source = props.origin?.closest('article')?.getBoundingClientRect(); if (!target || !source || source.bottom < 0 || source.top > innerHeight) return 'scale(.94)'; return `translate3d(${source.left + source.width / 2 - (target.left + target.width / 2)}px, ${source.top + source.height / 2 - (target.top + target.height / 2)}px, 0) scale(${source.width / target.width}, ${source.height / target.height})`; }
async function animateTray(reverse = false) { cleanupAnimations(); if (reduced() || !tray.value) return; const collapsed = { transform: getOriginTransform(), opacity: .35 }, expanded = { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1 }; trayAnimation = tray.value.animate(reverse ? [expanded, collapsed] : [collapsed, expanded], { duration: reverse ? 380 : 460, easing: reverse ? 'cubic-bezier(.22,1,.36,1)' : 'cubic-bezier(.16,1,.3,1)', fill: 'both' }); backdropAnimation = overlay.value?.animate(reverse ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }], { duration: reverse ? 260 : 300, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }); const animation = trayAnimation; try { await Promise.all([animation.finished, backdropAnimation?.finished]); } catch {} if (trayAnimation === animation && !reverse) cleanupAnimations(); }
function onBackdropPointerDown(event) { backdropDown.value = event.target === event.currentTarget; }
async function close() { if (closing) return; closing = true; await animateTray(true); emit('close'); }
function keydown(event) { if (!isOpen.value) return; if (event.key === 'Escape') { event.preventDefault(); close(); return; } if (event.key !== 'Tab' || !tray.value) return; const items = [...tray.value.querySelectorAll('button,a[href]')].filter(el => !el.disabled), first = items[0], last = items.at(-1); if (event.shiftKey && (document.activeElement === first || document.activeElement === tray.value)) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
watch(isOpen, async (open) => { closing = false; if (open) { lock(); await nextTick(); tray.value?.focus({ preventScroll: true }); document.querySelector('.site-frame')?.setAttribute('inert', ''); animateTray(); } else { cleanupAnimations(); unlock(); document.querySelector('.site-frame')?.removeAttribute('inert'); props.origin?.focus({ preventScroll: true }); } });
onMounted(() => document.addEventListener('keydown', keydown));
onBeforeUnmount(() => { cleanupAnimations(); if (isOpen.value) { unlock(); document.querySelector('.site-frame')?.removeAttribute('inert'); } document.removeEventListener('keydown', keydown); });
</script>
