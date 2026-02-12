# M4L Helper Device - Detailed Max Patch Implementation

**Version:** 1.0.0
**Date:** February 11, 2026
**Target:** Max for Live 8+ (Ableton Live 10+)
**Size:** ~180 lines of Max patching

## Overview

This specification provides the complete blueprint for building the M4L Helper device that enables OSC communication between the Electron app and Ableton Live.

## Max Patch Layout

### Canvas Setup
- **Patcher Size:** 1200 x 800 pixels
- **Grid:** 15x15, snap enabled
- **Background:** Default (white)
- **Title:** "ChordGen Live Helper"

### Object Layout (Left to Right)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ OSC INPUT/OUTPUT SECTION                    COMMAND ROUTING                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ [udpreceive 11000] → [route /live/*] → [p create_progression]              │
│ [udpsend 127.0.0.1 11001] ← [p get_transport]                               │
│                                     → [p get_tracks]                        │
│                                     → [p set_tempo]                         │
│                                     → [p handshake]                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ LIVE API SECTION                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ [live.object live_set] → [live.path tracks $1]                             │
│                        → [live.observer current_song_time]                 │
│                        → [live.observer tempo]                              │
│                        → [live.observer is_playing]                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ UTILITY OBJECTS                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ [js osc_router.js] [pak] [sprintf] [delay]                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Detailed Object Implementation

### 1. OSC Communication Objects

#### A. UDP Receiver (Input from Electron)
```
Object: udpreceive
Arguments: 11000
Position: x=50, y=50
Comment: "Receive OSC from Electron app (port 11000)"
Connections: → route object
```

#### B. UDP Sender (Output to Electron)
```
Object: udpsend
Arguments: 127.0.0.1 11001
Position: x=50, y=100
Comment: "Send OSC responses to Electron app (port 11001)"
Connections: ← from all response handlers
```

#### C. OSC Message Router
```
Object: route
Arguments: /live/create_progression /live/get_transport /live/get_tracks /live/set_tempo /live/handshake
Position: x=200, y=50
Comment: "Route OSC messages to appropriate handlers"
Connections:
- Outlet 0 → p create_progression
- Outlet 1 → p get_transport
- Outlet 2 → p get_tracks
- Outlet 3 → p set_tempo
- Outlet 4 → p handshake
```

### 2. Command Handler Subpatchers

#### A. Create Progression Handler (`p create_progression`)
**Size:** 400x300, Position: x=400, y=50

**Objects inside:**
```
1. [inlet] (x=20, y=20) → [t l l] (x=80, y=20)
   - Left outlet → [pak track_idx start_beat] (x=140, y=20)
   - Right outlet → [js osc_router.js] (x=200, y=20) method: formatNotes

2. [pak track_idx start_beat] (x=140, y=60) → [live.path tracks $1] (x=140, y=100)

3. [live.path tracks $1] (x=140, y=100) → [live.object] (x=140, y=140)
   - live.object arguments: create_clip 0

4. [js osc_router.js] (x=200, y=20) outlet → [live.object] (x=200, y=140)
   - live.object arguments: set_notes

5. [live.path tracks $1] (x=140, y=100) → [live.object] (x=260, y=140)
   - live.object arguments: duplicate_clip_to_arrangement $2 0
   - Connect start_beat from pak to $2

6. [live.path tracks $1] (x=140, y=100) → [live.object] (x=320, y=140)
   - live.object arguments: delete_clip

7. [message] (x=200, y=200) "1 Created progression"
   → [prepend /live/response] (x=200, y=220) → [outlet] (x=200, y=240)
```

#### B. Get Transport Handler (`p get_transport`)
**Size:** 300x200, Position: x=400, y=150

**Objects inside:**
```
1. [inlet] (x=20, y=20) → [t b] (x=80, y=20) → [live.object live_set] (x=80, y=60)
   - live.object: get current_song_time

2. [live.object live_set] (x=80, y=60) → [live.object live_set] (x=80, y=100)
   - live.object: get tempo

3. [live.object live_set] (x=80, y=100) → [live.object live_set] (x=80, y=140)
   - live.object: get is_playing

4. [pak] (x=200, y=60) collects: is_playing, current_song_time, tempo
   → [prepend /live/transport] (x=200, y=100) → [outlet] (x=200, y=120)
```

#### C. Get Tracks Handler (`p get_tracks`)
**Size:** 350x250, Position: x=400, y=250

