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
		"rect" : [ 44, 104, 400, 300 ],
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
					"patching_rect" : [ 20, 20, 30, 22 ],
					"text" : "inlet"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-2",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "" ],
					"patching_rect" : [ 20, 50, 100, 22 ],
					"text" : "live.object live_set"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-3",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 20, 80, 120, 22 ],
					"text" : "live.observer current_song_time"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-4",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 150, 80, 80, 22 ],
					"text" : "live.observer tempo"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-5",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 250, 80, 100, 22 ],
					"text" : "live.observer is_playing"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-6",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 20, 120, 60, 22 ],
					"text" : "pak"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-7",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 20, 150, 120, 22 ],
					"text" : "prepend /live/transport"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-8",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 20, 180, 30, 22 ],
					"text" : "outlet"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-9",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 150, 50, 100, 22 ],
					"text" : "t b b b"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-10",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 150, 180, 60, 22 ],
					"text" : "delay 50"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-11",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 250, 20, 150, 20 ],
					"text" : "Get current transport state from Live"
				}

			}
 ],
		"lines" : [ 			{
				"source" : [ "obj-1", 0 ],
				"destination" : [ "obj-9", 0 ]
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
				"source" : [ "obj-2", 2 ],
				"destination" : [ "obj-5", 0 ]
			}
, 			{
				"source" : [ "obj-3", 0 ],
				"destination" : [ "obj-6", 0 ]
			}
, 			{
				"source" : [ "obj-4", 0 ],
				"destination" : [ "obj-6", 1 ]
			}
, 			{
				"source" : [ "obj-5", 0 ],
				"destination" : [ "obj-6", 2 ]
			}
, 			{
				"source" : [ "obj-6", 0 ],
				"destination" : [ "obj-7", 0 ]
			}
, 			{
				"source" : [ "obj-7", 0 ],
				"destination" : [ "obj-10", 0 ]
			}
, 			{
				"source" : [ "obj-10", 0 ],
				"destination" : [ "obj-8", 0 ]
			}
, 			{
				"source" : [ "obj-9", 0 ],
				"destination" : [ "obj-2", 0 ]
			}
, 			{
				"source" : [ "obj-9", 1 ],
				"destination" : [ "obj-3", 0 ]
			}
, 			{
				"source" : [ "obj-9", 2 ],
				"destination" : [ "obj-4", 0 ]
			}
, 			{
				"source" : [ "obj-9", 3 ],
				"destination" : [ "obj-5", 0 ]
			}
 ]
	}
}