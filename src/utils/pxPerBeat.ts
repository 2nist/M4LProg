interface PxPerBeatOpts {
  zoom?: number; // 0..1
  minPx?: number;
  maxPx?: number;
  fitToView?: boolean;
  totalBeats?: number;
  viewportWidth?: number;
  minVisibleBeats?: number;
  padding?: number;
}

export function computePxPerBeat(opts: PxPerBeatOpts = {}) {
  const {
    zoom = 0.45,
    minPx = 10,
    maxPx = 48,
    fitToView = false,
    totalBeats = 0,
    viewportWidth = 800,
    minVisibleBeats = 6,
    padding = 48,
  } = opts;

  const t = Math.pow(zoom, 0.8);
  const base = Math.round(minPx + (maxPx - minPx) * t);

  if (!totalBeats) return base;

  if (fitToView) {
    const fit = Math.floor(Math.max(4, (viewportWidth - padding) / totalBeats));
    return Math.max(4, Math.min(base, fit));
  }

  const responsiveCap = Math.max(
    12,
    Math.floor((viewportWidth - padding) / minVisibleBeats),
  );
  return Math.max(4, Math.min(base, responsiveCap));
}

export default computePxPerBeat;
