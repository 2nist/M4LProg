import { useProgressionStore } from "@stores/progressionStore";

export default function LeftNavMenu() {
  const { sections, setOpenDrawer } = useProgressionStore();

  return (
    <div className="h-full flex flex-col items-stretch gap-2 menu-compact">
      <div className="mb-1 text-xs muted-text">Navigation</div>
      <div className="grid grid-cols-2 gap-2">
        <button
          className="btn-muted px-3 py-2"
          onClick={() => setOpenDrawer("sections")}
        >
          Sections
        </button>

        <button
          className="btn-muted px-3 py-2"
          onClick={() => setOpenDrawer("patterns")}
        >
          Patterns
        </button>
        <button
          className="btn-muted px-3 py-2"
          onClick={() => setOpenDrawer("library")}
        >
          Library
        </button>
        <button className="btn-muted px-3 py-2">Harmony</button>
        <button
          className="btn-muted px-3 py-2"
          onClick={() => setOpenDrawer("export")}
        >
          Export
        </button>
        <button
          className="btn-muted px-3 py-2"
          onClick={() => setOpenDrawer("settings")}
        >
          Settings
        </button>
        <button
          className="btn-muted px-3 py-2"
          onClick={() => setOpenDrawer("monitor")}
        >
          Monitor
        </button>
      </div>

      <div className="mt-3 text-xs muted-text">Quick Sections</div>
      <div className="flex gap-1 overflow-x-auto py-1">
        {sections.slice(0, 8).map((s) => (
          <button key={s.id} className="px-2 py-1 rounded bg-black/5 text-sm">
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
