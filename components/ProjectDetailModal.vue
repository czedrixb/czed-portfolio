<template>
  <Teleport to="body">
      <div v-if="project" ref="overlay" class="overlay" @pointerdown="onBackdropPointerDown" @click.self="backdropDown && close()">
        <section ref="tray" class="project-tray" role="dialog" aria-modal="true" aria-labelledby="tray-title" tabindex="-1" :inert="viewerOpen || undefined">
          <header class="tray-header">
            <div><p class="eyebrow">Project / {{ String(projectIndex + 1).padStart(2, '0') }}</p><h2 id="tray-title">{{ project.name }}</h2><p class="tray-subtitle">{{ project.subtitle }}</p></div>
            <div class="tray-header-actions"><div class="tray-controls">
              <button aria-label="Previous project" @click="go(-1)">←</button><button aria-label="Next project" @click="go(1)">→</button><button aria-label="Close project details" @click="close">× Close</button>
            </div><a :href="project.url" target="_blank" rel="noopener" class="lime-button">{{ project.urlLabel }} ↗</a></div>
          </header>
          <ul class="tray-tech"><li v-for="tech in project.tech" :key="tech">{{ tech }}</li></ul>
          <div class="tray-content">
            <div class="gallery">
              <div class="gallery-stage">
                <PreviewImage :key="selectedImage.src" :src="selectedImage.src" :alt="selectedImage.alt" eager />
                <button ref="imageTrigger" class="expand-image" aria-label="Expand project image" @click="viewerOpen = true"><span>Expand ↗</span></button>
              </div>
              <div v-if="gallery.length > 1" class="thumbnails" aria-label="Project screenshots">
                <button v-for="(image, index) in gallery" :key="image.src" :class="{ selected: index === imageIndex }" :aria-label="'Show screenshot ' + (index + 1)" :aria-pressed="index === imageIndex" @click="imageIndex = index"><img :src="image.src" alt="" loading="lazy" /></button>
              </div>
              <p class="caption"><span class="sr-only">Screenshot {{ imageIndex + 1 }} of {{ gallery.length }}. </span>{{ selectedImage.caption }}</p>
            </div>
            <div class="tray-details"><h3>About the project</h3><p>{{ project.description }}</p>
              <ul class="features"><li v-for="feature in project.features" :key="feature">{{ feature }}</li></ul>
            </div>
          </div>
          <footer><span>{{ String(projectIndex + 1).padStart(2, '0') }} / {{ String(projects.length).padStart(2, '0') }} projects</span><button class="text-action" @click="go(1)">Next project: {{ nextProject.name }} →</button></footer>
        </section>
        <ImageViewer v-if="viewerOpen" :image="selectedImage" @close="closeViewer" />
      </div>
  </Teleport>
