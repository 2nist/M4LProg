# Styling System Workguide

## Executive Summary

Your app's styling system has been reviewed and enhanced to support flexible theme integration. The system is now **CSS variable-driven**, **theme-switchable**, and **fully documented in Storybook**.

---

## Problems Found & Fixed

### Issues Identified
1. **Heavy use of `!important`** — blocked downstream customization and made theme overrides difficult
2. **Duplicate token declarations** — tokens defined in multiple files (inconsistent)
3. **Hard-coded fonts** — `body { font-family: 'Arial' }` overrode theme tokens
4. **Tailwind color mapping collapse** — many color shades mapped to single CSS variables (limited palette)
5. **Missing theme abstraction** — no clear way to integrate custom styles without editing component CSS
6. **No runtime theme switching** — themes were baked in at build time

### Solutions Implemented
✅ Reduced `!important` usage to essential edge-cases only  
✅ Centralized all tokens in `src/styles/index.css` (single source of truth)  
✅ Replaced hard-coded fonts with `--font-sans` token  
✅ Added Tailwind `safelist` to prevent dynamic class purging  
✅ Created theme scaffold system with runtime switching  
✅ Added Storybook design system documentation  

---

## Architecture

### CSS Variable Hierarchy

```
src/styles/index.css (root theme tokens)
    ↓
src/styles/globals.css (utility mappings)
    ↓
tailwind.config.js (Tailwind color mappings)
    ↓
src/styles/themes/*.css (optional theme overrides)
    ↓
src/styles/applyTheme.ts (runtime override helper)
```

### Key Tokens (30 total)

**Semantic Colors:**
- `--background`, `--foreground` (page colors)
- `--primary`, `--secondary` (brand colors)
- `--muted`, `--muted-foreground` (disabled/secondary)
- `--accent`, `--destructive` (warnings, errors)
- `--border`, `--ring` (outlines, focus states)
- `--sidebar`, `--sidebar-foreground` (navigation)
- `--card`, `--popover` (surfaces)
- `--input` (form fields)

**Chart Colors:**
- `--chart-1` through `--chart-5` (data visualization)

**Typography:**
- `--font-sans`, `--font-mono`, `--font-serif` (font stacks)

---

## How to Integrate Your Style

### Option 1: Static Theme File (Recommended)

Create `src/styles/themes/my-theme.css`:

```css
:root {
  --background: #0b0b0f;
  --foreground: #f6f6f2;
  --primary: #ff6b6b;
  --muted: #121214;
  --border: #222228;
  --font-sans: Inter, system-ui, sans-serif;
  /* ... add other tokens as needed */
}
```

**Then import in `src/main.tsx`:**

```typescript
import "./styles/themes/my-theme.css";
```

No component CSS changes needed. Colors flow through automatically.

### Option 2: Runtime Override

In your app or debug console:

```javascript
import { applyTheme } from './styles/applyTheme';

applyTheme({
  '--primary': '#ff00ff',
  '--background': '#000000',
  '--foreground': '#ffffff'
});
```

Or use localStorage (survives page reload):

```javascript
localStorage.setItem('theme-override', JSON.stringify({
  '--primary': '#ff00ff'
}));
location.reload();
```

### Option 3: Mix Both

Use static file as base, then apply runtime overrides on top.

---

## Storybook Design System

### Access Design System (run first):
```bash
pnpm storybook
```

### Available Stories

**Sidebar → Design System:**

1. **Theme** — Interactive theme switcher (try all 3 presets)
2. **Colors** — All 30 tokens with swatches + sample component usage
3. **Typography** — Font families, sizes, weights, line heights
4. **Component Variants** — All UI elements in light/dark/example themes side-by-side

### Global Theme Toolbar

Top toolbar has **Theme dropdown** (sun/moon icon):
- **Light (Default)** — official light theme
- **Dark** — official dark theme  
- **Example (Custom)** — example dark theme

Select a theme → all stories re-render instantly. Useful for:
- QA testing across themes
- Accessibility audits
- Design handoff verification

---

## File Reference

### New Files

| File | Purpose |
|------|---------|
| `src/styles/themes/my-theme.css` | Example theme scaffold (copy & rename) |
| `src/styles/applyTheme.ts` | Runtime theme application helper |
| `src/styles/THEME_README.md` | Token documentation |
| `.storybook/ThemeDecorator.tsx` | Global theme presets + decorator |
| `.storybook/ThemeSyncTool.tsx` | Toolbar theme sync |
| `src/stories/Theme.stories.tsx` | Theme showcase |
| `src/stories/Colors.stories.tsx` | Color palette documentation |
| `src/stories/Typography.stories.tsx` | Typography specimens |
| `src/stories/ComponentVariants.stories.tsx` | Component variants across themes |