**Objects inside:**
```
1. [inlet] (x=20, y=20) → [uzi 8] (x=80, y=20) → [live.path tracks $1] (x=80, y=60)

2. [live.path tracks $1] (x=80, y=60) → [live.object] (x=80, y=100)
   - live.object: get name

3. [live.path tracks $1] (x=80, y=60) → [live.object] (x=140, y=100)
   - live.object: get color

4. [pak $1 name color] (x=200, y=100) → [prepend /live/track_info] (x=200, y=140)
   → [outlet] (x=200, y=160)
```

#### D. Set Tempo Handler (`p set_tempo`)
**Size:** 250x150, Position: x=400, y=350

**Objects inside:**
```
1. [inlet] (x=20, y=20) → [live.object live_set] (x=80, y=20)
   - live.object: set tempo $1

2. [live.object live_set] (x=80, y=20) → [delay 100] (x=80, y=60)
   → [message] (x=80, y=80) "1 Tempo set"
   → [prepend /live/response] (x=80, y=100) → [outlet] (x=80, y=120)
```

#### E. Handshake Handler (`p handshake`)
**Size:** 200x100, Position: x=400, y=450

**Objects inside:**
```
1. [inlet] (x=20, y=20) → [message] (x=80, y=20) "1 Connected to ChordGen"
   → [prepend /live/response] (x=80, y=40) → [outlet] (x=80, y=60)
```

### 3. Live API Observer Objects

#### A. Transport State Observers
```
1. [live.object live_set] (x=600, y=50)
   - Connect to: [live.observer current_song_time] (x=600, y=100)
   - Connect to: [live.observer tempo] (x=650, y=100)
   - Connect to: [live.observer is_playing] (x=700, y=100)

2. [pak] (x=650, y=150) collects observer outputs
   → [prepend /live/transport] (x=650, y=180) → [udpsend] (x=650, y=200)
```

#### B. Track Information (Optional - for future expansion)
```
[live.object live_set tracks $1] (x=600, y=250)
→ [live.observer name] (x=600, y=300)
→ [live.observer color] (x=650, y=300)
→ [pak] → [prepend /live/track_info] → [udpsend]
```

### 4. Utility Objects

#### A. JavaScript Processor
```
Object: js
Arguments: osc_router.js
Position: x=800, y=50
Comment: "Handle complex note formatting and message processing"
Connections: Used by create_progression subpatcher
```

#### B. Message Formatting
```
Object: sprintf
Arguments: /live/%s
Position: x=800, y=100
Comment: "Format OSC address strings"
```

#### C. Data Packaging
```
Object: pak
Arguments: (varies by use)
Position: x=800, y=150
Comment: "Bundle multiple values into lists"
```

#### D. Timing Control
```
Object: delay
Arguments: 100
Position: x=800, y=200
Comment: "Delay responses to ensure Live API operations complete"
```

## Complete Max Patch Code

