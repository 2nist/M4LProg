import { ProgressionEditor } from "./ProgressionEditor/ProgressionEditor";
import { initializeRangeProgress } from "../utils/rangeProgress";
import { useEffect, useMemo, useState, useRef } from "react";
import { useProgressionStore } from "@stores/progressionStore";
import usePlayheadSync from "@hooks/usePlayheadSync";
import { computePxPerBeat } from "../utils/pxPerBeat";
import { useLiveStore } from "@stores/liveStore";
import { useHardwareStore } from "@stores/hardwareStore";
import { Modal } from "./Modal";
import {
  getAdapterById,
  getAdaptersByTransport,
  type OutputTargetAdapter,
} from "@services/output/OutputAdapters";
import { useRoutingStore, type RoutingKey } from "@stores/routingStore";
import { listMidiOutputDevices } from "@services/output/WebMidiOutService";
import type { ModeId } from "@/types/arrangement";

const HEADER_GAP_PX = 8;
const HEADER_TRANSPORT_CORRECTION_ALPHA = 0.12;
const HEADER_TRANSPORT_HARD_SNAP_BEATS = 2.0;
const README_LINES = [
  "# ChordGen Live Helper - Max for Live Device",
  "This directory contains the complete Max for Live device.",
  "It enables communication between ChordGen Pro and Ableton Live.",
];

interface HeaderCardData {
  id: string;
  title: string;
  lines: string[];
  beats: number;
}

type HeaderConnectionType = "osc" | "midi" | "file";

