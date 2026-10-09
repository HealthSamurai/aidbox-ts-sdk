// AST extraction for the skill generator.
// Uses the TypeScript compiler API to read component source + story files and
// pull out: exported names, cva variants + defaults, exported *Props types,
// and story argTypes/args. No type-checking — pure syntactic walk, so it is
// fast and does not need the project to compile.

import { readFileSync } from "node:fs";
import ts from "typescript";

function parse(file) {
	const src = readFileSync(file, "utf-8");
	return ts.createSourceFile(
		file,
		src,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TSX,
	);
}

// Unwrap `x satisfies T`, `x as T`, and `(x)` down to the inner expression.
function unwrap(node) {
	while (
		node &&
		(ts.isSatisfiesExpression(node) ||
			ts.isAsExpression(node) ||
			ts.isParenthesizedExpression(node))
	) {
		node = node.expression;
	}
	return node;
}

const hasExport = (node) =>
	ts.canHaveModifiers(node) &&
	ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

// ---- exported names --------------------------------------------------------

function collectExports(sf) {
	const values = [];
	const types = [];
	const visit = (node) => {
		if (ts.isFunctionDeclaration(node) && node.name && hasExport(node)) {
			values.push(node.name.text);
		} else if (ts.isVariableStatement(node) && hasExport(node)) {
			for (const d of node.declarationList.declarations) {
				if (ts.isIdentifier(d.name)) values.push(d.name.text);
			}
		} else if (
			(ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
			hasExport(node)
		) {
			types.push(node.name.text);
		} else if (
			ts.isExportDeclaration(node) &&
			node.exportClause &&
			ts.isNamedExports(node.exportClause)
		) {
			for (const el of node.exportClause.elements) {
				(el.isTypeOnly ? types : values).push(el.name.text);
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(sf);
	return {
		values: [...new Set(values)],
		types: [...new Set(types)],
	};
}

// ---- cva variants ----------------------------------------------------------

function literalValue(node) {
	node = unwrap(node);
	if (ts.isStringLiteral(node)) return node.text;
	if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
	if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
	if (ts.isNumericLiteral(node)) return Number(node.text);
	return undefined;
}

function propName(prop) {
	const n = prop.name;
	if (!n) return undefined;
	if (ts.isIdentifier(n) || ts.isStringLiteral(n)) return n.text;
	return undefined;
}

function objectProps(node) {
	// returns array of {key, valueNode}
	node = unwrap(node);
	if (!node || !ts.isObjectLiteralExpression(node)) return [];
	const out = [];
	for (const p of node.properties) {
		if (ts.isPropertyAssignment(p)) {
			const k = propName(p);
			if (k) out.push({ key: k, value: p.initializer });
		}
	}
	return out;
}

function findProp(objNode, key) {
	return objectProps(objNode).find((p) => p.key === key)?.value;
}

function collectCva(sf) {
	// Merge all cva() calls in the file (usually one; some files have a couple).
	const variants = {}; // name -> Set(options)
	const defaults = {}; // name -> value
	const visit = (node) => {
		if (
			ts.isCallExpression(node) &&
			ts.isIdentifier(node.expression) &&
			node.expression.text === "cva" &&
			node.arguments.length >= 2
		) {
			const config = node.arguments[1];
			const variantsNode = findProp(config, "variants");
			for (const v of objectProps(variantsNode)) {
				variants[v.key] ??= new Set();
				for (const opt of objectProps(v.value)) variants[v.key].add(opt.key);
			}
			const defNode = findProp(config, "defaultVariants");
			for (const d of objectProps(defNode)) {
				const val = literalValue(d.value);
				if (val !== undefined) defaults[d.key] = val;
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(sf);
	const result = {};
	for (const [k, set] of Object.entries(variants)) {
		result[k] = { options: [...set], default: defaults[k] };
	}
	return result;
}

// ---- exported *Props type text --------------------------------------------

function collectPropsType(sf, exportedTypeNames = new Set()) {
	// A *Props type counts as exported if it has an inline `export` modifier OR
	// is re-exported via a separate `export { type X }` statement.
	let text;
	const visit = (node) => {
		if (
			(ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
			(hasExport(node) || exportedTypeNames.has(node.name.text)) &&
			/Props$/.test(node.name.text) &&
			!text
		) {
			text = node.getText(sf);
		}
		ts.forEachChild(node, visit);
	};
	visit(sf);
	return text;
}

// ---- story argTypes + args -------------------------------------------------

function stringArray(node) {
	node = unwrap(node);
	if (!node || !ts.isArrayLiteralExpression(node)) return undefined;
	return node.elements
		.map((e) => literalValue(e))
		.filter((v) => v !== undefined);
}

function collectStory(file) {
	let sf;
	try {
		sf = parse(file);
	} catch {
		return { argTypes: {}, args: {} };
	}
	let metaObj;
	const visit = (node) => {
		if (ts.isVariableStatement(node)) {
			for (const d of node.declarationList.declarations) {
				if (
					ts.isIdentifier(d.name) &&
					d.name.text === "meta" &&
					d.initializer
				) {
					const init = unwrap(d.initializer);
					if (ts.isObjectLiteralExpression(init)) metaObj = init;
				}
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(sf);

	const argTypes = {};
	const args = {};
	if (metaObj) {
		const atNode = findProp(metaObj, "argTypes");
		for (const p of objectProps(atNode)) {
			const opts = stringArray(findProp(p.value, "options"));
			const control = findProp(p.value, "control");
			let controlText;
			if (control && ts.isStringLiteral(control)) controlText = control.text;
			else if (control && ts.isObjectLiteralExpression(control)) {
				const t = findProp(control, "type");
				if (t && ts.isStringLiteral(t)) controlText = t.text;
			}
			argTypes[p.key] = { options: opts, control: controlText };
		}
		const argsNode = findProp(metaObj, "args");
		for (const p of objectProps(argsNode)) {
			const v = literalValue(p.value);
			if (v !== undefined) args[p.key] = v;
		}
	}
	return { argTypes, args };
}

export function extractComponent({ sourceFile, storyFile }) {
	const sf = parse(sourceFile);
	const exports = collectExports(sf);
	return {
		exports,
		cva: collectCva(sf),
		propsType: collectPropsType(sf, new Set(exports.types)),
		story: storyFile ? collectStory(storyFile) : { argTypes: {}, args: {} },
	};
}
