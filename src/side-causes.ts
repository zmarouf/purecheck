import { Identifier, ThisExpression } from 'estree';
import { ErrorType, FPError } from './purecheck';


export function checkSideCause(node: Identifier, locals: Set<string>): FPError | null {
	if (skipSideCause(node)) return null;
	if (!locals.has(node.name))
		return fpError(node);
	else
		return null;
}

function fpError(node: Identifier | ThisExpression): FPError {
	if (node.type == 'ThisExpression') return {
		type: ErrorType.ReadThis,
		ident: 'this',
		loc: node.loc,
		node
	};
	else return {
		type: ErrorType.ReadNonLocal,
		ident: node.name,
		loc: node.loc,
		node
	};
}

function skipSideCause(node): boolean {
	if (!node.parent) return true;
	// Skip function declaration identifiers
	if (node.parent.type == 'FunctionDeclaration') return true;
	// Skip function invocations (to be checked elsewhere)
	if (node.parent.type == 'CallExpression') return true;
	// Skip if update expression (handled by side effect)
	if (node.parent.type == 'UpdateExpression') return true;

	// Skip if left side of direct assignment
	if (node.parent.type == 'AssignmentExpression'
		&& node.parent.left == node) return true;

	if (node.parent.type == 'MemberExpression') {
		// Skip object property identifiers e.g. "obj.prop",
		// But catch computed properties, e.g. "obj[prop]"
		if (node.parent.property == node) return !node.parent.computed;
		return skipSideCause(node.parent);
	}
	return false;
	// // Skip object property identifiers e.g. "obj.prop",
	// // But catch computed properties, e.g. "obj[prop]"
	// if (node.parent.type == 'MemberExpression'
	// 	&& node.parent.property == node) return !node.parent.computed;

	// if (!node.parent.parent) return false;
	// // TODO should climb tree until type != 'MemberExpression'
	// // If we are here, only consider skipping composite assignment expressions
	// if (node.parent.parent.type == 'UpdateExpression') return true;
	// if (node.parent.parent.type != 'AssignmentExpression') return false;
	// // Skip if left side of composite assignment (e.g. x.y = ...)
	// return node.parent.parent.left == node.parent;
}