### Modified Files

| File | Changes |
|------|---------|
| `src/styles/index.css` | Root tokens (unchanged, source of truth) |
| `src/styles/globals.css` | Replaced hard-coded Arial with `--font-sans` |
| `tailwind.config.js` | Added `safelist` for dynamic classes |
| `src/main.tsx` | Added theme import + runtime override hook |
| `.storybook/preview.ts` | Added global decorator + toolbar |

---

## Common Workflows

### Add a New Color Token

1. Add to `src/styles/index.css` `:root` block:
   ```css
   --my-color: #abc123;
   ```

2. Use in component CSS or Tailwind:
   ```css
   color: var(--my-color);
   ```

3. Show in Storybook Colors story (update `src/stories/Colors.stories.tsx`)

### Create a New Theme Preset

1. Copy `src/styles/themes/my-theme.css` → `src/styles/themes/brand-dark.css`
2. Set all tokens you want to override
3. To load it: import in `src/main.tsx` or add to `.storybook/ThemeDecorator.tsx`

### Test Theme Across App

1. Start Storybook: `pnpm storybook`
2. Switch theme via toolbar dropdown
3. All stories update instantly
4. Or create custom story to test your own components

### Verify Component Contrast

1. Open Storybook
2. Switch to **Design System → Component Variants**
3. Review buttons, badges, alerts in all three themes
4. Check accessibility (browser DevTools → Lighthouse)

---

## Best Practices

✅ **Do:**
- Use CSS variables instead of hard-coded colors
- Create theme files that *only* set variables (no component CSS)
- Test new themes in Storybook before shipping
- Use semantic token names (e.g., `--primary`, not `--blue-500`)
- Provide fallbacks for modern CSS features (`oklch`, `color-mix`) if targeting old Chromium

❌ **Don't:**
- Add `!important` to theme files (only global CSS for edge-cases)
- Hard-code colors in component styles
- Duplicate token definitions
- Mix theme logic into component props

---

## Troubleshooting

### Colors not updating after theme change
- Ensure you imported `src/styles/index.css` (defines tokens)
- Check browser DevTools → Computed styles → verify CSS variables are set
- Clear browser cache or hard-reload (Cmd+Shift+R / Ctrl+Shift+R)

### Tailwind classes not showing
- Add to `tailwind.config.js` → `safelist` array
- Example: `{ pattern: /^bg-primary-/ }` to safelist all `bg-primary-*`

### Storybook toolbar theme dropdown missing
- Restart Storybook: `pnpm storybook`
- Check `.storybook/preview.ts` has `globalTypes` config

### Font not changing
- Verify `--font-sans` token is set in your theme file
- Use: `font-family: var(--font-sans, system-ui)` in component CSS

---

## Next Steps

1. **Review Storybook** — start `pnpm storybook` and explore design system
2. **Create your theme** — copy `src/styles/themes/my-theme.css` and customize
3. **Test integration** — add to `src/main.tsx` import or use runtime `applyTheme()`
4. **Update components** — replace hard-coded colors with CSS variables
5. **Document** — add any custom tokens to `src/styles/THEME_README.md`

---

## Quick Reference: CSS Variables Cheat Sheet

```css
/* Colors */
background-color: var(--background);
color: var(--foreground);
border-color: var(--border);

/* Focus states */
outline-color: var(--ring);

/* Components */
background: var(--card);
background: var(--popover);
background: var(--muted);

/* Status */
color: var(--destructive);
color: var(--accent);

/* Sidebar/Nav */
background: var(--sidebar);
color: var(--sidebar-foreground);

/* Charts */
fill: var(--chart-1);
fill: var(--chart-2);
/* ... --chart-3, --chart-4, --chart-5 */

/* Fonts */
font-family: var(--font-sans);
font-family: var(--font-mono);
font-family: var(--font-serif);
```

---

## Support

- **Theme docs:** `src/styles/THEME_README.md`
- **Token reference:** `src/stories/Colors.stories.tsx`
- **Examples:** `src/styles/themes/my-theme.css` (copy & modify)
- **Runtime helper:** `src/styles/applyTheme.ts`

Questions? Check Storybook stories or review `src/styles/globals.css` for CSS variable mappings.
