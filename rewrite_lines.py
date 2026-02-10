from pathlib import Path

path = Path('patchers/ATOM SQ Chordgen Patch.js')
text = path.read_text()
marker = '"id" : "obj-unpack_bytes"'
marker_idx = text.index(marker)
lines_start = text.index(',\r\n\t\t,\r\n\t\t\t"lines" : [', marker_idx)
lines_end = text.rfind('\r\n\t\t]\r\n\t}\r\n}')
if lines_end == -1:
    raise SystemExit('could not find end of lines block')
entries = [
    ('obj-12', 0, 'obj-10', 0),
    ('obj-v8', 0, 'obj-12', 0),
    ('obj-2', 0, 'obj-1', 0),
    ('obj-3', 0, 'obj-2', 0),
    ('obj-v8', 0, 'obj-3', 0),
    ('obj-route_outputs', 0, 'obj-v8', 0),
    ('obj-out_midi', 0, 'obj-route_outputs', 0),
    ('obj-out_sysex', 0, 'obj-route_outputs', 1),
    ('obj-pattr', 0, 'obj-dict', 0),
    ('obj-prev_msg', 0, 'obj-prev_button', 0),
    ('obj-next_msg', 0, 'obj-next_button', 0),
    ('obj-new_msg', 0, 'obj-new_button', 0),
    ('obj-v8', 0, 'obj-prev_msg', 0),
    ('obj-v8', 0, 'obj-next_msg', 0),
    ('obj-v8', 0, 'obj-new_msg', 0),
    ('obj-set_display', 0, 'obj-route_outputs', 2),
    ('obj-ai_status_display', 0, 'obj-route_outputs', 3),
    ('obj-ai_suggestions_display', 0, 'obj-route_outputs', 4),
    ('obj-inversion_display', 0, 'obj-route_outputs', 5),
    ('obj-drop_display', 0, 'obj-route_outputs', 6),
    ('obj-analysis_status_msg', 0, 'obj-route_outputs', 7),
    ('obj-analysis_status_display', 0, 'obj-analysis_status_msg', 0),
    ('obj-saved_progressions_msg', 0, 'obj-route_outputs', 8),
    ('obj-saved_progressions_display', 0, 'obj-saved_progressions_msg', 0),
    ('obj-section_display', 0, 'obj-set_display', 0),
    ('obj-transition_msg', 0, 'obj-transition_menu', 1),
    ('obj-trigger_msg', 0, 'obj-trigger_button', 0),
    ('obj-v8', 0, 'obj-transition_msg', 0),
    ('obj-v8', 0, 'obj-trigger_msg', 0),
    ('obj-ai_msg', 0, 'obj-ai_toggle', 0),
    ('obj-v8', 0, 'obj-ai_msg', 0),
    ('obj-build_url', 1, 'obj-api_key', 0),
    ('obj-jit_uldl', 0, 'obj-build_url', 0),
    ('obj-build_request', 0, 'obj-v8', 3),
    ('obj-build_request', 1, 'obj-api_key', 0),
    ('obj-jit_uldl', 0, 'obj-build_request', 0),
    ('obj-route_responses', 0, 'obj-jit_uldl', 1),
    ('obj-v8', 0, 'obj-route_responses', 2),
    ('obj-combine_export', 1, 'obj-filename_input', 0),
    ('obj-v8', 0, 'obj-combine_export', 0),
    ('obj-combine_export', 0, 'obj-export_button', 0),
    ('obj-dialog_msg', 0, 'obj-dialog_button', 0),
    ('obj-file_dialog', 0, 'obj-dialog_msg', 0),
    ('obj-filename_input', 0, 'obj-file_dialog', 0),
    ('obj-route_file', 0, 'obj-save_file', 0),
    ('obj-write_prep', 1, 'obj-route_file', 0),
    ('obj-file_writer', 0, 'obj-write_prep', 0),
    ('obj-unpack_bytes', 0, 'obj-route_file', 0),
    ('obj-file_writer', 0, 'obj-unpack_bytes', 0),
]
lines_block = '\n\t\t\"lines\" : [\n'
for idx, (dest_name, dest_outlet, src_name, src_outlet) in enumerate(entries):
    lines_block += '\t\t\t{\n'
    lines_block += '\t\t\t\t"patchline" : {\n'
    lines_block += f'\t\t\t\t\t"destination" : [ "{dest_name}", {dest_outlet} ],\n'
    lines_block += f'\t\t\t\t\t"source" : [ "{src_name}", {src_outlet} ]\n'
    lines_block += '\t\t\t\t}\n'
    lines_block += '\t\t\t}'
    if idx < len(entries) - 1:
        lines_block += ',\n'
    else:
        lines_block += '\n'
lines_block += '\t\t]\n\t}\n}'
new_text = text[:lines_start] + lines_block
path.write_text(new_text)
