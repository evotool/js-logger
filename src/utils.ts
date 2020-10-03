// eslint-disable-next-line no-control-regex
const	ANSI_COLORS_REPLACE_MASK = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

export function resolveSeparators(text: string, separator: string, lineLength: number): string {
	return text.split('\n')
		.map((s) => {
			const parts = s.split(separator);
			const res = [];

			for (let i = 0, lt, rt; i < parts.length; i += 2) {
				lt = parts[i];
				rt = parts[i + 1];

				if (rt === undefined) {
					res.push(lt);

					continue;
				}

				res.push(floatRight(lineLength, lt, rt));
			}

			return res.join('\n');
		})
		.join('\n');
}

export function cleanText(text: string): string {
	return text.replace(ANSI_COLORS_REPLACE_MASK, '');
}

export function floatRight(maxLength: number, leftText: string, rightText?: string): string {
	if (!rightText) {
		return leftText;
	}

	const ltLength = cleanText(leftText).length;
	const rtLength = cleanText(rightText).length;

	if (ltLength + rtLength < maxLength) {
		const spacesLength = maxLength - ltLength - rtLength;

		return leftText + ' '.repeat(spacesLength) + rightText;
	}

	if (leftText) {
		return `${leftText}\n${rightText}`;
	}

	return rightText;
}
