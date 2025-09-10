// Tests for lezer Http grammar

import { testTree } from "@lezer/generator/test";
import { parser } from "./http";

type StackEntry = {
	name: string;
	from: number;
	to: number;
	value: string;
	children: StackEntry[];
	textNode?: boolean;
};

function parseHttp(input: string): StackEntry {
	const stack: StackEntry[] = [];
	parser.parse(input).iterate({
		enter: (node) => {
			const nodeName = node.type.name;
			const nodeFrom = node.from;
			const nodeTo = node.to;
			const value = input.slice(nodeFrom, nodeTo);

			stack.push({
				name: nodeName,
				from: nodeFrom,
				to: nodeTo,
				value: value,
				children: [],
			});
		},

		leave: () => {
			const current = stack.pop();
			if (current === undefined) {
				throw "Stack underflow";
			}

			if (stack.length === 0) {
				// Re-push root
				stack.push(current);
				return;
			}

			const parent = stack[stack.length - 1];
			if (parent === undefined) {
				throw "Impossible";
			}

			parent.children.push(current);
		},
	});

	const res = stack.pop();
	if (res === undefined) {
		throw "Stack underflow";
	}
	return res;
}

type Tree = TreeNode | string;
type TreeNode = {
	name: string;
	children: Tree[];
};

function transform(root: StackEntry): Tree {
	const tree: Tree = {
		name: root.name,
		children: [],
	};

	let pos = root.from;
	for (const child of root.children) {
		if (pos < child.from) {
			const prefix = root.value.slice(pos - root.from, child.from - root.from);
			tree.children.push(prefix);
		}

		tree.children.push(transform(child));
		pos = child.to;
	}

	if (pos < root.to) {
		tree.children.push(root.value.slice(pos - root.from));
	}

	return tree;
}

const tree = parser.parse("GET /\nAccept: text/yaml\n\nhello: world");
console.dir(parseHttp("GET /\nAccept: text/yaml\n\nhello: world\n\nagain"), {
	depth: null,
});
console.dir(
	transform(parseHttp("GET /\nAccept: text/yaml\n\nhello: world\n\nagain")),
	{
		depth: null,
	},
);
console.log(tree);
tree.iterate({
	enter: (node) => {
		console.log(`ENTER ${node.type.name}[${node.from}:${node.to}]`);
	},
	leave: (node) => {
		console.log(`LEAVE ${node.type.name}[${node.from}:${node.to}]`);
	},
});
testTree(tree, `Http`);
