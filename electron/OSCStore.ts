import { create } from "zustand";
import { initializeOSC, closeOSC } from "./services/OSCService";

interface OSCState {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useOSCStore = create<OSCState>((set) => ({
  isConnected: false,

  connect: async () => {
    const success = await initializeOSC();
    set({ isConnected: success });
  },

  disconnect: () => {
    closeOSC();
    set({ isConnected: false });
  },
}));
