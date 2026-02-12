Extraction tool scaffold

This folder contains a minimal extraction script to begin implementing the extraction strategy.

Usage

Run the script with Node.js and pass the path to the markdown strategy file:

```bash
node tools/extract/extract.js path/to/M4LProg_Extraction_Strategy.md --out ./out/strategy-outline.json
```

What it does

- Parses top-level `##` and secondary `###` headings and collects surrounding text
- Emits a JSON outline with `title`, `children`, and `text` fields

Next steps

- Improve parsing to extract action items, code snippets, and TODOs
- Add unit tests and a CLI wrapper
- Integrate with repository workflows (npm script or Makefile)
