'use strict';

// Прогон конвертера на схеме с двумя вопросами.
// Печатает items и выкладывает результат в scratch/from-notation.drakon.
// Запуск: node scratch/check-notation.js

const fs = require('node:fs');
const path = require('node:path');
const { notationToDrakon } = require('../src/notation');

const source = [
	'([ Схема ])',
	'[ Получить штатный текст ]',
	'{ Хэш пустой? }',
	'|да',
	'|нет',
	'[ Сравнить со штатным ]',
	'}',
	'{ Совпало? }',
	'|да',
	'|нет',
	'[ Записать подмену ]',
	'}',
	'([ Конец ])'
].join('\n');

const result = notationToDrakon(source);
const target = path.join(__dirname, 'from-notation.drakon');

console.log('--- текст ---');
console.log(source);
console.log('--- ошибки ---');
console.log(result.errors.length ? result.errors : 'нет');
console.log('--- items ---');
console.log(JSON.stringify(result.items, null, 2));

if (result.errors.length) {
	console.log('Файл не записан: есть ошибки разбора.');
} else {
	fs.writeFileSync(target, JSON.stringify({
		type: 'drakon',
		items: result.items,
		style: '{"maxWidth":380}'
	}, null, 2) + '\n', 'utf8');
	console.log('--- записано ---');
	console.log(target);
}