</template>
<script setup>
const props = defineProps({ project: Object, projects: Array, projectIndex: Number, origin: Object });
const emit = defineEmits(['close', 'change-project']);
const overlay = ref(null), tray = ref(null), imageTrigger = ref(null), imageIndex = ref(0), viewerOpen = ref(false), backdropDown = ref(false);
const { lock, unlock } = useScrollLock();
const gallery = computed(() => props.project?.gallery?.length ? props.project.gallery : [{ src: props.project?.image, alt: props.project?.name + ' preview', caption: props.project?.description }]);
const selectedImage = computed(() => gallery.value[imageIndex.value] || {});
const nextProject = computed(() => props.projects[(props.projectIndex + 1) % props.projects.length] || {});
let trayAnimation, backdropAnimation, closing = false;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function cleanupAnimations() {
  trayAnimation?.cancel();
  backdropAnimation?.cancel();
  trayAnimation = null;
  backdropAnimation = null;
}
function getOriginTransform() {
  const target = tray.value?.getBoundingClientRect();
  const card = props.origin?.closest('article');
  const source = card?.getBoundingClientRect();
  const sourceVisible = source && source.width > 0 && source.height > 0 && source.bottom > 0 && source.top < innerHeight && source.right > 0 && source.left < innerWidth;
  if (!target || !sourceVisible) return 'scale(.94)';
  const sourceX = source.left + source.width / 2;
  const sourceY = source.top + source.height / 2;
  const targetX = target.left + target.width / 2;
  const targetY = target.top + target.height / 2;
  return `translate3d(${sourceX - targetX}px, ${sourceY - targetY}px, 0) scale(${source.width / target.width}, ${source.height / target.height})`;
}
async function animateTray(reverse = false) {
  cleanupAnimations();
  if (reduced() || !tray.value) return;
  const collapsed = { transform: getOriginTransform(), opacity: .35 };
  const expanded = { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1 };
  const trayFrames = reverse ? [expanded, collapsed] : [collapsed, expanded];
  const backdropFrames = reverse ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }];
  trayAnimation = tray.value.animate(trayFrames, {
    duration: reverse ? 380 : 460,
    easing: reverse ? 'cubic-bezier(.22,1,.36,1)' : 'cubic-bezier(.16,1,.3,1)',
    fill: 'both'
  });
  backdropAnimation = overlay.value?.animate(backdropFrames, {
    duration: reverse ? 260 : 300,
    easing: 'cubic-bezier(.22,1,.36,1)',
    fill: 'both'
  });
  const animation = trayAnimation;
  try { await Promise.all([animation.finished, backdropAnimation?.finished]); } catch {}
  if (trayAnimation === animation && !reverse) cleanupAnimations();
}
function onBackdropPointerDown(event) { backdropDown.value = event.target === event.currentTarget; }
watch(() => props.project, async (project, previous) => {
  imageIndex.value = 0; viewerOpen.value = false; closing = false;
  if (project && !previous) { lock(); await nextTick(); tray.value?.focus({ preventScroll:true }); document.querySelector('.site-frame')?.setAttribute('inert',''); animateTray(); }
  else if (!project && previous) { cleanupAnimations(); unlock(); document.querySelector('.site-frame')?.removeAttribute('inert'); props.origin?.focus({ preventScroll:true }); }
  else if (project) { await nextTick(); if (!reduced()) tray.value?.querySelector('.tray-content')?.animate([{opacity:.25},{opacity:1}], {duration:220}); }
});
watch(selectedImage, (image) => {
  if (!import.meta.client || !props.project) return;
  for (const index of [imageIndex.value, imageIndex.value - 1, imageIndex.value + 1]) {
    const entry = gallery.value[index]; if (entry) { const preloader = new Image(); preloader.src = entry.src; }
  }
});
async function close() { if (closing || viewerOpen.value) return; closing = true; await animateTray(true); emit('close'); }
async function closeViewer() { viewerOpen.value = false; await nextTick(); imageTrigger.value?.focus({preventScroll:true}); }
function go(direction) { if (viewerOpen.value || closing) return; emit('change-project', (props.projectIndex + direction + props.projects.length) % props.projects.length); }
function keydown(event) {
  if (!props.project || viewerOpen.value) return;
  if (event.key === 'Escape') { event.preventDefault(); close(); }
  if (event.key !== 'Tab' || !tray.value) return;
  const items = [...tray.value.querySelectorAll('button,a[href]')].filter(el => !el.disabled);
  const first = items[0], last = items.at(-1);
  if (event.shiftKey && (document.activeElement === first || document.activeElement === tray.value)) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
}
function resize() { cleanupAnimations(); }
onMounted(() => { document.addEventListener('keydown', keydown); window.addEventListener('resize',resize); });
onBeforeUnmount(() => { cleanupAnimations(); if (props.project) { unlock(); document.querySelector('.site-frame')?.removeAttribute('inert'); } document.removeEventListener('keydown',keydown); window.removeEventListener('resize',resize); });
</script>
