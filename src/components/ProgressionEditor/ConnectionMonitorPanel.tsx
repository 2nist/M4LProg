import { useMemo } from "react";
import { useState } from "react";
import { useLiveStore } from "@stores/liveStore";
import { useHardwareStore } from "@stores/hardwareStore";
import { useRoutingStore } from "@stores/routingStore";

export default function ConnectionMonitorPanel() {
  const isOscConnected = useLiveStore((s) => s.isConnected);
  const isMidiConnected = useHardwareStore((s) => s.isConnected);
  const connectionEvents = useRoutingStore((s) => s.connectionEvents);
  const showHeaderConnectionCards = useRoutingStore((s) => s.showHeaderConnectionCards);
  const setShowHeaderConnectionCards = useRoutingStore((s) => s.setShowHeaderConnectionCards);
  const clearConnectionEvents = useRoutingStore((s) => s.clearConnectionEvents);
  const [filter, setFilter] = useState<"all" | "osc" | "midi" | "file">("all");

  const recentEvents = useMemo(() => {
    const filtered =
      filter === "all"
        ? connectionEvents
        : connectionEvents.filter((event) => event.source === filter);
    return filtered.slice(0, 12);
  }, [connectionEvents, filter]);

  const sourceCount = useMemo(() => {
    return {
      all: connectionEvents.length,
      osc: connectionEvents.filter((event) => event.source === "osc").length,
      midi: connectionEvents.filter((event) => event.source === "midi").length,
      file: connectionEvents.filter((event) => event.source === "file").length,
    };
  }, [connectionEvents]);

  return (
    <div className="space-y-2">
      <div className="text-xs muted-text">Connection Monitor</div>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={showHeaderConnectionCards}
          onChange={(e) => setShowHeaderConnectionCards(e.target.checked)}
        />
        Show connection cards in header timeline
      </label>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded border border-border px-2 py-1">
          OSC: {isOscConnected ? "connected" : "disconnected"}
        </div>
        <div className="rounded border border-border px-2 py-1">
          MIDI: {isMidiConnected ? "connected" : "disconnected"}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wide muted-text">Recent Signals</div>
        <button className="btn-muted px-2 py-1 text-[10px]" onClick={clearConnectionEvents}>
          Clear
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        {([
          ["all", sourceCount.all],
          ["osc", sourceCount.osc],
          ["midi", sourceCount.midi],
          ["file", sourceCount.file],
        ] as Array<[typeof filter, number]>).map(([key, count]) => (
          <button
            key={key}
            className={`px-2 py-1 text-[10px] rounded border ${
              filter === key ? "btn-muted" : "border-border/50"
            }`}
            onClick={() => setFilter(key)}
          >
            {key.toUpperCase()} ({count})
          </button>
        ))}
      </div>

      <div className="max-h-40 overflow-auto rounded border border-border/60 p-1 space-y-1">
        {recentEvents.length === 0 ? (
          <div className="text-[10px] muted-text px-1 py-2">
            No {filter === "all" ? "" : `${filter} `}connection events yet.
          </div>
        ) : (
          recentEvents.map((event) => (
            <div key={event.id} className="rounded border border-border/40 px-1.5 py-1">
              <div className="text-[9px] uppercase tracking-wide muted-text">
                {event.source} • {new Date(event.at).toLocaleTimeString()}
              </div>
              <div className="text-[10px]">{event.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
