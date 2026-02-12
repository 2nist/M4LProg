import { useState } from 'react';

export type ConnectionState = 'connected' | 'disconnected' | 'initializing' | 'error';

export interface ConnectionItem {
  id: string;
  name: string;
  type: string;
  state: ConnectionState;
  deviceName?: string;
  inputDevice?: string;
  outputDevice?: string;
  port?: string | number;
  lastMessage?: string;
  lastActivity?: string;
  error?: string;
  autoReconnect?: boolean;
}

interface Props {
  connections: ConnectionItem[];
  onReconnect?: (id: string) => void;
  onOpenSettings?: (id: string) => void;
}

export default function ConnectionStatus({ connections, onReconnect, onOpenSettings }: Props) {
  const [selected, setSelected] = useState<ConnectionItem | null>(null);

  return (
    <div className="p-4 w-full max-w-3xl">
      <h2 className="text-lg font-semibold mb-3">Connections</h2>
      <div className="space-y-2">
        {connections.map((c) => (
          <div key={c.id} className="flex items-center justify-between card p-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${c.state === 'connected' ? 'bg-green-400' : c.state === 'initializing' ? 'bg-yellow-400' : 'bg-gray-700'}`} />
              <div>
                <div className="text-sm font-medium">
                  {c.name} <span className="text-xs muted-text">· {c.type}</span>
                </div>
                <div className="text-xs muted-text">{c.deviceName ?? c.inputDevice ?? c.outputDevice ?? 'No device'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs muted-text text-right">
                <div>{c.lastMessage ?? '—'}</div>
                <div>{c.lastActivity ? new Date(c.lastActivity).toLocaleTimeString() : ''}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn-small" onClick={() => onReconnect?.(c.id)}>Reconnect</button>
                <button className="btn-ghost-small" onClick={() => { setSelected(c); onOpenSettings?.(c.id); }}>Settings</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <ConnectionSettingsModal
          item={selected}
          onClose={() => setSelected(null)}
          onReconnect={() => { onReconnect?.(selected.id); setSelected(null); }}
        />
      )}
    </div>
  );
}

function ConnectionSettingsModal({ item, onClose, onReconnect }: { item: ConnectionItem; onClose: () => void; onReconnect: () => void; }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-black/60 absolute inset-0" onClick={onClose} />
      <div className="bg-card rounded-lg p-4 z-10 w-96">
        <h3 className="font-semibold">{item.name} settings</h3>
        <div className="mt-3 text-sm muted-text">
          <div>Type: {item.type}</div>
          <div>State: {item.state}</div>
          <div>Device: {item.deviceName ?? '—'}</div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn" onClick={onReconnect}>Reconnect</button>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
