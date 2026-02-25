Theme integration guide
=======================

Place a theme file in `src/styles/themes/` that defines only CSS variables. The app consumes these tokens:

- `--background` (page background)
- `--foreground` (text color)
- `--primary` (primary accent)
- `--muted` (muted surfaces)
- `--border` (border / outline)
- `--ring` (focus ring)
- `--font-sans`, `--font-mono`, `--font-serif` (font stacks)

Example: create `src/styles/themes/my-theme.css` and set only variables you want to change.

Loading
-------
You can statically import your theme in the app entry (e.g. `main.tsx`) or dynamically apply variables at runtime using the `applyTheme` helper in `src/styles/applyTheme.ts`.

Best practices
--------------
- Avoid `!important` in theme files. The global CSS uses `!important` only for edge cases; keep themes simple variable maps.
- Provide fallbacks for advanced color functions if targeting older Electron/Chromium builds.
- Use `--font-sans` token instead of hard-coded fonts in `globals.css`.
