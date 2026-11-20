'use strict';

// Сборка фрагмента диаграммы .drakon из разобранного дерева.
// Координаты не считаются: силуэт раскладывает сам виджет.

// Направление выходов вопроса: при 1 one идёт вниз (на шампуре) с подписью «Да»,
// two вправо — «Нет». При 0 подписи меняются местами (см. swapYesNo в libs/drakonwidget.js).
const QUESTION_FLAG1 = 1;

/**
 * Превращает узел дерева в элемент диаграммы.
 * @param {Object} node
 * @returns {Object}
 */
function toItem(node) {
	if (node.kind === 'jump' || node.kind === 'label') {
		return { type: 'address', content: node.name || node.target };
	}
	if (node.type === 'end') {
		return { type: 'end' };
	}
	if (node.type === 'action' && node.secondary) {
		return { type: 'shelf', content: node.text, secondary: node.secondary };
	}
	const item = { type: node.type, content: node.text };
	if (node.secondary) {
		item.secondary = node.secondary;
	}
	return item;
}

/**
 * Собирает диаграмму из разобранного дерева.
 * @param {{blocks: Array}} parsed результат parse()
 * @returns {{items: Object, errors: Array<string>, endId: (string|null)}}
 */
function convert(parsed) {
	const items = {};
	const errors = [];
	const branchByName = new Map();
	const labelByName = new Map();
	let counter = 0;
	let endId = null;

	const nextId = () => String(++counter);

	// Заголовок не является иконой items: виджет строит его сам из поля name.
	// Поэтому икона заголовка в начале схемы просто отбрасывается.
	if (parsed.blocks.length && parsed.blocks[0].items.length
		&& parsed.blocks[0].items[0].type === 'header') {
		parsed.blocks[0].items.shift();
	}

	for (let blockIndex = 0; blockIndex < parsed.blocks.length; blockIndex++) {
		const block = parsed.blocks[blockIndex];
		block.branchId = blockIndex;
		block.id = nextId();

		const branchItem = { type: 'branch', branchId: blockIndex };
		if (block.name) {
			branchItem.content = block.name;
			branchByName.set(block.name, block.id);
		}
		items[block.id] = branchItem;

		for (let index = 0; index < block.items.length; index++) {
			const node = block.items[index];
			node.id = nextId();

			if (node.kind === 'question') {
				items[node.id] = { type: 'question', content: node.text, flag1: QUESTION_FLAG1 };
				for (const branch of node.branches) {
					createBranchItems(branch.items);
				}
			} else if (node.kind === 'select') {
				items[node.id] = { type: 'select', content: node.text };
				for (const branch of node.branches) {
					branch.id = nextId();
					items[branch.id] = { type: 'case', content: branch.label };
					createBranchItems(branch.items);
				}
			} else {
				if (node.kind === 'label') {
					labelByName.set(node.name, node.id);
				}
				if (node.type === 'header') {
					node.type = 'end';
					endId = node.id;
				}
				items[node.id] = toItem(node);
			}
		}
	}

	/**
	 * Присваивает идентификаторы иконам внутри ветки вопроса.
	 * @param {Array} list
	 */
	function createBranchItems(list) {
		for (const node of list) {
			node.id = nextId();
			if (node.kind === 'question') {
				items[node.id] = { type: 'question', content: node.text, flag1: QUESTION_FLAG1 };
				for (const branch of node.branches) {
					createBranchItems(branch.items);
				}
			} else if (node.kind === 'select') {
				items[node.id] = { type: 'select', content: node.text };
				for (const branch of node.branches) {
					branch.id = nextId();
					items[branch.id] = { type: 'case', content: branch.label };
					createBranchItems(branch.items);
				}
			} else {
				if (node.kind === 'label') {
					labelByName.set(node.name, node.id);
				}
				if (node.type === 'header') {
					node.type = 'end';
					endId = node.id;
				}
				items[node.id] = toItem(node);
			}
		}
	}

	/**
	 * Проставляет связи one/two по порядку икон.
	 * @param {Array} list
	 * @param {(string|null)} continuation идентификатор иконы, следующей после контейнера
	 */
	function linkItems(list, continuation) {
		for (let index = 0; index < list.length; index++) {
			const node = list[index];
			const next = index + 1 < list.length ? list[index + 1].id : continuation;
			const item = items[node.id];

			if (item.type === 'end') {
				continue;
			}

			if (node.kind === 'question') {
				const yes = node.branches[0];
				const no = node.branches[1];
				item.one = yes && yes.items.length ? yes.items[0].id : next;
				item.two = no && no.items.length ? no.items[0].id : next;
				if (yes) {
					linkItems(yes.items, next);
				}
				if (no) {
					linkItems(no.items, next);
				}
			} else if (node.kind === 'select') {
				item.one = node.branches.length ? node.branches[0].id : next;
				for (let branchIndex = 0; branchIndex < node.branches.length; branchIndex++) {
					const branch = node.branches[branchIndex];
					const nextCase = branchIndex + 1 < node.branches.length
						? node.branches[branchIndex + 1].id
						: next;
					const caseItem = items[branch.id];
					caseItem.one = branch.items.length ? branch.items[0].id : nextCase;
					caseItem.two = nextCase;
					linkItems(branch.items, next);
				}
			} else if (node.kind === 'jump') {
				const target = branchByName.get(node.target) || labelByName.get(node.target);
				if (!target) {
					errors.push('переход на неизвестный адрес: ' + node.target);
				}
				item.one = target || next;
			} else {
				item.one = next;
			}
		}
	}

	for (const block of parsed.blocks) {
		const first = block.items.length ? block.items[0].id : endId;
		items[block.id].one = first;
		linkItems(block.items, endId);
	}

	return { items: items, errors: errors, endId: endId };
}

/**
 * Превращает результат convert() в payload буфера вставки виджета.
 * Выход фрагмента наружу кодируется литералом 'finish' (см. replaceIds в виджете).
 * @param {{items: Object, endId: (string|null)}} converted
 * @returns {{start: (string|undefined), items: Array<Object>}}
 */
function toPastePayload(converted) {
	const items = [];
	const dropped = new Set();
	let start;

	for (const id of Object.keys(converted.items)) {
		const item = converted.items[id];
		if (item.type === 'end') {
			dropped.add(id);
			continue;
		}
		if (item.type === 'branch' && item.branchId === 0 && !start) {
			start = id;
		}
		items.push(Object.assign({ id: id }, item));
	}

	if (!start && items.length) {
		start = items[0].id;
	}

	for (const item of items) {
		if (dropped.has(item.one)) {
			item.one = 'finish';
		}
		if (dropped.has(item.two)) {
			item.two = 'finish';
		}
	}

	return { start: start, items: items };
}

module.exports = { convert: convert, toPastePayload: toPastePayload };
