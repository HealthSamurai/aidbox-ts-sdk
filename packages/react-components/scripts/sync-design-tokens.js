#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const DESIGN_TOKENS_DIR = './AidboxDesignTokens';
const CSS_TEMPLATE_FILE = './src/template.css';
const RESULTING_CSS_FILE = './src/tokens.css';

const ALL_DESIGN_TOKENS = [
  {
    global: true,
    theme: 'light',
    file: path.join(DESIGN_TOKENS_DIR, 'Global/ThemeLight.json')
  },
  {
    global: false,
    theme: 'light', 
    file: path.join(DESIGN_TOKENS_DIR, 'Alias/ThemeLight.json')
  },
  {
    global: true,
    theme: 'dark',
    file: path.join(DESIGN_TOKENS_DIR, 'Global/ThemeDark.json')
  },
  {
    global: false,
    theme: 'dark',
    file: path.join(DESIGN_TOKENS_DIR, 'Alias/ThemeDark.json')
  }
];

function readDesignTokens(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Design tokens file ${filePath} doesn't exist.`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function traverseTree(fn, acc, root) {
  function walker(acc, x, path) {
    if (typeof x === 'object' && x !== null && !Array.isArray(x)) {
      acc = fn(acc, x, path);
      for (const [k, v] of Object.entries(x)) {
        acc = walker(acc, v, [...path, k]);
      }
    } else if (Array.isArray(x)) {
      acc = fn(acc, x, path);
      for (let i = 0; i < x.length; i++) {
        acc = walker(acc, x[i], [...path, i]);
      }
    } else {
      acc = fn(acc, x, path);
    }
    return acc;
  }
  return walker(acc, root, []);
}

function wrapWithVarCall(v) {
  return `var(${v})`;
}

function pathToCssVarName(path) {
  return `--${path.join('-')}`;
}

function isTemplateValue(v) {
  return typeof v === 'string' && /^\{.*\}$/.test(v);
}

function demoustache(v) {
  return v.slice(1, -1);
}

function templatePathToCssVarName(v) {
  return `--${v.replace(/\./g, '-')}`;
}

function evalTemplateValue(v) {
  if (isTemplateValue(v)) {
    return wrapWithVarCall(templatePathToCssVarName(demoustache(v)));
  }
  return v;
}

function coerceTokenValueByType(value, type, path, alias) {
  if (alias && type === 'color') {
    return evalTemplateValue(value);
  }
  
  if (type === 'color') {
    return value;
  }
  
  if (alias && type === 'dimension') {
    return evalTemplateValue(value);
  }
  
  if (type === 'dimension') {
    return value;
  }
  
  return value;
}

function buildCssVarsFromDesignTokens({ global, file }) {
  const alias = !global;
  const tokens = readDesignTokens(file);
  
  return traverseTree(
    (acc, node, path) => {
      if (typeof node === 'object' && node !== null && 
          node.hasOwnProperty('$type') && node.hasOwnProperty('$value')) {
        const nodeValue = node.$value;
        const nodeType = node.$type;
        
        acc.push(`--${path.join('-')}: ${coerceTokenValueByType(nodeValue, nodeType, path, alias)}`);
      }
      return acc;
    },
    [],
    tokens
  );
}

function figmaExportedDesignTokensToCssVars(designTokensList) {
  return designTokensList.map(designTokensMeta => ({
    ...designTokensMeta,
    cssVars: buildCssVarsFromDesignTokens(designTokensMeta)
  }));
}

function formatCssVarsGroupedByTheme(cssVars) {
  return cssVars.flatMap(token => token.cssVars).join(';\n        ');
}

function injectCssVarsToTemplate() {
  const cssTemplateContent = fs.readFileSync(CSS_TEMPLATE_FILE, 'utf8');
  const designTokensWithCssVars = figmaExportedDesignTokensToCssVars(ALL_DESIGN_TOKENS);
  
  const groupedByTheme = designTokensWithCssVars.reduce((acc, token) => {
    if (!acc[token.theme]) {
      acc[token.theme] = [];
    }
    acc[token.theme].push(token);
    return acc;
  }, {});
  
  const light = groupedByTheme.light || [];
  const dark = groupedByTheme.dark || [];
  
  const resultingCss = cssTemplateContent
    .replace('{{lightThemeVars}}', formatCssVarsGroupedByTheme(light))
    .replace('{{darkThemeVars}}', formatCssVarsGroupedByTheme(dark));
  
  // Create src directory if it doesn't exist
  const srcDir = path.dirname(RESULTING_CSS_FILE);
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }
  
  fs.writeFileSync(RESULTING_CSS_FILE, resultingCss);
  console.log(`✅ Generated CSS variables in ${RESULTING_CSS_FILE}`);
}

// Run the script
try {
  injectCssVarsToTemplate();
} catch (error) {
  console.error('❌ Error processing design tokens:', error.message);
  process.exit(1);
}