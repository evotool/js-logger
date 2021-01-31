const NATIVE_PREPARE_STACK_TRACE = Error.prepareStackTrace;

const OVERRIDED_PREPARE_STACK_TRACE = (e: Error, s: NodeJS.CallSite[]): NodeJS.CallSite[] => s;

export class Caller {
	static MAX_CALLERS_COUNT = 1;

	protected static _getCallSites(): NodeJS.CallSite[] {
		Error.prepareStackTrace = OVERRIDED_PREPARE_STACK_TRACE;

		const callSites = new Error().stack as unknown as NodeJS.CallSite[];
		Error.prepareStackTrace = NATIVE_PREPARE_STACK_TRACE;

		return callSites;
	}

	/**
	 * Create caller.
	 */
	static create(fromFilename: string, maxCallersCount: number = Caller.MAX_CALLERS_COUNT): Caller | null {
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
				const endIndex = startIndex + maxCallersCount;
				const parentCallSites = callSites.slice(startIndex, endIndex);

				return new Caller(callSite, parentCallSites);
			}
		}

		return null;
	}

	readonly fileName?: string;
	readonly methodName?: string;
	readonly functionName?: string;
	readonly typeName?: string;
	readonly line?: number;
	readonly column?: number;
	readonly evalOrigin?: string;
	readonly isToplevel: boolean;
	readonly isEval: boolean;
	readonly isNative: boolean;
	readonly isConstructor: boolean;
	readonly parent: Caller | null;

	protected constructor(cs: NodeJS.CallSite, parentCallSites: NodeJS.CallSite[]) {
		this.fileName = cs.getFileName() || undefined;
		this.methodName = cs.getMethodName() || undefined;
		this.functionName = cs.getFunctionName() || undefined;
		this.typeName = cs.getTypeName() || undefined;
		this.line = cs.getLineNumber() || undefined;
		this.column = cs.getColumnNumber() || undefined;
		this.evalOrigin = cs.getEvalOrigin();
		this.isToplevel = cs.isToplevel();
		this.isEval = cs.isEval();
		this.isNative = cs.isNative();
		this.isConstructor = cs.isConstructor();
		[cs, ...parentCallSites] = parentCallSites;
		this.parent = cs ? new Caller(cs, parentCallSites) : null;
	}
}