```maxpat
{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 8,
			"minor" : 5,
			"revision" : 6,
			"architecture" : "x64",
			"modernui" : 1
		},
		"classnamespace" : "box",
		"rect" : [ 0, 0, 1200, 800 ],
		"bglocked" : 0,
		"openinpresentation" : 0,
		"default_fontsize" : 12.0,
		"default_fontface" : 0,
		"default_fontname" : "Arial",
		"gridonopen" : 1,
		"gridsize" : [ 15, 15 ],
		"gridsnaponopen" : 1,
		"objectsnaponopen" : 1,
		"statusbarvisible" : 2,
		"toolbarvisible" : 1,
		"lefttoolbarpinned" : 0,
		"toptoolbarpinned" : 0,
		"righttoolbarpinned" : 0,
		"bottomtoolbarpinned" : 0,
		"toolbars_unpinned_last_save" : 0,
		"tallnewobj" : 0,
		"boxanimatetime" : 200,
		"enablehscroll" : 1,
		"enablevscroll" : 1,
		"devicewidth" : 0.0,
		"description" : "",
		"digest" : "",
		"tags" : "",
		"style" : "",
		"subpatcher_template" : "",
		"assistshowspatchername" : 0,
		"boxes" : [ 			{
				"box" : 				{
					"id" : "obj-1",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 50, 50, 100, 22 ],
					"text" : "udpreceive 11000"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-2",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 50, 100, 150, 22 ],
					"text" : "udpsend 127.0.0.1 11001"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-3",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 5,
					"outlettype" : [ "", "", "", "", "" ],
					"patching_rect" : [ 200, 50, 300, 22 ],
					"text" : "route /live/create_progression /live/get_transport /live/get_tracks /live/set_tempo /live/handshake"
				}

			}
, 			{
				"box" : 				{
					"box" : 					{
						"id" : "obj-4",
						"maxclass" : "newobj",
						"numinlets" : 1,
						"numoutlets" : 1,
						"outlettype" : [ "" ],
						"patching_rect" : [ 20, 20, 30, 22 ],
						"text" : "inlet"
					}

				}
,
				"maxclass" : "bpatcher",
				"name" : "p create_progression",
				"numinlets" : 1,
				"numoutlets" : 1,
				"outlettype" : [ "" ],
				"patching_rect" : [ 400, 50, 150, 22 ]
			}
, 			{
				"box" : 				{
					"box" : 					{
						"id" : "obj-5",
						"maxclass" : "newobj",
						"numinlets" : 1,
						"numoutlets" : 1,
						"outlettype" : [ "" ],
						"patching_rect" : [ 20, 20, 30, 22 ],
						"text" : "inlet"
					}

				}
,
				"maxclass" : "bpatcher",
				"name" : "p get_transport",
				"numinlets" : 1,
				"numoutlets" : 1,
				"outlettype" : [ "" ],
				"patching_rect" : [ 400, 150, 150, 22 ]
			}
, 			{
				"box" : 				{
					"box" : 					{
						"id" : "obj-6",
						"maxclass" : "newobj",
						"numinlets" : 1,
						"numoutlets" : 1,
						"outlettype" : [ "" ],
						"patching_rect" : [ 20, 20, 30, 22 ],
						"text" : "inlet"
					}

				}
,
				"maxclass" : "bpatcher",
				"name" : "p get_tracks",
				"numinlets" : 1,
				"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 400, 250, 150, 22 ]
				}

			}
, 			{
				"box" : 				{
					"box" : 					{
						"id" : "obj-7",
						"maxclass" : "newobj",
						"numinlets" : 1,
						"numoutlets" : 1,
						"outlettype" : [ "" ],
						"patching_rect" : [ 20, 20, 30, 22 ],
						"text" : "inlet"
					}

				}
,
				"maxclass" : "bpatcher",
				"name" : "p set_tempo",
				"numinlets" : 1,
				"numoutlets" : 1,
				"outlettype" : [ "" ],
				"patching_rect" : [ 400, 350, 150, 22 ]
			}
, 			{
				"box" : 				{
					"box" : 					{
						"id" : "obj-8",
						"maxclass" : "newobj",
						"numinlets" : 1,
						"numoutlets" : 1,
						"outlettype" : [ "" ],
						"patching_rect" : [ 20, 20, 30, 22 ],
						"text" : "inlet"
					}

				}
,
				"maxclass" : "bpatcher",
				"name" : "p handshake",
				"numinlets" : 1,
				"numoutlets" : 1,
				"outlettype" : [ "" ],
				"patching_rect" : [ 400, 450, 150, 22 ]
			}
, 			{
				"box" : 				{
					"id" : "obj-9",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "" ],
					"patching_rect" : [ 600, 50, 100, 22 ],
					"text" : "live.object live_set"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-10",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 600, 100, 120, 22 ],
					"text" : "live.observer current_song_time"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-11",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 650, 100, 80, 22 ],
					"text" : "live.observer tempo"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-12",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 700, 100, 100, 22 ],
					"text" : "live.observer is_playing"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-13",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 650, 150, 60, 22 ],
					"text" : "pak"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-14",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 650, 180, 120, 22 ],
					"text" : "prepend /live/transport"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-15",
					"maxclass" : "js",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 800, 50, 150, 22 ],
					"text" : "osc_router.js"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-16",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 800, 100, 100, 22 ],
					"text" : "sprintf /live/%s"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-17",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 800, 200, 60, 22 ],
					"text" : "delay 100"
				}

			}
 ],
		"lines" : [ 			{
				"source" : [ "obj-1", 0 ],
				"destination" : [ "obj-3", 0 ]
			}
, 			{
				"source" : [ "obj-3", 0 ],
				"destination" : [ "obj-4", 0 ]
			}
, 			{
				"source" : [ "obj-3", 1 ],
				"destination" : [ "obj-5", 0 ]
			}
, 			{
				"source" : [ "obj-3", 2 ],
				"destination" : [ "obj-6", 0 ]
			}
, 			{
				"source" : [ "obj-3", 3 ],
				"destination" : [ "obj-7", 0 ]
			}
, 			{
				"source" : [ "obj-3", 4 ],
				"destination" : [ "obj-8", 0 ]
			}
, 			{
				"source" : [ "obj-9", 0 ],
				"destination" : [ "obj-10", 0 ]
			}
, 			{
				"source" : [ "obj-9", 1 ],
				"destination" : [ "obj-11", 0 ]
			}
, 			{
				"source" : [ "obj-9", 2 ],
				"destination" : [ "obj-12", 0 ]
			}
, 			{
				"source" : [ "obj-10", 0 ],
				"destination" : [ "obj-13", 0 ]
			}
, 			{
				"source" : [ "obj-11", 0 ],
				"destination" : [ "obj-13", 1 ]
			}
, 			{
				"source" : [ "obj-12", 0 ],
				"destination" : [ "obj-13", 2 ]
			}
, 			{
				"source" : [ "obj-13", 0 ],
				"destination" : [ "obj-14", 0 ]
			}
, 			{
				"source" : [ "obj-14", 0 ],
				"destination" : [ "obj-2", 0 ]
			}
, 			{
				"source" : [ "obj-4", 0 ],
				"destination" : [ "obj-2", 0 ]
			}
, 			{
				"source" : [ "obj-5", 0 ],
				"destination" : [ "obj-2", 0 ]
			}
, 			{
				"source" : [ "obj-6", 0 ],
				"destination" : [ "obj-2", 0 ]
			}
, 			{
				"source" : [ "obj-7", 0 ],
				"destination" : [ "obj-2", 0 ]
			}
, 			{
				"source" : [ "obj-8", 0 ],
				"destination" : [ "obj-2", 0 ]
			}
 ]
	}
}
```

