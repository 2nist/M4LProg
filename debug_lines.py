from pathlib import Path
text = Path('patchers/ATOM SQ Chordgen Patch.js').read_text()
needle = 'lines'
pos = text.find(needle)
print('found', pos)
print(text[max(pos-40, 0):pos+40])
