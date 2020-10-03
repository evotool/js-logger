import { Caller } from '../src';

describe('caller', () => {
	it('should create caller', (done) => {
		const caller = Caller.create(__filename, 10);
		expect(caller).toBeTruthy();
		done();
	});

	it('should create callers parallel', (done) => {
		const callers: (Caller | null)[] = [];

		for (let i = 0; i < 10000; i++) {
			process.nextTick(() => {
				callers.push(Caller.create(__filename, 0));
			});
		}

		process.nextTick(() => {
			for (const caller of callers) {
				expect(caller).toBeTruthy();
			}

			done();
		});
	});
});
