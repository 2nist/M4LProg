import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import * as OSCService from "../services/live/OSCService";

interface OSCState {
  isConnected: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => void;
}

export const useOSCStore = create<OSCState>()(
  subscribeWithSelector((set) => ({
    isConnected: false,

    connect: async () => {
      const connected = await OSCService.initializeOSC();
      if (connected) {
        set({ isConnected: true });
      }
      return connected;
    },

    disconnect: () => {
      OSCService.closeOSC();
      set({ isConnected: false });
    },
  })),
);