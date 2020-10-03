import { floatRight, resolveSeparators } from '../src/utils';

describe('record', () => {
	it('should return floated right text', () => {
		expect(floatRight(10, '1', '2')).toBe(`1${' '.repeat(8)}2`);
		expect(floatRight(10, '', '1234567890')).toBe(`1234567890`);
		expect(floatRight(10, '12345', '6789')).toBe(`12345 6789`);
		expect(floatRight(10, '12345', '67890')).toBe(`12345\n67890`);
	});

	it('should resolve separators', () => {
		expect(resolveSeparators('1<-|->2', '<-|->', 10)).toBe(`1${' '.repeat(8)}2`);
		expect(resolveSeparators('12345<-|->6789', '<-|->', 10)).toBe(`12345 6789`);
		expect(resolveSeparators('12345<-|->67890', '<-|->', 10)).toBe(`12345\n67890`);
		expect(resolveSeparators('12345<-|->67890<-|->12345', '<-|->', 11)).toBe(`12345 67890\n12345`);
		expect(resolveSeparators('12345<-|->67890<-|->12345<-|->67890', '<-|->', 11)).toBe(`12345 67890\n12345 67890`);
		expect(resolveSeparators('12345<-|->67890\n<-|->12345', '<-|->', 11)).toBe(`12345 67890\n      12345`);
		expect(resolveSeparators('12345<-|->67890\n12345<-|->67890', '<-|->', 11)).toBe(`12345 67890\n12345 67890`);
		expect(resolveSeparators('12345 67890\n12345<-|->67890', '<-|->', 11)).toBe(`12345 67890\n12345 67890`);
	});
});
