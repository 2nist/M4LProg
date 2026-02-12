import ConnectionStatus, { ConnectionItem } from './ConnectionStatus';
import { useState } from 'react';

export default {
  title: 'Connection/ConnectionStatus',
  component: ConnectionStatus,
  parameters: {
    docs: {
      description: {
        component: 'Displays connection status for various system components (MIDI, OSC, IPC, etc.) with real-time status indicators.',
      },
    },
  },
  argTypes: {
    connections: {
      control: { type: 'object' },
      description: 'Array of connection items to display',
    },
    onReconnect: {
      action: 'reconnect',
      description: 'Called when user clicks reconnect button',
    },
    onOpenSettings: {
      action: 'openSettings',
      description: 'Called when user clicks settings button',
    },
  },
};

const createConnection = (
  id: string,
  name: string,
  type: ConnectionItem['type'],
  state: ConnectionItem['state'],
  overrides: Partial<ConnectionItem> = {}
): ConnectionItem => ({
  id,
  name,
  type,
  state,
  deviceName: `${name} Device`,
  lastMessage: `Sample ${type} message`,
  lastActivity: new Date().toISOString(),
  autoReconnect: true,
  ...overrides,
});

export const Default = {
  args: {
    connections: [
      createConnection('midi-atom', 'ATOM SQ', 'MIDI', 'connected', {
        inputDevice: 'ATOM SQ In',
        outputDevice: 'ATOM SQ Out',
        lastMessage: '176,14,65',
      }),
      createConnection('osc-ableton', 'OSC → Ableton', 'OSC', 'connected', {
        deviceName: '127.0.0.1:11000 ↔ 127.0.0.1:11001',
        lastMessage: '/chordgen/handshake',
      }),
      createConnection('ipc-electron', 'Electron IPC', 'IPC', 'connected', {
        lastMessage: 'window.electronAPI available',
      }),
    ],
  },
};

export const WithErrors = {
  args: {
    connections: [
      createConnection('midi-atom', 'ATOM SQ', 'MIDI', 'error', {
        lastMessage: 'Connection timeout',
      }),
      createConnection('osc-ableton', 'OSC → Ableton', 'OSC', 'initializing'),
      createConnection('ipc-electron', 'Electron IPC', 'IPC', 'connected'),
    ],
  },
};

export const AllStates = {
  args: {
    connections: [
      createConnection('midi-1', 'ATOM SQ', 'MIDI', 'connected'),
      createConnection('midi-2', 'Launchpad', 'MIDI', 'initializing'),
      createConnection('midi-3', 'APC40', 'MIDI', 'error'),
      createConnection('midi-4', 'Maschine', 'MIDI', 'disconnected'),
      createConnection('osc-1', 'Ableton Live', 'OSC', 'connected'),
      createConnection('osc-2', 'Max/MSP', 'OSC', 'initializing'),
      createConnection('ipc-1', 'Electron Main', 'IPC', 'connected'),
      createConnection('dev-1', 'Vite Dev Server', 'DEV', 'connected'),
    ],
  },
};

export const Interactive = () => {
  const [connections, setConnections] = useState<ConnectionItem[]>([
    createConnection('midi-atom', 'ATOM SQ', 'MIDI', 'connected'),
    createConnection('osc-ableton', 'OSC → Ableton', 'OSC', 'initializing'),
    createConnection('ipc-electron', 'Electron IPC', 'IPC', 'connected'),
  ]);

  const handleReconnect = (id: string) => {
    setConnections(prev =>
      prev.map(conn =>
        conn.id === id
          ? { ...conn, state: 'initializing' as const, lastActivity: new Date().toISOString() }
          : conn
      )
    );

    // Simulate reconnection after 2 seconds
    setTimeout(() => {
      setConnections(prev =>
        prev.map(conn =>
          conn.id === id
            ? { ...conn, state: 'connected' as const, lastActivity: new Date().toISOString() }
            : conn
        )
      );
    }, 2000);
  };

  const handleOpenSettings = (id: string) => {
    alert(`Opening settings for ${id}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <ConnectionStatus
        connections={connections}
        onReconnect={handleReconnect}
        onOpenSettings={handleOpenSettings}
      />
    </div>
  );
};

Interactive.parameters = {
  docs: {
    description: {
      story: 'Interactive story demonstrating real-time state changes and user interactions.',
    },
  },
};
