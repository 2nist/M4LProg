import{j as e}from"./jsx-runtime-u17CrQMm.js";import{r as g}from"./iframe-C3dj3Pg4.js";import"./preload-helper-PPVm8Dsz.js";function u({connections:s,onReconnect:i,onOpenSettings:o}){const[a,c]=g.useState(null);return e.jsxs("div",{className:"p-4 w-full max-w-3xl",children:[e.jsx("h2",{className:"text-lg font-semibold mb-3",children:"Connections"}),e.jsx("div",{className:"space-y-2",children:s.map(n=>e.jsxs("div",{className:"flex items-center justify-between card p-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:`w-3 h-3 rounded-full ${n.state==="connected"?"bg-green-400":n.state==="initializing"?"bg-yellow-400":"bg-gray-700"}`}),e.jsxs("div",{children:[e.jsxs("div",{className:"text-sm font-medium",children:[n.name," ",e.jsxs("span",{className:"text-xs muted-text",children:["· ",n.type]})]}),e.jsx("div",{className:"text-xs muted-text",children:n.deviceName??n.inputDevice??n.outputDevice??"No device"})]})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsxs("div",{className:"text-xs muted-text text-right",children:[e.jsx("div",{children:n.lastMessage??"—"}),e.jsx("div",{children:n.lastActivity?new Date(n.lastActivity).toLocaleTimeString():""})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{className:"btn-small",onClick:()=>i?.(n.id),children:"Reconnect"}),e.jsx("button",{className:"btn-ghost-small",onClick:()=>{c(n),o?.(n.id)},children:"Settings"})]})]})]},n.id))}),a&&e.jsx(C,{item:a,onClose:()=>c(null),onReconnect:()=>{i?.(a.id),c(null)}})]})}function C({item:s,onClose:i,onReconnect:o}){return e.jsxs("div",{className:"fixed inset-0 flex items-center justify-center z-50",children:[e.jsx("div",{className:"bg-black/60 absolute inset-0",onClick:i}),e.jsxs("div",{className:"bg-card rounded-lg p-4 z-10 w-96",children:[e.jsxs("h3",{className:"font-semibold",children:[s.name," settings"]}),e.jsxs("div",{className:"mt-3 text-sm muted-text",children:[e.jsxs("div",{children:["Type: ",s.type]}),e.jsxs("div",{children:["State: ",s.state]}),e.jsxs("div",{children:["Device: ",s.deviceName??"—"]})]}),e.jsxs("div",{className:"mt-4 flex justify-end gap-2",children:[e.jsx("button",{className:"btn",onClick:o,children:"Reconnect"}),e.jsx("button",{className:"btn-ghost",onClick:i,children:"Close"})]})]})]})}u.__docgenInfo={description:"",methods:[],displayName:"ConnectionStatus",props:{connections:{required:!0,tsType:{name:"Array",elements:[{name:"ConnectionItem"}],raw:"ConnectionItem[]"},description:""},onReconnect:{required:!1,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""},onOpenSettings:{required:!1,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""}}};const x={title:"Connection/ConnectionStatus",component:u,parameters:{docs:{description:{component:"Displays connection status for various system components (MIDI, OSC, IPC, etc.) with real-time status indicators."}}},argTypes:{connections:{control:{type:"object"},description:"Array of connection items to display"},onReconnect:{action:"reconnect",description:"Called when user clicks reconnect button"},onOpenSettings:{action:"openSettings",description:"Called when user clicks settings button"}}},t=(s,i,o,a,c={})=>({id:s,name:i,type:o,state:a,deviceName:`${i} Device`,lastMessage:`Sample ${o} message`,lastActivity:new Date().toISOString(),autoReconnect:!0,...c}),l={args:{connections:[t("midi-atom","ATOM SQ","MIDI","connected",{inputDevice:"ATOM SQ In",outputDevice:"ATOM SQ Out",lastMessage:"176,14,65"}),t("osc-ableton","OSC → Ableton","OSC","connected",{deviceName:"127.0.0.1:11000 ↔ 127.0.0.1:11001",lastMessage:"/chordgen/handshake"}),t("ipc-electron","Electron IPC","IPC","connected",{lastMessage:"window.electronAPI available"})]}},m={args:{connections:[t("midi-atom","ATOM SQ","MIDI","error",{lastMessage:"Connection timeout"}),t("osc-ableton","OSC → Ableton","OSC","initializing"),t("ipc-electron","Electron IPC","IPC","connected")]}},p={args:{connections:[t("midi-1","ATOM SQ","MIDI","connected"),t("midi-2","Launchpad","MIDI","initializing"),t("midi-3","APC40","MIDI","error"),t("midi-4","Maschine","MIDI","disconnected"),t("osc-1","Ableton Live","OSC","connected"),t("osc-2","Max/MSP","OSC","initializing"),t("ipc-1","Electron Main","IPC","connected"),t("dev-1","Vite Dev Server","DEV","connected")]}},d=()=>{const[s,i]=g.useState([t("midi-atom","ATOM SQ","MIDI","connected"),t("osc-ableton","OSC → Ableton","OSC","initializing"),t("ipc-electron","Electron IPC","IPC","connected")]),o=c=>{i(n=>n.map(r=>r.id===c?{...r,state:"initializing",lastActivity:new Date().toISOString()}:r)),setTimeout(()=>{i(n=>n.map(r=>r.id===c?{...r,state:"connected",lastActivity:new Date().toISOString()}:r))},2e3)},a=c=>{alert(`Opening settings for ${c}`)};return e.jsx("div",{style:{padding:20},children:e.jsx(u,{connections:s,onReconnect:o,onOpenSettings:a})})};d.parameters={docs:{description:{story:"Interactive story demonstrating real-time state changes and user interactions."}}};d.__docgenInfo={description:"",methods:[],displayName:"Interactive"};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    connections: [createConnection('midi-atom', 'ATOM SQ', 'MIDI', 'connected', {
      inputDevice: 'ATOM SQ In',
      outputDevice: 'ATOM SQ Out',
      lastMessage: '176,14,65'
    }), createConnection('osc-ableton', 'OSC → Ableton', 'OSC', 'connected', {
      deviceName: '127.0.0.1:11000 ↔ 127.0.0.1:11001',
      lastMessage: '/chordgen/handshake'
    }), createConnection('ipc-electron', 'Electron IPC', 'IPC', 'connected', {
      lastMessage: 'window.electronAPI available'
    })]
  }
}`,...l.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    connections: [createConnection('midi-atom', 'ATOM SQ', 'MIDI', 'error', {
      lastMessage: 'Connection timeout'
    }), createConnection('osc-ableton', 'OSC → Ableton', 'OSC', 'initializing'), createConnection('ipc-electron', 'Electron IPC', 'IPC', 'connected')]
  }
}`,...m.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    connections: [createConnection('midi-1', 'ATOM SQ', 'MIDI', 'connected'), createConnection('midi-2', 'Launchpad', 'MIDI', 'initializing'), createConnection('midi-3', 'APC40', 'MIDI', 'error'), createConnection('midi-4', 'Maschine', 'MIDI', 'disconnected'), createConnection('osc-1', 'Ableton Live', 'OSC', 'connected'), createConnection('osc-2', 'Max/MSP', 'OSC', 'initializing'), createConnection('ipc-1', 'Electron Main', 'IPC', 'connected'), createConnection('dev-1', 'Vite Dev Server', 'DEV', 'connected')]
  }
}`,...p.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`() => {
  const [connections, setConnections] = useState<ConnectionItem[]>([createConnection('midi-atom', 'ATOM SQ', 'MIDI', 'connected'), createConnection('osc-ableton', 'OSC → Ableton', 'OSC', 'initializing'), createConnection('ipc-electron', 'Electron IPC', 'IPC', 'connected')]);
  const handleReconnect = (id: string) => {
    setConnections(prev => prev.map(conn => conn.id === id ? {
      ...conn,
      state: 'initializing' as const,
      lastActivity: new Date().toISOString()
    } : conn));

    // Simulate reconnection after 2 seconds
    setTimeout(() => {
      setConnections(prev => prev.map(conn => conn.id === id ? {
        ...conn,
        state: 'connected' as const,
        lastActivity: new Date().toISOString()
      } : conn));
    }, 2000);
  };
  const handleOpenSettings = (id: string) => {
    alert(\`Opening settings for \${id}\`);
  };
  return <div style={{
    padding: 20
  }}>\r
      <ConnectionStatus connections={connections} onReconnect={handleReconnect} onOpenSettings={handleOpenSettings} />\r
    </div>;
}`,...d.parameters?.docs?.source}}};const h=["Default","WithErrors","AllStates","Interactive"];export{p as AllStates,l as Default,d as Interactive,m as WithErrors,h as __namedExportsOrder,x as default};
