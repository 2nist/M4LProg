{
	"patcher" : {
		"fileversion" : 1,
		"appversion" : {
			"major" : 8,
			"minor" : 5,
			"revision" : 0,
			"architecture" : "x64",
			"modernui" : 1
		},
		"classnamespace" : "box",
		"rect" : [ 100.0, 100.0, 800.0, 600.0 ],
		"bglocked" : 0,
		"openinpresentation" : 1,
		"default_fontsize" : 12.0,
		"default_fontface" : 0,
		"default_fontname" : "Arial",
		"gridonopen" : 1,
		"gridsize" : [ 15.0, 15.0 ],
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
		"boxes" : [
			{
				"box" : {
					"id" : "obj-transition_menu",
					"maxclass" : "umenu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "", "" ],
					"patching_rect" : [ 10.0, 200.0, 150.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 200.0, 150.0, 22.0 ],
					"items" : [ "none", "backdoor_dominant", "plagal", "modal_borrow" ]
				}
			},
			{
				"box" : {
					"id" : "obj-trigger_button",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 170.0, 200.0, 80.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 170.0, 200.0, 80.0, 22.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-transition_msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 10.0, 230.0, 150.0, 22.0 ],
					"text" : "set_transition_type $1"
				}
			},
			{
				"box" : {
					"id" : "obj-trigger_msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 170.0, 230.0, 150.0, 22.0 ],
					"text" : "trigger_create_arrangement"
				}
			},
			{
				"box" : {
					"id" : "obj-ai_toggle",
					"maxclass" : "toggle",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 10.0, 260.0, 24.0, 24.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 260.0, 24.0, 24.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-ai_label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 40.0, 260.0, 80.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 40.0, 260.0, 80.0, 20.0 ],
					"text" : "AI Suggestions"
				}
			},
			{
				"box" : {
					"id" : "obj-ai_msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 10.0, 290.0, 150.0, 22.0 ],
					"text" : "toggle_ai $1"
				}
			},
			{
				"box" : {
					"id" : "obj-api_key",
					"maxclass" : "textedit",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "", "int", "", "" ],
					"patching_rect" : [ 200.0, 260.0, 300.0, 30.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 200.0, 260.0, 300.0, 30.0 ],
					"text" : "Enter Gemini API Key"
				}
			},
			{
				"box" : {
					"id" : "obj-prev_button",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 10.0, 100.0, 50.0, 50.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 100.0, 50.0, 50.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-next_button",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 70.0, 100.0, 50.0, 50.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 70.0, 100.0, 50.0, 50.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-new_button",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 130.0, 100.0, 50.0, 50.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 130.0, 100.0, 50.0, 50.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-prev_msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 10.0, 160.0, 50.0, 22.0 ],
					"text" : "prev_section"
				}
			},
			{
				"box" : {
					"id" : "obj-next_msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 70.0, 160.0, 50.0, 22.0 ],
					"text" : "next_section"
				}
			},
			{
				"box" : {
					"id" : "obj-new_msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 130.0, 160.0, 50.0, 22.0 ],
					"text" : "new_section"
				}
			},
			{
				"box" : {
					"id" : "obj-section_display",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 10.0, 50.0, 300.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 50.0, 300.0, 20.0 ],
					"text" : "Section 1"
				}
			},
			{
				"box" : {
					"id" : "obj-ai_status_display",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 10.0, 330.0, 300.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 330.0, 300.0, 20.0 ],
					"text" : "AI Status: Idle"
				}
			},
			{
				"box" : {
					"id" : "obj-ai_suggestions_display",
					"maxclass" : "textedit",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "", "int", "", "" ],
					"patching_rect" : [ 10.0, 360.0, 500.0, 100.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 360.0, 500.0, 100.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-inversion_display",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 320.0, 50.0, 150.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 320.0, 50.0, 150.0, 20.0 ],
					"text" : "Inversion: 0"
				}
			},
			{
				"box" : {
					"id" : "obj-drop_display",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 480.0, 50.0, 150.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 480.0, 50.0, 150.0, 20.0 ],
					"text" : "Drop: 0"
				}
			},
			{
				"box" : {
					"id" : "obj-analysis_status_msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 10.0, 470.0, 150.0, 22.0 ],
					"text" : "set $1"
				}
			},
			{
				"box" : {
					"id" : "obj-analysis_status_display",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 10.0, 500.0, 500.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 500.0, 500.0, 20.0 ],
					"text" : "Analysis: No patterns detected"
				}
			},
			{
				"box" : {
					"id" : "obj-saved_progressions_msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 520.0, 100.0, 150.0, 22.0 ],
					"text" : "set $1"
				}
			},
			{
				"box" : {
					"id" : "obj-saved_progressions_display",
					"maxclass" : "textedit",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "", "int", "", "" ],
					"patching_rect" : [ 520.0, 130.0, 250.0, 150.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 520.0, 130.0, 250.0, 150.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-export_button",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 550.0, 200.0, 80.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 550.0, 200.0, 80.0, 22.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-combine_export",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 550.0, 230.0, 150.0, 22.0 ],
					"text" : "export_midi $1"
				}
			},
			{
				"box" : {
					"id" : "obj-filename_input",
					"maxclass" : "textedit",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "", "int", "", "" ],
					"patching_rect" : [ 710.0, 200.0, 200.0, 30.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 710.0, 200.0, 200.0, 30.0 ],
					"text" : "progression.mid"
				}
			},
			{
				"box" : {
					"id" : "obj-dialog_button",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 710.0, 160.0, 24.0, 24.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 710.0, 160.0, 24.0, 24.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-dialog_msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 710.0, 130.0, 150.0, 22.0 ],
					"text" : "write"
				}
			},
			{
				"box" : {
					"id" : "obj-file_dialog",
					"maxclass" : "savedialog",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 710.0, 100.0, 100.0, 22.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-v8",
					"maxclass" : "v8",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "", "", "", "" ],
					"patching_rect" : [ 200.0, 300.0, 200.0, 100.0 ],
					"saved_object_attributes" : {
						"filename" : "Main_Controller.js",
						"parameter_enable" : 0
					},
					"text" : "v8 Main_Controller.js"
				}
			},
			{
				"box" : {
					"id" : "obj-route_outputs",
					"maxclass" : "route",
					"numinlets" : 1,
					"numoutlets" : 10,
					"outlettype" : [ "", "", "", "", "", "", "", "", "", "" ],
					"patching_rect" : [ 200.0, 410.0, 600.0, 22.0 ],
					"text" : "route midi sysex display ai_status ai_suggestions inversion drop analysis saved_progressions"
				}
			},
			{
				"box" : {
					"id" : "obj-out_midi",
					"maxclass" : "midiout",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 200.0, 450.0, 50.0, 15.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-out_sysex",
					"maxclass" : "midiout",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 260.0, 450.0, 50.0, 15.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-set_display",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 320.0, 450.0, 150.0, 22.0 ],
					"text" : "set $1"
				}
			},
			{
				"box" : {
					"id" : "obj-dict",
					"maxclass" : "dict",
					"numinlets" : 2,
					"numoutlets" : 4,
					"outlettype" : [ "", "", "", "" ],
					"patching_rect" : [ 400.0, 300.0, 100.0, 100.0 ],
					"saved_object_attributes" : {
						"embed" : 1,
						"parameter_enable" : 0,
						"parameter_mappable" : 0
					},
					"text" : "dict song_data"
				}
			},
			{
				"box" : {
					"id" : "obj-pattr",
					"maxclass" : "pattrstorage",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 400.0, 410.0, 100.0, 22.0 ],
					"saved_object_attributes" : {
						"client_rect" : [ 100, 100, 500, 600 ],
						"parameter_enable" : 0,
						"parameter_mappable" : 0,
						"storage_rect" : [ 200, 200, 800, 500 ]
					}
				}
			},
			{
				"box" : {
					"id" : "obj-10",
					"maxclass" : "midiin",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 10.0, 10.0, 50.0, 15.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-12",
					"maxclass" : "midiparse",
					"numinlets" : 1,
					"numoutlets" : 7,
					"outlettype" : [ "", "", "", "", "", "", "" ],
					"patching_rect" : [ 10.0, 40.0, 200.0, 22.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-1",
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 70.0, 10.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-2",
					"maxclass" : "prepend",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 70.0, 50.0, 100.0, 22.0 ],
					"text" : "prepend handle_message"
				}
			},
			{
				"box" : {
					"id" : "obj-3",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 70.0, 80.0, 100.0, 22.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-build_url",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 520.0, 300.0, 200.0, 22.0 ],
					"text" : "url https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$1"
				}
			},
			{
				"box" : {
					"id" : "obj-build_request",
					"maxclass" : "v8",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 520.0, 340.0, 200.0, 50.0 ],
					"saved_object_attributes" : {
						"filename" : "build_gemini_request.js",
						"parameter_enable" : 0
					},
					"text" : "v8 build_gemini_request.js"
				}
			},
			{
				"box" : {
					"id" : "obj-jit_uldl",
					"maxclass" : "jit.uldl",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 520.0, 400.0, 200.0, 50.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-route_responses",
					"maxclass" : "route",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "", "", "", "" ],
					"patching_rect" : [ 520.0, 460.0, 200.0, 22.0 ],
					"text" : "route error done data"
				}
			},
			{
				"box" : {
					"id" : "obj-save_file",
					"maxclass" : "v8",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 550.0, 260.0, 150.0, 50.0 ],
					"saved_object_attributes" : {
						"filename" : "file_saver.js",
						"parameter_enable" : 0
					},
					"text" : "v8 file_saver.js"
				}
			},
			{
				"box" : {
					"id" : "obj-route_file",
					"maxclass" : "route",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "" ],
					"patching_rect" : [ 550.0, 320.0, 150.0, 22.0 ],
					"text" : "route filename data"
				}
			},
			{
				"box" : {
					"id" : "obj-write_prep",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 550.0, 350.0, 150.0, 22.0 ],
					"text" : "write $1"
				}
			},
			{
				"box" : {
					"id" : "obj-file_writer",
					"maxclass" : "fileout",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 550.0, 380.0, 150.0, 22.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-unpack_bytes",
					"maxclass" : "unpack",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 710.0, 350.0, 150.0, 22.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-progression_name_input",
					"maxclass" : "textedit",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "", "int", "", "" ],
					"patching_rect" : [ 520.0, 290.0, 150.0, 30.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 520.0, 290.0, 150.0, 30.0 ],
					"text" : "Progression Name"
				}
			},
			{
				"box" : {
					"id" : "obj-save_progression_button",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 680.0, 290.0, 50.0, 30.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 680.0, 290.0, 50.0, 30.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-load_progression_button",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 740.0, 290.0, 50.0, 30.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 740.0, 290.0, 50.0, 30.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-delete_progression_button",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 800.0, 290.0, 50.0, 30.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 800.0, 290.0, 50.0, 30.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-save_progression_msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 680.0, 330.0, 150.0, 22.0 ],
					"text" : "progression_save $1"
				}
			},
			{
				"box" : {
					"id" : "obj-load_progression_msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 740.0, 330.0, 150.0, 22.0 ],
					"text" : "progression_load $1"
				}
			},
			{
				"box" : {
					"id" : "obj-delete_progression_msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 800.0, 330.0, 150.0, 22.0 ],
					"text" : "progression_delete $1"
				}
			}
		],
		"lines" : [
			{
				"patchline" : {
					"destination" : [ "obj-12", 0 ],
					"source" : [ "obj-10", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-v8", 0 ],
					"source" : [ "obj-12", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-2", 0 ],
					"source" : [ "obj-1", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-3", 0 ],
					"source" : [ "obj-2", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-v8", 0 ],
					"source" : [ "obj-3", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-route_outputs", 0 ],
					"source" : [ "obj-v8", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-out_midi", 0 ],
					"source" : [ "obj-route_outputs", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-out_sysex", 0 ],
					"source" : [ "obj-route_outputs", 1 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-pattr", 0 ],
					"source" : [ "obj-dict", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-prev_msg", 0 ],
					"source" : [ "obj-prev_button", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-next_msg", 0 ],
					"source" : [ "obj-next_button", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-new_msg", 0 ],
					"source" : [ "obj-new_button", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-v8", 0 ],
					"source" : [ "obj-prev_msg", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-v8", 0 ],
					"source" : [ "obj-next_msg", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-v8", 0 ],
					"source" : [ "obj-new_msg", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-set_display", 0 ],
					"source" : [ "obj-route_outputs", 2 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ai_status_display", 0 ],
					"source" : [ "obj-route_outputs", 3 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ai_suggestions_display", 0 ],
					"source" : [ "obj-route_outputs", 4 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-inversion_display", 0 ],
					"source" : [ "obj-route_outputs", 5 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-drop_display", 0 ],
					"source" : [ "obj-route_outputs", 6 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-analysis_status_msg", 0 ],
					"source" : [ "obj-route_outputs", 7 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-analysis_status_display", 0 ],
					"source" : [ "obj-analysis_status_msg", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-saved_progressions_msg", 0 ],
					"source" : [ "obj-route_outputs", 8 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-saved_progressions_display", 0 ],
					"source" : [ "obj-saved_progressions_msg", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-section_display", 0 ],
					"source" : [ "obj-set_display", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-transition_msg", 0 ],
					"source" : [ "obj-transition_menu", 1 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-trigger_msg", 0 ],
					"source" : [ "obj-trigger_button", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-v8", 0 ],
					"source" : [ "obj-transition_msg", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-v8", 0 ],
					"source" : [ "obj-trigger_msg", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ai_msg", 0 ],
					"source" : [ "obj-ai_toggle", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-v8", 0 ],
					"source" : [ "obj-ai_msg", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-build_url", 1 ],
					"source" : [ "obj-api_key", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-jit_uldl", 0 ],
					"source" : [ "obj-build_url", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-build_request", 0 ],
					"source" : [ "obj-v8", 3 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-build_request", 1 ],
					"source" : [ "obj-api_key", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-jit_uldl", 0 ],
					"source" : [ "obj-build_request", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-route_responses", 0 ],
					"source" : [ "obj-jit_uldl", 1 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-v8", 0 ],
					"source" : [ "obj-route_responses", 2 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-combine_export", 1 ],
					"source" : [ "obj-filename_input", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-save_file", 0 ],
					"source" : [ "obj-combine_export", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-combine_export", 0 ],
					"source" : [ "obj-export_button", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-dialog_msg", 0 ],
					"source" : [ "obj-dialog_button", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-file_dialog", 0 ],
					"source" : [ "obj-dialog_msg", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-filename_input", 0 ],
					"source" : [ "obj-file_dialog", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-route_file", 0 ],
					"source" : [ "obj-save_file", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-write_prep", 1 ],
					"source" : [ "obj-route_file", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-file_writer", 0 ],
					"source" : [ "obj-write_prep", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-unpack_bytes", 0 ],
					"source" : [ "obj-route_file", 1 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-file_writer", 0 ],
					"source" : [ "obj-unpack_bytes", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-save_progression_msg", 1 ],
					"source" : [ "obj-progression_name_input", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-load_progression_msg", 1 ],
					"source" : [ "obj-progression_name_input", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-delete_progression_msg", 1 ],
					"source" : [ "obj-progression_name_input", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-save_progression_msg", 0 ],
					"source" : [ "obj-save_progression_button", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-load_progression_msg", 0 ],
					"source" : [ "obj-load_progression_button", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-delete_progression_msg", 0 ],
					"source" : [ "obj-delete_progression_button", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-v8", 0 ],
					"source" : [ "obj-save_progression_msg", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-v8", 0 ],
					"source" : [ "obj-load_progression_msg", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-v8", 0 ],
					"source" : [ "obj-delete_progression_msg", 0 ]
				}
			}
		]
	}
}
