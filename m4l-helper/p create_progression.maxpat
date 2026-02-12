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
		"rect" : [ 44, 104, 500, 300 ],
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
					"maxclass" : "js",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 20, 50, 150, 22 ],
					"text" : "osc_router.js"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-3",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 20, 80, 100, 22 ],
					"text" : "live.object live_set"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-4",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 20, 110, 120, 22 ],
					"text" : "live.path tracks 0 clip_slots 0"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-5",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 20, 140, 80, 22 ],
					"text" : "live.path create_clip"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-6",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 20, 170, 80, 22 ],
					"text" : "live.path set_notes"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-7",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 20, 200, 150, 22 ],
					"text" : "prepend /live/create_progression_ack"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-8",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 20, 230, 30, 22 ],
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
					"patching_rect" : [ 200, 200, 60, 22 ],
					"text" : "delay 200"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-10",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 250, 20, 250, 20 ],
					"text" : "Create MIDI clip with progression notes"
				}

			}
 ],
		"lines" : [ 			{
				"source" : [ "obj-1", 0 ],
				"destination" : [ "obj-2", 0 ]
			}
, 			{
				"source" : [ "obj-2", 0 ],
				"destination" : [ "obj-6", 0 ]
			}
, 			{
				"source" : [ "obj-3", 0 ],
				"destination" : [ "obj-4", 0 ]
			}
, 			{
				"source" : [ "obj-4", 0 ],
				"destination" : [ "obj-5", 0 ]
			}
, 			{
				"source" : [ "obj-5", 0 ],
				"destination" : [ "obj-6", 0 ]
			}
, 			{
				"source" : [ "obj-6", 0 ],
				"destination" : [ "obj-9", 0 ]
			}
, 			{
				"source" : [ "obj-9", 0 ],
				"destination" : [ "obj-7", 0 ]
			}
, 			{
				"source" : [ "obj-7", 0 ],
				"destination" : [ "obj-8", 0 ]
			}
 ]
	}
}