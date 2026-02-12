import ActiveSectionEditor from "./ActiveSectionEditor";
import SongSettings from "./SongSettings";

export default function ToolsPanel() {
  return (
    <div className="h-full flex flex-col gap-2">
      <div className="mb-1 text-xs muted-text">Tools</div>
      <div className="flex-1 overflow-auto">
        {/* Quick controls (ActiveSectionEditor + SongSettings stacked) */}
        <div className="mb-2">
          <ActiveSectionEditor />
        </div>

        <div>
          <SongSettings />
        </div>
      </div>
    </div>
  );
}