## Subpatcher Implementations

### Create Progression Subpatcher

```maxpat
{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 8,
			"minor" : 5,
			"revision" : 6,
			"architecture" : "x64",
			"modernui" : 1
		},
		"classnamespace" : "box",
		"rect" : [ 0, 0, 400, 300 ],
		"bglocked" : 0,
		"openinpresentation" : 0,
		"default_fontsize" : 12.0,
		"default_fontface" : 0,
		"default_fontname" : "Arial",
		"gridonopen" : 1,
		"gridsize" : [ 15, 15 ],
		"gridsnaponopen" : 1,
		"objectsnaponopen" : 1,
		"statusbarvisible" : 2,
		"toolbarvisible" : 1,
		"lefttoolbarpinned" : 0,
		"toptoolbarpinned" : 0,
		"righttoolbarpinned" : 0,
		"bottomtoolbarpinned" : 0,
		"toolbars_unpinned_last_save" : 0,
		"tallnewobj" : 0,
		"boxanimatetime" : 200,
		"enablehscroll" : 1,
		"enablevscroll" : 1,
		"devicewidth" : 0.0,
		"description" : "",
		"digest" : "",
		"tags" : "",
		"style" : "",
		"subpatcher_template" : "",
		"assistshowspatchername" : 0,
		"boxes" : [ 			{
				"box" : 				{
					"id" : "obj-1",
					"maxclass" : "inlet",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 20, 20, 30, 22 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-2",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 80, 20, 40, 22 ],
					"text" : "t l l"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-3",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 140, 20, 120, 22 ],
					"text" : "pak track_idx start_beat"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-4",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 200, 20, 150, 22 ],
					"text" : "js osc_router.js"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-5",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 140, 100, 120, 22 ],
					"text" : "live.path tracks $1"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-6",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 140, 140, 100, 22 ],
					"text" : "live.object create_clip 0"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-7",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 200, 140, 100, 22 ],
					"text" : "live.object set_notes"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-8",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 260, 140, 180, 22 ],
					"text" : "live.object duplicate_clip_to_arrangement $1 $2 0"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-9",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 320, 140, 100, 22 ],
					"text" : "live.object delete_clip"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-10",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 200, 200, 100, 22 ],
					"text" : "1 Created progression"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-11",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 200, 220, 120, 22 ],
					"text" : "prepend /live/response"
				}

			}
, 			{
				"box" : 				{
					"id" : "outlet",
					"maxclass" : "outlet",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 200, 240, 30, 22 ]
				}

			}
 ],
		"lines" : [ 			{
				"source" : [ "obj-1", 0 ],
				"destination" : [ "obj-2", 0 ]
			}
, 			{
				"source" : [ "obj-2", 0 ],
				"destination" : [ "obj-3", 0 ]
			}
, 			{
				"source" : [ "obj-2", 1 ],
				"destination" : [ "obj-4", 0 ]
			}
, 			{
				"source" : [ "obj-3", 0 ],
				"destination" : [ "obj-5", 0 ]
			}
, 			{
				"source" : [ "obj-5", 0 ],
				"destination" : [ "obj-6", 0 ]
			}
, 			{
				"source" : [ "obj-5", 0 ],
				"destination" : [ "obj-8", 0 ]
			}
, 			{
				"source" : [ "obj-5", 0 ],
				"destination" : [ "obj-9", 0 ]
			}
, 			{
				"source" : [ "obj-4", 0 ],
				"destination" : [ "obj-7", 0 ]
			}
, 			{
				"source" : [ "obj-6", 0 ],
				"destination" : [ "obj-7", 0 ]
			}
, 			{
				"source" : [ "obj-7", 0 ],
				"destination" : [ "obj-8", 0 ]
			}
, 			{
				"source" : [ "obj-8", 0 ],
				"destination" : [ "obj-9", 0 ]
			}
, 			{
				"source" : [ "obj-9", 0 ],
				"destination" : [ "obj-10", 0 ]
			}
, 			{
				"source" : [ "obj-10", 0 ],
				"destination" : [ "obj-11", 0 ]
			}
, 			{
				"source" : [ "obj-11", 0 ],
				"destination" : [ "obj-12", 0 ]
			}
 ]
	}
}
```

