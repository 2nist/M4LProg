from pathlib import Path
text = Path('patchers/ATOM SQ Chordgen Patch.js').read_text()
needle = '"lines"'
pos = text.find(needle)
if pos != -1:
    print('found', pos, repr(text[pos-40:pos+40]))
else:
    print('lines not found')
