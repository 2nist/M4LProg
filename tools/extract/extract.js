#!/usr/bin/env node
// Simple extraction scaffold: parse a Markdown strategy file into a JSON outline
// Usage: node tools/extract/extract.js path/to/Extraction_Strategy.md

const fs = require('fs');
const path = require('path');

function usage() {
  console.log('Usage: node tools/extract/extract.js <path-to-markdown> [--out out.json]');
}

function parseMarkdownToOutline(md) {
  // Very small parser: collect headings (##/###) and their content
  const lines = md.split(/\r?\n/);
  const outline = [];
  let current = null;

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)/);
    const h3 = line.match(/^###\s+(.*)/);
    if (h2) {
      current = { title: h2[1].trim(), children: [], text: '' };
      outline.push(current);
    } else if (h3) {
      if (!current) {
        // create a placeholder H2
        current = { title: 'Overview', children: [], text: '' };
        outline.push(current);
      }
      current.children.push({ title: h3[1].trim(), text: '' });
    } else {
      if (current) {
        const lastChild = current.children[current.children.length - 1];
        if (lastChild) {
          lastChild.text += (lastChild.text ? '\n' : '') + line;
        } else {
          current.text += (current.text ? '\n' : '') + line;
        }
      }
    }
  }

  return outline;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length < 1) {
    usage();
    process.exit(1);
  }
  const inPath = path.resolve(argv[0]);
  const outFlag = argv.indexOf('--out');
  const outPath = outFlag !== -1 && argv[outFlag + 1] ? path.resolve(argv[outFlag + 1]) : null;

  if (!fs.existsSync(inPath)) {
    console.error('Input file not found:', inPath);
    process.exit(2);
  }

  const md = fs.readFileSync(inPath, 'utf8');
  const outline = parseMarkdownToOutline(md);
  const result = { source: inPath, generatedAt: new Date().toISOString(), outline };

  if (outPath) {
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
    console.log('Wrote outline to', outPath);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

if (require.main === module) main();
