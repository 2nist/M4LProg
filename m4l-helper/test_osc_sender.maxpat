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
		"rect" : [ 44, 104, 600, 400 ],
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
					"text" : "OSC TEST SENDER"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-2",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 50, 50, 150, 22 ],
					"text" : "udpsend 127.0.0.1 11000"
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
					"text" : "Send OSC messages to M4L device (port 11000)"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-4",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 50, 100, 100, 22 ],
					"text" : "udpreceive 11001"
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
					"text" : "Receive OSC responses from M4L device (port 11001)"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-6",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 50, 150, 100, 22 ],
					"text" : "print OSC_RESPONSE"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-7",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 250, 175, 200, 20 ],
					"text" : "TEST COMMANDS"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-8",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ ],
					"patching_rect" : [ 250, 200, 150, 22 ],
					"text" : "/live/handshake \"1.0.0\" \"test\""
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-9",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ ],
					"patching_rect" : [ 250, 230, 100, 22 ],
					"text" : "/live/get_transport"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-10",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ ],
					"patching_rect" : [ 250, 260, 80, 22 ],
					"text" : "/live/set_tempo 140"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-11",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ ],
					"patching_rect" : [ 250, 290, 80, 22 ],
					"text" : "/live/get_tracks"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-12",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ ],
					"patching_rect" : [ 250, 320, 200, 22 ],
					"text" : "/live/create_progression \"test\" 4 60 1000 2000"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-13",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 50, 350, 400, 20 ],
					"text" : "Click messages to send OSC commands. Check Max console for responses."
				}

			}
 ],
		"lines" : [ 			{
				"source" : [ "obj-4", 0 ],
				"destination" : [ "obj-6", 0 ]
			}
, 			{
				"source" : [ "obj-8", 0 ],
				"destination" : [ "obj-2", 0 ]
			}
, 			{
				"source" : [ "obj-9", 0 ],
				"destination" : [ "obj-2", 0 ]
			}
, 			{
				"source" : [ "obj-10", 0 ],
				"destination" : [ "obj-2", 0 ]
			}
, 			{
				"source" : [ "obj-11", 0 ],
				"destination" : [ "obj-2", 0 ]
			}
, 			{
				"source" : [ "obj-12", 0 ],
				"destination" : [ "obj-2", 0 ]
			}
 ]
	}
}