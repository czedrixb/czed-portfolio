<template>
  <div class="site-frame">
    <GradientWaves :theme="theme" />
    <a href="#content" class="skip-link">Skip to content</a>
    <main><slot /></main>
  </div>
</template>

<script setup>
const { theme } = useTheme();
</script>
