'use strict';

const { parse } = require('./parser');
const { convert } = require('./toDrakon');

/**
 * Переводит текст в нотации ДРАКОН в фрагмент диаграммы .drakon.
 * @param {string} source текст схемы
 * @returns {{items: Object, endId: (string|null), errors: Array<string>}}
 */
function notationToDrakon(source) {
	const parsed = parse(source);
	const built = convert(parsed);
	return {
		items: built.items,
		endId: built.endId,
		errors: parsed.errors.concat(built.errors)
	};
}

module.exports = { notationToDrakon: notationToDrakon };
