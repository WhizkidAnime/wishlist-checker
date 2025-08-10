// Применение темы на основе сохранённых настроек пользователя

function computeExplicitMode(): 'light' | 'dark' | null {
  try {
    const savedThemeMode = localStorage.getItem('wishlist-theme-mode');
    const oldTheme = localStorage.getItem('wishlist-theme');
    if (savedThemeMode === 'dark' || oldTheme === 'dark') return 'dark';
    if (savedThemeMode === 'light' || oldTheme === 'light') return 'light';
  } catch {}
  return null;
}

function computeSystemPrefersDark(): boolean {
  try {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch {
    return false;
  }
}

export function applyUserTheme(): void {
  try {
    const explicit = computeExplicitMode();
    const useDark = explicit === 'dark' || (explicit === null && computeSystemPrefersDark());
    document.documentElement.classList.toggle('dark', !!useDark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', useDark ? '#141414' : '#F9FAFB');
    const loadingScreen = document.getElementById('initial-loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.remove('dark-theme', 'light-theme');
      if (explicit === 'light') loadingScreen.classList.add('light-theme');
      if (useDark) loadingScreen.classList.add('dark-theme');
    }
  } catch {}
}


