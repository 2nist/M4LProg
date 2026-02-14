import { beforeEach, describe, expect, it } from "vitest";
import { useRoutingStore } from "@/stores/routingStore";

describe("routingStore", () => {
  beforeEach(() => {
    useRoutingStore.setState({
      oscOutRoute: "live-osc",
      midiOutRoute: "webmidi-out",
      midiOutDeviceId: null,
      midiOutChannel: 1,
      modeDefaultChannels: { harmony: 1, drum: 10, other: 2 },
      midiOutPulseAt: 0,
      midiLastSignal: "idle",
      midiLastSignalAt: 0,
      connectionEvents: [],
      showHeaderConnectionCards: true,
      jsonExportRoute: "json-file",
      midiExportRoute: "midi-file",
    });
  });

  it("clamps global midi channel into 1..16", () => {
    const state = useRoutingStore.getState();
    state.setMidiOutChannel(0);
    expect(useRoutingStore.getState().midiOutChannel).toBe(1);
    state.setMidiOutChannel(99);
    expect(useRoutingStore.getState().midiOutChannel).toBe(16);
  });

  it("sets mode default channel with clamping", () => {
    const state = useRoutingStore.getState();
    state.setModeDefaultChannel("drum", 12);
    expect(useRoutingStore.getState().modeDefaultChannels.drum).toBe(12);
    state.setModeDefaultChannel("drum", 0);
    expect(useRoutingStore.getState().modeDefaultChannels.drum).toBe(1);
  });

  it("records midi signal and pushes event history", () => {
    const state = useRoutingStore.getState();
    state.setMidiOutSignal("on C4 v100 ch1");
    const next = useRoutingStore.getState();
    expect(next.midiLastSignal).toContain("on C4");
    expect(next.connectionEvents.length).toBe(1);
    expect(next.connectionEvents[0].source).toBe("midi");
  });

  it("pushes and clears connection events", () => {
    const state = useRoutingStore.getState();
    state.pushConnectionEvent("osc", "connected");
    state.pushConnectionEvent("file", "exported JSON");
    expect(useRoutingStore.getState().connectionEvents.length).toBe(2);
    state.clearConnectionEvents();
    expect(useRoutingStore.getState().connectionEvents.length).toBe(0);
  });
});

