'use strict';

const assert = require('node:assert');
const { notationToDrakon } = require('../notation');

describe('notation → drakon', () => {
	it('строит цепочку действий между заголовком и концом', () => {
		const result = notationToDrakon([
			'([ Схема ])',
			'[ Первое ]',
			'[ Второе ]',
			'([ Конец ])'
		].join('\n'));

		assert.deepStrictEqual(result.errors, []);
		const items = result.items;
		assert.strictEqual(items['1'].type, 'branch');
		assert.strictEqual(items['1'].one, '2');
		assert.strictEqual(items['2'].type, 'header');
		assert.strictEqual(items['3'].one, '4');
		assert.strictEqual(items['4'].one, '5');
		assert.strictEqual(items['5'].type, 'end');
		assert.strictEqual(items['5'].one, undefined);
	});

	it('ведёт one вопроса в ветку да, two в ветку нет', () => {
		const result = notationToDrakon([
			'{ Условие? }',
			'|да',
			'[ Да ]',
			'|нет',
			'[ Нет ]',
			'}',
			'([ Конец ])'
		].join('\n'));

		assert.deepStrictEqual(result.errors, []);
		const items = result.items;
		assert.strictEqual(items['2'].type, 'question');
		assert.strictEqual(items['2'].flag1, 0);
		assert.strictEqual(items['2'].one, '3');
		assert.strictEqual(items['2'].two, '4');
		assert.strictEqual(items['3'].content, 'Да');
		assert.strictEqual(items['4'].content, 'Нет');
	});

	it('переход на ветку ссылается на её идентификатор', () => {
		const result = notationToDrakon([
			'@|ЦИКЛ',
			'[ Шаг ]',
			'{ Ещё? }',
			'|да',
			'-> @|ЦИКЛ',
			'|нет',
			'}',
			'([ Конец ])'
		].join('\n'));

		assert.deepStrictEqual(result.errors, []);

		const items = result.items;
		const branchId = Object.keys(items)
			.find((id) => items[id].type === 'branch' && items[id].content === 'ЦИКЛ');
		const addressId = Object.keys(items)
			.find((id) => items[id].type === 'address' && items[id].content === 'ЦИКЛ');

		assert.ok(branchId, 'ветка ЦИКЛ должна существовать');
		assert.ok(addressId, 'переход на ЦИКЛ должен существовать');
		assert.strictEqual(items[addressId].one, branchId);
	});

	it('действие со вторым текстом становится shelf', () => {
		const result = notationToDrakon([
			'[ Очистить :: CRE_ОбновлениеДанных ]',
			'([ Конец ])'
		].join('\n'));

		assert.deepStrictEqual(result.errors, []);
		const items = result.items;
		const shelf = Object.keys(items).find((id) => items[id].type === 'shelf');
		assert.ok(shelf, 'икона shelf должна существовать');
		assert.strictEqual(items[shelf].content, 'Очистить');
		assert.strictEqual(items[shelf].secondary, 'CRE_ОбновлениеДанных');
	});

	it('сообщает о переходе на неизвестный адрес', () => {
		const result = notationToDrakon([
			'[ Шаг ]',
			'-> @|НЕТ_ТАКОЙ',
			'([ Конец ])'
		].join('\n'));

		assert.strictEqual(result.errors.length, 1);
		assert.match(result.errors[0], /НЕТ_ТАКОЙ/);
	});
});
