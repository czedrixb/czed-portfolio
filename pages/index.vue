<template>
  <div id="content" class="portfolio-shell">
    <section class="bento-grid" aria-label="Portfolio overview">
      <article class="bento-panel intro-panel reveal-panel" style="--delay:0ms">
        <p class="eyebrow">Hello, I’m</p>
        <h1>Czedrix Barcena</h1>
        <h2>Full stack developer.</h2>
        <p class="intro-bio">Building web, mobile<br />and AI products.</p>
        <div class="editorial-character">
          <div class="reference-character">
            <img src="/images/homepage-character-reference.png" width="1536" height="1024" alt="Ink illustration of a developer seated on a stool with a notebook" />
          </div>
        </div>
        <a class="cv-link" href="/pdf/RESUME-2025-CZEDRIX-BARCENA.pdf" target="_blank" rel="noopener">View my CV ↗</a>
        <p class="intro-motto">Ideas / Code / Impact</p>
      </article>
      <ProjectCard v-for="(project, index) in featuredProjects" :key="project.name" :project="project" :index="index" @open="openProject(index, $event)" />
      <article class="bento-panel experience-panel reveal-panel" style="--delay:225ms">
        <p class="eyebrow">Work experience</p><h2>Work experience</h2><p class="panel-subtitle">Building products and<br />great experiences.</p>
        <ol class="experience-list">
          <li v-for="(job, index) in experience" :key="job.company">
            <span class="company-icon" aria-hidden="true">{{ ['W', 'R', '♜'][index] }}</span>
            <div><h3>{{ job.company }}</h3><p>{{ job.role }}</p><p>{{ shortPeriod(job.period) }}</p></div>
          </li>
        </ol>
        <a class="cv-link" href="/pdf/RESUME-2025-CZEDRIX-BARCENA.pdf" target="_blank" rel="noopener">View full CV ↗</a>
        <button class="experience-open" :disabled="!experienceReady" aria-label="Open work experience details" @click="openExperience($event.currentTarget)"><span class="experience-open-label">View experience</span><span class="round-arrow" aria-hidden="true">&#8599;</span></button>
      </article>
      <article class="bento-panel technologies-panel reveal-panel" style="--delay:270ms">
        <h2><span aria-hidden="true">⚒</span> Tools I use</h2><p class="panel-subtitle">The technologies I enjoy working with.</p>
        <ul class="tech-cloud" aria-label="Technologies"><li v-for="tech in technologies" :key="tech.name"><span class="tech-symbol" :data-tech="tech.name">{{ tech.symbol }}</span>{{ tech.name }}</li></ul>
      </article>
      <article class="bento-panel contact-panel reveal-panel" style="--delay:315ms">
        <h2><span aria-hidden="true">➤</span> Let’s talk.</h2><p class="panel-subtitle">Let’s build something great together.</p>
        <a class="contact-arrow" href="mailto:czedrixb@gmail.com" aria-label="Start a conversation by email">↗</a>
        <div class="contact-actions"><a href="mailto:czedrixb@gmail.com">✉ Email ↗</a><a href="https://github.com/czedrixb" target="_blank" rel="noopener">GitHub ↗</a><a href="https://www.linkedin.com/in/czedrix-barcena/" target="_blank" rel="noopener">LinkedIn ↗</a></div>
        <p class="contact-motto">Good ideas belong on the web.</p>
      </article>
    </section>
    <ProjectDetailModal :project="activeProject" :projects="featuredProjects" :project-index="activeIndex" :origin="origin" @close="closeProject" @change-project="changeProject" />
    <ExperienceDetailModal :experience="experience" :open="experienceOpen" :origin="experienceOrigin" @close="closeExperience" />
  </div>
</template>
<script setup>
import projects from "~/assets/data/projects.json";
import experience from "~/assets/data/experience.json";
const order = ['Sentrix', 'Forkcast', 'My Notes', 'Pokéfinder'];
const subtitles = ['Retail, connected across branches.', 'AI-powered food tracking.', 'A little space for your ideas.', 'Find your next favourite.'];
const stacks = [['Laravel', 'Vue', 'MySQL'], ['Next.js', 'TypeScript', 'Prisma'], ['Laravel', 'Livewire', 'Tailwind'], ['Nuxt', 'Vue', 'REST API']];
const featuredProjects = order.map((name, i) => ({ ...projects.find(p => p.name === name), subtitle: subtitles[i], previewTech: stacks[i] }));
const technologies = [{name:'Vue',symbol:'V'}, {name:'Nuxt',symbol:'△'}, {name:'Laravel',symbol:'♧'}, {name:'Next.js',symbol:'N'}];
const activeIndex = ref(-1), origin = shallowRef(null);
const experienceOrigin = shallowRef(null);
const experienceOpen = ref(false);
const experienceReady = ref(false);
const activeProject = computed(() => featuredProjects[activeIndex.value] ?? null);
function openProject(index, trigger) { origin.value = trigger; activeIndex.value = index; }
function closeProject() { activeIndex.value = -1; }
function changeProject(index) { activeIndex.value = index; }
function openExperience(trigger) { experienceOrigin.value = trigger; experienceOpen.value = true; }
function closeExperience() { experienceOpen.value = false; }
onMounted(() => { experienceReady.value = true; });
function shortPeriod(period) { return period.replace('October','Oct').replace('December','Dec').replace('August','Aug').replace('February','Feb').replace('April','Apr'); }
const siteUrl = "https://my-portfolio-five-rho-11.vercel.app";
const description = "Czedrix Barcena — full-stack engineer building production web, mobile and AI products with Laravel, Nuxt, React, FastAPI and Kotlin.";
useSeoMeta({ title: "Czedrix Barcena — Full Stack Web Developer", description, ogTitle: "Czedrix Barcena — Full Stack Web Developer", ogDescription: description, ogType: "website", ogUrl: siteUrl, ogImage: siteUrl + "/images/img-hero.png", twitterCard: "summary_large_image", twitterTitle: "Czedrix Barcena — Full Stack Web Developer", twitterDescription: description, twitterImage: siteUrl + "/images/img-hero.png" });
useHead({ link: [{ rel: "canonical", href: siteUrl }] });
</script>
