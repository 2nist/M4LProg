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
		"rect" : [ 44, 104, 1200, 600 ],
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
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 50, 20, 200, 20 ],
					"text" : "OSC INPUT/OUTPUT SECTION"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-2",
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
					"id" : "obj-3",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 50, 75, 250, 20 ],
					"text" : "Receive OSC from Electron app (port 11000)"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-4",
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
					"id" : "obj-5",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 50, 125, 250, 20 ],
					"text" : "Send OSC responses to Electron app (port 11001)"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-6",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 5,
					"outlettype" : [ "", "", "", "", "" ],
					"patching_rect" : [ 250, 50, 350, 22 ],
					"text" : "route /live/create_progression /live/get_transport /live/get_tracks /live/set_tempo /live/handshake"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-7",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 250, 75, 300, 20 ],
					"text" : "Route OSC messages to appropriate handlers"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-8",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 650, 20, 200, 20 ],
					"text" : "COMMAND HANDLERS"
				}

			}
, 			{
				"box" : 				{
					"box" : 					{
						"id" : "obj-9",
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
				"patching_rect" : [ 650, 50, 150, 22 ]
			}
, 			{
				"box" : 				{
					"box" : 					{
						"id" : "obj-10",
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
				"patching_rect" : [ 650, 100, 150, 22 ]
			}
, 			{
				"box" : 				{
					"box" : 					{
						"id" : "obj-11",
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
			"patching_rect" : [ 650, 150, 150, 22 ]
		}
, 			{
				"box" : 				{
					"box" : 					{
						"id" : "obj-12",
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
				"patching_rect" : [ 650, 200, 150, 22 ]
			}
, 			{
				"box" : 				{
					"box" : 					{
						"id" : "obj-13",
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
				"patching_rect" : [ 650, 250, 150, 22 ]
			}
, 			{
				"box" : 				{
					"id" : "obj-14",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 850, 20, 200, 20 ],
					"text" : "LIVE API SECTION"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-15",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "" ],
					"patching_rect" : [ 850, 50, 100, 22 ],
					"text" : "live.object live_set"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-16",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 850, 75, 150, 20 ],
					"text" : "Access Live song object"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-17",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 850, 100, 120, 22 ],
					"text" : "live.observer current_song_time"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-18",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 900, 100, 80, 22 ],
					"text" : "live.observer tempo"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-19",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 950, 100, 100, 22 ],
					"text" : "live.observer is_playing"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-20",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 900, 150, 60, 22 ],
					"text" : "pak"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-21",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 900, 180, 120, 22 ],
					"text" : "prepend /live/transport"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-22",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 850, 125, 200, 20 ],
					"text" : "Monitor transport state changes"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-23",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 50, 200, 200, 20 ],
					"text" : "UTILITY OBJECTS"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-24",
					"maxclass" : "js",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 50, 230, 150, 22 ],
					"text" : "osc_router.js"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-25",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 50, 255, 250, 20 ],
					"text" : "Handle complex note formatting and message processing"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-26",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 250, 230, 100, 22 ],
					"text" : "sprintf /live/%s"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-27",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 400, 230, 60, 22 ],
					"text" : "delay 100"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-28",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 250, 255, 150, 20 ],
					"text" : "Format OSC address strings"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-29",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 400, 255, 200, 20 ],
					"text" : "Delay responses to ensure Live API operations complete"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-30",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 50, 300, 400, 20 ],
					"text" : "TESTING: Use udpsend in separate patch to send messages to port 11000"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-31",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ ],
					"patching_rect" : [ 50, 330, 150, 22 ],
					"text" : "/live/handshake \"1.0.0\" \"test\""
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-32",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ ],
					"patching_rect" : [ 250, 330, 100, 22 ],
					"text" : "/live/get_transport"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-33",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ ],
					"patching_rect" : [ 400, 330, 80, 22 ],
					"text" : "/live/set_tempo 140"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-34",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 50, 380, 100, 22 ],
					"text" : "print OSC_IN"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-35",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 200, 380, 100, 22 ],
					"text" : "print OSC_OUT"
				}

			}
 ],
		"lines" : [ 			{
				"source" : [ "obj-2", 0 ],
				"destination" : [ "obj-6", 0 ]
			}
, 			{
				"source" : [ "obj-2", 0 ],
				"destination" : [ "obj-34", 0 ]
			}
, 			{
				"source" : [ "obj-6", 0 ],
				"destination" : [ "obj-9", 0 ]
			}
, 			{
				"source" : [ "obj-6", 1 ],
				"destination" : [ "obj-10", 0 ]
			}
, 			{
				"source" : [ "obj-6", 2 ],
				"destination" : [ "obj-11", 0 ]
			}
, 			{
				"source" : [ "obj-6", 3 ],
				"destination" : [ "obj-12", 0 ]
			}
, 			{
				"source" : [ "obj-6", 4 ],
				"destination" : [ "obj-13", 0 ]
			}
, 			{
				"source" : [ "obj-9", 0 ],
				"destination" : [ "obj-4", 0 ]
			}
, 			{
				"source" : [ "obj-10", 0 ],
				"destination" : [ "obj-4", 0 ]
			}
, 			{
				"source" : [ "obj-11", 0 ],
				"destination" : [ "obj-4", 0 ]
			}
, 			{
				"source" : [ "obj-12", 0 ],
				"destination" : [ "obj-4", 0 ]
			}
, 			{
				"source" : [ "obj-13", 0 ],
				"destination" : [ "obj-4", 0 ]
			}
, 			{
				"source" : [ "obj-15", 0 ],
				"destination" : [ "obj-17", 0 ]
			}
, 			{
				"source" : [ "obj-15", 1 ],
				"destination" : [ "obj-18", 0 ]
			}
, 			{
				"source" : [ "obj-15", 2 ],
				"destination" : [ "obj-19", 0 ]
			}
, 			{
				"source" : [ "obj-17", 0 ],
				"destination" : [ "obj-20", 0 ]
			}
, 			{
				"source" : [ "obj-18", 0 ],
				"destination" : [ "obj-20", 1 ]
			}
, 			{
				"source" : [ "obj-19", 0 ],
				"destination" : [ "obj-20", 2 ]
			}
, 			{
				"source" : [ "obj-20", 0 ],
				"destination" : [ "obj-21", 0 ]
			}
, 			{
				"source" : [ "obj-21", 0 ],
				"destination" : [ "obj-4", 0 ]
			}
, 			{
				"source" : [ "obj-21", 0 ],
				"destination" : [ "obj-35", 0 ]
			}
, 			{
				"source" : [ "obj-31", 0 ],
				"destination" : [ "obj-4", 0 ]
			}
, 			{
				"source" : [ "obj-32", 0 ],
				"destination" : [ "obj-4", 0 ]
			}
, 			{
				"source" : [ "obj-33", 0 ],
				"destination" : [ "obj-4", 0 ]
			}
 ]
	}
}