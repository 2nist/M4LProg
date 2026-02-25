type ThemeVars = Record<string, string>;

/**
 * Apply theme variables to :root at runtime. Use for dynamic theme switching.
 * Example: applyTheme({ '--background': '#000', '--foreground': '#fff' })
 */
export function applyTheme(vars: ThemeVars) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export default applyTheme;
