export type OutputTransportType = "osc" | "midi" | "file";
export type OutputFormat = "osc" | "midi" | "json";
export type AdapterAvailability = "available" | "planned";

export interface OutputTargetAdapter {
  id: string;
  name: string;
  transport: OutputTransportType;
  format: OutputFormat;
  direction: "out";
  availability: AdapterAvailability;
  description: string;
}

export const OUTPUT_ADAPTERS: OutputTargetAdapter[] = [
  {
    id: "live-osc",
    name: "Ableton Live OSC",
    transport: "osc",
    format: "osc",
    direction: "out",
    availability: "available",
    description: "Send arranged progression to Live/M4L via OSC.",
  },
  {
    id: "json-file",
    name: "Arrangement JSON File",
    transport: "file",
    format: "json",
    direction: "out",
    availability: "available",
    description: "Export arrangement snapshot to JSON.",
  },
  {
    id: "midi-file",
    name: "Standard MIDI File",
    transport: "file",
    format: "midi",
    direction: "out",
    availability: "available",
    description: "Export rendered arrangement as .mid.",
  },
  {
    id: "webmidi-out",
    name: "General MIDI Out",
    transport: "midi",
    format: "midi",
    direction: "out",
    availability: "available",
    description: "Route arrangement to external MIDI devices and synths.",
  },
];

export function getAdapterById(id: string): OutputTargetAdapter | undefined {
  return OUTPUT_ADAPTERS.find((adapter) => adapter.id === id);
}

export function getAdaptersByTransport(
  transport: OutputTransportType,
): OutputTargetAdapter[] {
  return OUTPUT_ADAPTERS.filter((adapter) => adapter.transport === transport);
}

export function getAvailableAdaptersByFormat(
  format: OutputFormat,
): OutputTargetAdapter[] {
  return OUTPUT_ADAPTERS.filter(
    (adapter) => adapter.format === format && adapter.availability === "available",
  );
}
