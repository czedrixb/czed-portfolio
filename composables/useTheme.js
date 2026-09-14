const STORAGE_KEY = 'portfolio-theme';

export function useTheme() {
  const theme = useState('portfolio-theme', () => 'dark');
  const systemTheme = useState('portfolio-system-theme', () => 'dark');
  const ready = useState('portfolio-theme-ready', () => false);
  let media;
  let updateSystemTheme;

  function applyTheme(value) {
    if (!import.meta.client) return;
    theme.value = value;
    document.documentElement.dataset.theme = value;
    document.documentElement.style.colorScheme = value;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      value === 'dark' ? '#07151b' : '#dceaf0'
    );
  }

  function toggleTheme() {
    const next = theme.value === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  onMounted(() => {
    media = window.matchMedia('(prefers-color-scheme: dark)');
    updateSystemTheme = event => {
      systemTheme.value = event.matches ? 'dark' : 'light';
      if (!localStorage.getItem(STORAGE_KEY)) applyTheme(systemTheme.value);
    };

    systemTheme.value = media.matches ? 'dark' : 'light';
    applyTheme(document.documentElement.dataset.theme || systemTheme.value);
    ready.value = true;
    media.addEventListener('change', updateSystemTheme);
  });

  onBeforeUnmount(() => media?.removeEventListener('change', updateSystemTheme));

  return { theme: readonly(theme), systemTheme: readonly(systemTheme), ready: readonly(ready), toggleTheme };
}
