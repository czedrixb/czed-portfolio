<template>
  <article class="bento-panel project-panel reveal-panel" :class="'project-' + index" :style="{ '--delay': (45 + index * 45) + 'ms' }">
    <header class="project-heading">
      <p class="eyebrow">{{ String(index + 1).padStart(2, '0') }} / {{ index === 0 ? 'Featured project' : 'Project' }}</p>
      <h2>{{ project.name }}</h2>
      <p class="project-subtitle">{{ project.subtitle }}</p>
    </header>
    <button class="project-open" :disabled="!ready" :aria-label="'Open ' + project.name + ' project details'" @click="$emit('open', $event.currentTarget)">
      <span class="round-arrow" aria-hidden="true">↗</span><span class="explore-label">Explore project ↗</span>
    </button>
    <PreviewImage class="project-preview" :src="project.image" :alt="project.name + ' project preview'" :eager="index < 2" />
    <ul class="project-tech"><li v-for="tech in project.previewTech" :key="tech"><span class="tech-symbol" :data-tech="tech">{{ symbols[tech] || '◇' }}</span>{{ tech }}</li></ul>
  </article>
</template>
<script setup>
defineProps({ project: Object, index: Number });
defineEmits(['open']);
const ready = ref(false);
onMounted(() => { ready.value = true; });
const symbols = { Vue: 'V', Nuxt: '△', Laravel: '♧', 'Next.js': 'N', TypeScript: 'TS', MySQL: '⌁', Livewire: '◉', Tailwind: '≈', Prisma: '△', 'REST API': '⚙' };
</script>

