'use strict';

const { parse } = require('./parser');
const { convert, toPastePayload } = require('./toDrakon');

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

/**
 * Переводит текст в нотации в payload для буфера вставки виджета.
 * @param {string} source текст схемы
 * @returns {{payload: {start: (string|undefined), items: Array<Object>}, errors: Array<string>}}
 */
function notationToPastePayload(source) {
	const parsed = parse(source);
	const built = convert(parsed);
	return {
		payload: toPastePayload(built),
		errors: parsed.errors.concat(built.errors)
	};
}

module.exports = {
	notationToDrakon: notationToDrakon,
	notationToPastePayload: notationToPastePayload
};
