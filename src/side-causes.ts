import { Identifier, ThisExpression } from 'estree';
import { ErrorType, FPError, findParentFunction } from './purecheck';


export function checkSideCause(node: Identifier, locals: Set<string>): FPError | null {
	if (skipSideCause(node, 0)) return null;
	if (!locals.has(node.name))
		return fpError(node);
	else
		return null;
}

function fpError(node: Identifier | ThisExpression): FPError | null {
	let fnode = findParentFunction(node);
	if (!fnode) return null;
	let ident, type;
	if (node.type == 'ThisExpression') {
		ident = 'this';
		type = ErrorType.ReadThis;
	}
	else {
		ident = node.name;
		type = ErrorType.ReadNonLocal;
	}
	return { type, ident, node, fnode };
}

function skipSideCause(node, level: number): boolean {
	if (!node.parent) return true;
	switch (node.parent.type) {
		// Skip object properties
		case 'Property':
			return node == node.parent.key
				&& node.parent.parent
				&& node.parent.parent.type == 'ObjectExpression';
		// Skip function declaration/expression identifiers
		case 'FunctionDeclaration':
		case 'FunctionExpression':
			return true;
		// Skip function invocations (to be checked elsewhere)
		case 'CallExpression':
			return level == 0;
		// Skip if update expression (handled by side effect)
		case 'UpdateExpression':
			return true;
		// Skip if left side of direct assignment
		case 'AssignmentExpression':
			return node.parent.left == node;
		// Skip object property identifiers e.g. "obj.prop",
		// But catch computed properties, e.g. "obj[prop]"
		case 'MemberExpression':
			if (node.parent.property == node) return !node.parent.computed;
			return skipSideCause(node.parent, level + 1);
		default:
			return false;
	}
}
