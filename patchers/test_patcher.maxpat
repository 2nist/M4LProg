{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 9,
			"minor" : 0,
			"revision" : 0,
			"architecture" : "x64",
			"modernui" : 1
		}
,
		"classnamespace" : "box",
		"rect" : [ 0, 44, 800, 600 ],
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
					"text" : "loadbang"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-2",
					"maxclass" : "js",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 50, 100, 200, 22 ],
					"text" : "tests/hardware_tests.js"
				}

			}
, 			{
				"box" : 				{
					"box" : 					{
						"id" : "obj-3",
						"maxclass" : "newobj",
						"numinlets" : 1,
						"numoutlets" : 0,
					}

				}
,
				"maxclass" : "bpatcher",
				"name" : "test_output.maxpat",
				"numinlets" : 1,
				"numoutlets" : 0,
				"outlettype" : [ ],
				"patching_rect" : [ 50, 150, 300, 200 ]
			}
, 			{
				"box" : 				{
					"id" : "obj-4",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"outlettype" : [ ],
					"patching_rect" : [ 50, 400, 100, 22 ],
					"text" : "print test_results"
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
				"source" : [ "obj-2", 0 ],
				"destination" : [ "obj-4", 0 ]
			}
 ]
	}
}