function HeaderConnectionArray() {
  const isOscConnected = useLiveStore((s) => s.isConnected);
  const isMidiConnected = useHardwareStore((s) => s.isConnected);
  const oscOutRoute = useRoutingStore((s) => s.oscOutRoute);
  const midiOutRoute = useRoutingStore((s) => s.midiOutRoute);
  const midiOutDeviceId = useRoutingStore((s) => s.midiOutDeviceId);
  const midiOutChannel = useRoutingStore((s) => s.midiOutChannel);
  const modeDefaultChannels = useRoutingStore((s) => s.modeDefaultChannels);
  const midiOutPulseAt = useRoutingStore((s) => s.midiOutPulseAt);
  const midiLastSignal = useRoutingStore((s) => s.midiLastSignal);
  const midiLastSignalAt = useRoutingStore((s) => s.midiLastSignalAt);
  const jsonExportRoute = useRoutingStore((s) => s.jsonExportRoute);
  const midiExportRoute = useRoutingStore((s) => s.midiExportRoute);
  const setRoute = useRoutingStore((s) => s.setRoute);
  const setMidiOutDeviceId = useRoutingStore((s) => s.setMidiOutDeviceId);
  const setMidiOutChannel = useRoutingStore((s) => s.setMidiOutChannel);
  const setModeDefaultChannel = useRoutingStore((s) => s.setModeDefaultChannel);
  const pushConnectionEvent = useRoutingStore((s) => s.pushConnectionEvent);

  const [openModal, setOpenModal] = useState<HeaderConnectionType | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [midiDevices, setMidiDevices] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 120);
    return () => window.clearInterval(timer);
  }, []);

  const prevOscRef = useRef<boolean | null>(null);
  const prevMidiRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevOscRef.current === null) {
      prevOscRef.current = isOscConnected;
    } else if (prevOscRef.current !== isOscConnected) {
      pushConnectionEvent("osc", isOscConnected ? "connected" : "disconnected");
      prevOscRef.current = isOscConnected;
    }
  }, [isOscConnected, pushConnectionEvent]);
  useEffect(() => {
    if (prevMidiRef.current === null) {
      prevMidiRef.current = isMidiConnected;
    } else if (prevMidiRef.current !== isMidiConnected) {
      pushConnectionEvent("midi", isMidiConnected ? "connected" : "disconnected");
      prevMidiRef.current = isMidiConnected;
    }
  }, [isMidiConnected, pushConnectionEvent]);

  useEffect(() => {
    if (openModal !== "midi") return;
    listMidiOutputDevices().then((devices) => {
      setMidiDevices(devices);
      if (!midiOutDeviceId && devices.length > 0) {
        setMidiOutDeviceId(devices[0].id);
      }
    });
  }, [openModal, midiOutDeviceId, setMidiOutDeviceId]);

  const fileRoutes = [
    { key: "jsonExportRoute" as RoutingKey, label: "JSON", routeId: jsonExportRoute },
    { key: "midiExportRoute" as RoutingKey, label: "MIDI", routeId: midiExportRoute },
  ];

  const indicators = [
    {
      id: "osc" as HeaderConnectionType,
      label: "OSC",
      connected: isOscConnected,
    },
    {
      id: "midi" as HeaderConnectionType,
      label: "MIDI",
      connected: isMidiConnected,
      pulsing: now - midiOutPulseAt < 220,
    },
    {
      id: "file" as HeaderConnectionType,
      label: "FILE",
      connected: true,
    },
  ];

  const midiRouteLabel = getAdapterById(midiOutRoute)?.name || "none";
  const midiDeviceLabel =
    midiDevices.find((device) => device.id === midiOutDeviceId)?.name ||
    (midiOutDeviceId ? "selected" : "none");
  const signalAgeMs = midiLastSignalAt > 0 ? now - midiLastSignalAt : Infinity;
  const midiSignalDisplay =
    signalAgeMs > 6000 ? "idle" : midiLastSignal;

  const renderAdapterOption = (
    adapter: OutputTargetAdapter,
    key: RoutingKey,
    selectedRouteId: string,
  ) => {
    const unavailable = adapter.availability !== "available";
    return (
      <label key={`${key}-${adapter.id}`} className="routing-row">
        <input
          type="radio"
          name={key}
          value={adapter.id}
          checked={selectedRouteId === adapter.id}
          disabled={unavailable}
          onChange={() => setRoute(key, adapter.id)}
        />
        <div className="routing-row-main">
          <div className="routing-row-title">
            {adapter.name}
            {unavailable && <span className="routing-pill">planned</span>}
          </div>
          <div className="routing-row-desc">{adapter.description}</div>
        </div>
      </label>
    );
  };

  return (
    <>
      <div className="header-connection-array" role="navigation" aria-label="Connection routes">
        {indicators.map((indicator) => (
          <button
            key={indicator.id}
            className="header-connection-chip"
            onClick={() => setOpenModal(indicator.id)}
            title={
              indicator.id === "midi"
                ? `${indicator.label} routing matrix\nroute: ${midiRouteLabel}\ndevice: ${midiDeviceLabel}\nchannel: ch${midiOutChannel}\nlast: ${midiSignalDisplay}`
                : `${indicator.label} routing matrix`
            }
          >
            <span
              className={`header-connection-dot ${indicator.connected ? "is-online" : "is-offline"} ${indicator.pulsing ? "is-pulsing" : ""}`}
              aria-hidden="true"
            />
            <span className="header-connection-label">{indicator.label}</span>
          </button>
        ))}
      </div>
      <div className="header-midi-signal" title={`last MIDI signal: ${midiSignalDisplay}`}>
        MIDI {midiSignalDisplay}
      </div>

      <Modal
        isOpen={openModal === "osc"}
        onClose={() => setOpenModal(null)}
        title="OSC Routing Matrix"
      >
        <div className="routing-modal-content">
          <div className="routing-modal-caption">
            Connection: {isOscConnected ? "connected" : "disconnected"}.
          </div>
          {getAdaptersByTransport("osc").map((adapter) =>
            renderAdapterOption(adapter, "oscOutRoute", oscOutRoute),
          )}
        </div>
      </Modal>

      <Modal
        isOpen={openModal === "midi"}
        onClose={() => setOpenModal(null)}
        title="MIDI Routing Matrix"
      >
        <div className="routing-modal-content">
          <div className="routing-modal-caption">
            Input link: {isMidiConnected ? "connected" : "disconnected"}.
          </div>
          <div className="routing-inline-controls">
            <label className="routing-inline-label">
              Output Device
              <select
                className="routing-inline-select"
                value={midiOutDeviceId || ""}
                onChange={(e) =>
                  setMidiOutDeviceId(e.target.value || null)
                }
              >
                {midiDevices.length === 0 ? (
                  <option value="">No MIDI outputs detected</option>
                ) : (
                  midiDevices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="routing-inline-label">
              Channel
              <select
                className="routing-inline-select"
                value={midiOutChannel}
                onChange={(e) => setMidiOutChannel(Number(e.target.value))}
              >
                {Array.from({ length: 16 }, (_, i) => i + 1).map((channel) => (
                  <option key={channel} value={channel}>
                    Ch {channel}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="routing-group">
            <div className="routing-group-title">Mode Default Channels</div>
            {(["harmony", "drum", "other"] as ModeId[]).map((modeKey) => (
              <label key={modeKey} className="routing-inline-label">
                {modeKey}
                <select
                  className="routing-inline-select"
                  value={modeDefaultChannels[modeKey]}
                  onChange={(e) =>
                    setModeDefaultChannel(modeKey, Number(e.target.value))
                  }
                >
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((channel) => (
                    <option key={`${modeKey}-${channel}`} value={channel}>
                      Ch {channel}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {getAdaptersByTransport("midi").map((adapter) =>
            renderAdapterOption(adapter, "midiOutRoute", midiOutRoute),
          )}
        </div>
      </Modal>

      <Modal
        isOpen={openModal === "file"}
        onClose={() => setOpenModal(null)}
        title="File Routing Matrix"
      >
        <div className="routing-modal-content">
          <div className="routing-modal-caption">Choose export adapters per format.</div>
          {fileRoutes.map((route) => (
            <div key={route.key} className="routing-group">
              <div className="routing-group-title">{route.label}</div>
              {getAdaptersByTransport("file")
                .filter((adapter) => adapter.format.toLowerCase() === route.label.toLowerCase())
                .map((adapter) => renderAdapterOption(adapter, route.key, route.routeId))}
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}

function HeaderTimelinePreview() {
  const sections = useProgressionStore((s) => s.sections);
  const transport = useLiveStore((s) => s.transport);
  const isOscConnected = useLiveStore((s) => s.isConnected);
  const isMidiConnected = useHardwareStore((s) => s.isConnected);
  const showHeaderConnectionCards = useRoutingStore(
    (s) => s.showHeaderConnectionCards,
  );
  const midiLastSignal = useRoutingStore((s) => s.midiLastSignal);
  const midiLastSignalAt = useRoutingStore((s) => s.midiLastSignalAt);
  const oscOutRoute = useRoutingStore((s) => s.oscOutRoute);
  const midiOutRoute = useRoutingStore((s) => s.midiOutRoute);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1280 : window.innerWidth,
  );

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const totalBeats = useMemo(
    () =>
      sections.reduce((songTotal, section) => {
        const sectionBeats = section.progression.reduce(
          (sum, chord) => sum + chord.duration,
          0,
        );
        return songTotal + sectionBeats * (section.repeats || 1);
      }, 0),
    [sections],
  );

  const pixelsPerBeat = computePxPerBeat({
    zoom: 0.45,
    minPx: 10,
    maxPx: 60,
    fitToView: false,
    totalBeats,
    viewportWidth,
  });

  const { currentBeat, isPlaying } = usePlayheadSync({ pixelsPerBeat, totalBeats });
  const [smoothedBeat, setSmoothedBeat] = useState(0);
  const anchorBeatRef = useRef(0);
  const anchorTimeRef = useRef(0);
  const lastRawBeatRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const now = performance.now();
    const tempo = transport?.tempo || 120;
    const beatsPerMs = tempo / 60000;

    if (lastRawBeatRef.current === null) {
      lastRawBeatRef.current = currentBeat;
      anchorBeatRef.current = currentBeat;
      anchorTimeRef.current = now;
      setSmoothedBeat(currentBeat);
      return;
    }

    let delta = currentBeat - lastRawBeatRef.current;
    if (totalBeats > 0) {
      const wrapThreshold = Math.max(1, totalBeats * 0.5);
      if (delta < -wrapThreshold) delta += totalBeats;
      if (delta > wrapThreshold) delta -= totalBeats;
    }

    const unwrappedMeasured = anchorBeatRef.current + delta;
    const predictedNow =
      anchorBeatRef.current + (now - anchorTimeRef.current) * beatsPerMs;
    const phaseError = unwrappedMeasured - predictedNow;

    if (Math.abs(phaseError) >= HEADER_TRANSPORT_HARD_SNAP_BEATS) {
      anchorBeatRef.current = unwrappedMeasured;
    } else {
      anchorBeatRef.current =
        predictedNow + phaseError * HEADER_TRANSPORT_CORRECTION_ALPHA;
    }
    anchorTimeRef.current = now;
    lastRawBeatRef.current = currentBeat;
  }, [currentBeat, totalBeats, transport]);

  useEffect(() => {
    const tick = () => {
      const tempo = transport?.tempo || 120;
      const beatsPerMs = tempo / 60000;
      const now = performance.now();
      const predicted = isPlaying
        ? anchorBeatRef.current + (now - anchorTimeRef.current) * beatsPerMs
        : anchorBeatRef.current;
      setSmoothedBeat(predicted);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isPlaying, transport]);

  const loopedBeat = totalBeats > 0 ? smoothedBeat % totalBeats : smoothedBeat;

  const cards = useMemo<HeaderCardData[]>(() => {
    const sectionCards: HeaderCardData[] = sections.slice(0, 2).map((section, i) => {
      const sectionBeats =
        section.progression.reduce((sum, chord) => sum + chord.duration, 0) || 4;
      return {
        id: `section-preview-${section.id}`,
        title: section.name || `Section ${i + 1}`,
        lines: [`${section.progression.length} chords`, `${sectionBeats} beats`],
        beats: Math.max(6, Math.min(16, sectionBeats)),
      };
    });

    const signalAgeMs =
      midiLastSignalAt > 0 ? Date.now() - midiLastSignalAt : Number.POSITIVE_INFINITY;
    const currentSignal = signalAgeMs > 7000 ? "idle" : midiLastSignal;

    const connectionCards: HeaderCardData[] = showHeaderConnectionCards
      ? [
          {
            id: "header-osc-card",
            title: "OSC ROUTE",
            lines: [
              isOscConnected ? "Connected" : "Disconnected",
              oscOutRoute,
            ],
            beats: 8,
          },
          {
            id: "header-midi-card",
            title: "MIDI ROUTE",
            lines: [
              isMidiConnected ? "Connected" : "Disconnected",
              `${midiOutRoute} • ${currentSignal}`,
            ],
            beats: 12,
          },
        ]
      : [];

    return [
      {
        id: "header-test-card",
        title: "Header Test Card",
        lines: ["Timeline visible through glass", "Footer-synced movement"],
        beats: 8,
      },
      {
        id: "header-readme-card",
        title: "README.md",
        lines: README_LINES,
        beats: 14,
      },
      ...connectionCards,
      ...sectionCards,
    ];
  }, [
    isMidiConnected,
    isOscConnected,
    midiLastSignal,
    midiLastSignalAt,
    midiOutRoute,
    oscOutRoute,
    sections,
    showHeaderConnectionCards,
  ]);

  const cycleWidth = useMemo(() => {
    if (!cards.length) return 1;
    const cardsWidth = cards.reduce((sum, card) => sum + card.beats * pixelsPerBeat, 0);
    return cardsWidth + HEADER_GAP_PX * (cards.length - 1);
  }, [cards, pixelsPerBeat]);

  const wrappedOffset = cycleWidth > 0 ? (loopedBeat * pixelsPerBeat) % cycleWidth : 0;
  const renderedCards = [...cards, ...cards];

  return (
    <div className="app-top-header-timeline" aria-hidden="true">
      <div
        className="app-top-header-scroll-strip"
        style={{ transform: `translate3d(${-wrappedOffset}px, 0, 0)` }}
      >
        {renderedCards.map((card, index) => (
          <article
            key={`${card.id}-${index}`}
            className="header-preview-card"
            style={{ width: `${card.beats * pixelsPerBeat}px` }}
          >
            <h3 className="header-preview-title">{card.title}</h3>
            {card.lines.map((line, lineIndex) => (
              <p key={`${card.id}-${index}-${lineIndex}`} className="header-preview-line">
                {line}
              </p>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    // Initialize range slider progress indication
    initializeRangeProgress();
  }, []);

  return (
    <div className="h-screen bg-app flex flex-col">
      {/* Header */}
      <header className="app-top-header">
        <HeaderTimelinePreview />
        <div className="app-top-header-menu-layer">
          <div className="header-brand">2nist</div>
          <div className="header-spacer" />
          <HeaderConnectionArray />
        </div>
      </header>

      {/* Main Editor */}
      <main className="flex-1 overflow-hidden">
        <ProgressionEditor />
      </main>
    </div>
  );
}

export default App;
