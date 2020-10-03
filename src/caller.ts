const NATIVE_PREPARE_STACK_TRACE = Error.prepareStackTrace;

const OVERRIDED_PREPARE_STACK_TRACE = (e: Error, s: NodeJS.CallSite[]): NodeJS.CallSite[] => s;

const MAX_LENGTH = 1;

export class Caller {
	protected static _getCallSites(): NodeJS.CallSite[] {
		Error.prepareStackTrace = OVERRIDED_PREPARE_STACK_TRACE;

		const callSites = new Error().stack as unknown as NodeJS.CallSite[];
		Error.prepareStackTrace = NATIVE_PREPARE_STACK_TRACE;

		return callSites;
	}

	static create(fromFilename: string, subCallersMaxLength: number = MAX_LENGTH): Caller | null {
		let callerFilename: string | null;

		const callSites = this._getCallSites();

		for (let i = 1, found = false, len = callSites.length; i < len; i++) {
			callerFilename = callSites[i].getFileName();

			if (!found && callerFilename === fromFilename) {
				found = true;

				continue;
			}

			if (found && fromFilename !== callerFilename) {
				const callSite = callSites[i];
				const startIndex = i + 1;
				const endIndex = startIndex + subCallersMaxLength;
				const subCallSites = callSites.slice(startIndex, endIndex);

				return new Caller(callSite, subCallSites);
			}
		}

		return null;
	}

	readonly fileName: string;
	readonly methodName: string;
	readonly functionName: string;
	readonly typeName: string;
	readonly line: number;
	readonly column: number;
	readonly evalOrigin: string;
	readonly isToplevel: boolean;
	readonly isEval: boolean;
	readonly isNative: boolean;
	readonly isConstructor: boolean;
	readonly subCallers: Caller[];

	protected constructor(cs: NodeJS.CallSite, subCallSites: NodeJS.CallSite[]) {
		this.fileName = cs.getFileName() || '';
		this.methodName = cs.getMethodName() || '';
		this.functionName = cs.getFunctionName() || '';
		this.typeName = cs.getTypeName() || '';
		this.line = cs.getLineNumber() || 0;
		this.column = cs.getColumnNumber() || 0;
		this.evalOrigin = cs.getEvalOrigin() || '';
		this.isToplevel = cs.isToplevel();
		this.isEval = cs.isEval();
		this.isNative = cs.isNative();
		this.isConstructor = cs.isConstructor();
		this.subCallers = subCallSites.map((cs, i, a) => new Caller(cs, a.slice(i + 1)));
	}
}
