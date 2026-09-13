<template>
  <div class="preview-frame" :class="{ pending: enhanced && !loaded && !failed }">
    <img ref="element" :key="source" :src="source" :alt="alt" :loading="eager ? 'eager' : 'lazy'" decoding="async" width="1440" height="900" :class="{ decoded: loaded, 'awaiting-decode': enhanced && !loaded }" @load="decode" @error="failed = true" />
    <div v-if="failed" class="preview-error"><span>Preview unavailable</span><button type="button" @click.stop="retry">Retry preview</button></div>
  </div>
</template>
<script setup>
const props = defineProps({ src: String, alt: String, eager: Boolean });
const element = ref(null), loaded = ref(false), failed = ref(false), attempt = ref(0), enhanced = ref(false);
const source = computed(() => props.src + (attempt.value ? '?retry=' + attempt.value : ''));
async function decode() { const img = element.value; if (!img) return; try { await img.decode(); } catch {} if (img === element.value && img.naturalWidth) loaded.value = true; }
function retry() { failed.value = false; loaded.value = false; attempt.value++; }
watch(() => props.src, () => { loaded.value = false; failed.value = false; attempt.value = 0; });
onMounted(() => { if (element.value?.complete) { if (element.value.naturalWidth) loaded.value = true; else failed.value = true; } enhanced.value = true; });
</script>