## Step-by-Step Implementation Guide

### Phase 1: Basic OSC Setup (30 minutes)

1. **Create new Max patch** named "ChordGen Live Helper.maxpat"
2. **Add UDP communication:**
   - `udpreceive 11000` (top-left)
   - `udpsend 127.0.0.1 11001` (below receiver)
3. **Add OSC router:**
   - `route /live/create_progression /live/get_transport /live/get_tracks /live/set_tempo /live/handshake`
4. **Test basic routing:**
   - Send test message: `/live/handshake "1.0.0" "test"`
   - Should receive: `/live/response 1 "Connected to ChordGen"`

### Phase 2: Transport Observers (20 minutes)

1. **Add Live API objects:**
   - `live.object live_set` (center)
   - Connect to three observers: `current_song_time`, `tempo`, `is_playing`
2. **Add data bundling:**
   - `pak` to collect observer outputs
   - `prepend /live/transport` to format message
3. **Connect to UDP sender**

### Phase 3: Command Handlers (60 minutes)

1. **Create subpatchers** for each command
2. **Implement handshake** (simple response)
3. **Implement set_tempo** (single Live API call)
4. **Implement get_transport** (query Live state)
5. **Implement get_tracks** (iterate through tracks)
6. **Implement create_progression** (complex MIDI clip creation)

### Phase 4: Testing & Refinement (30 minutes)

1. **Test each command individually**
2. **Verify OSC message formats**
3. **Test with Electron app**
4. **Debug timing issues**
5. **Add error handling**

### Phase 5: Packaging (15 minutes)

1. **Save as device:** File → Save As Device...
2. **Set device name:** "ChordGen Live Helper"
3. **Add to User Library**
4. **Test device loading in Live**

## Testing Commands

Use Max's `udpsend 127.0.0.1 11000` to test:

```max
; Handshake
/live/handshake "1.0.0" "test"

; Set tempo
/live/set_tempo 140

; Get transport
/live/get_transport

; Get tracks
/live/get_tracks

; Create progression (C major chord)
/live/create_progression 0 0 60 0 4 100 64 0 4 100 67 0 4 100
```

## Troubleshooting

### Common Issues

1. **No OSC messages received:**
   - Check UDP ports (11000/11001)
   - Verify Max UDP objects are active
   - Test with `udpsend` in separate Max patch

2. **Live API calls fail:**
   - Ensure device is loaded on a MIDI track
   - Check Live API permissions
   - Verify track indices exist

3. **Timing issues:**
   - Add `delay` objects for Live API operations
   - Use `defer` for thread safety

### Debug Tools

- **OSC Monitor:** Use `udpreceive` in separate patch to monitor messages
- **Live API Inspector:** Use `live.observer` to monitor Live state changes
- **Message Logger:** Add `print` objects to trace message flow

## Performance Considerations

- **Minimal CPU usage:** Only active when receiving OSC commands
- **Fast response:** Direct Live API calls, no polling
- **Memory efficient:** Small patch footprint (~200 objects)
- **Thread safe:** Uses Max's high-priority thread for Live API

## Future Enhancements

- **Transport controls:** Add play/pause/stop commands
- **Clip manipulation:** Edit existing clips
- **Scene management:** Trigger scenes and cue points
- **Device control:** Adjust device parameters
- **MIDI routing:** Send MIDI to hardware devices

---

**Total Implementation Time:** ~2.5 hours
**Testing Time:** ~1 hour
**Total:** ~3.5 hours

This specification provides everything needed to build a fully functional M4L helper device for the ChordGen application.