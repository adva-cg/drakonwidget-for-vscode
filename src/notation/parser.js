'use strict';

// Разбор текстовой нотации ДРАКОН в дерево блоков и икон.
// Правила нотации: yaxunit/src/DataProcessors/ИнструкцииДляНапарника1С/Templates/ИнструкцияСхемДРАКОН/Template.txt

// Порядок важен: более длинные маркеры проверяются раньше коротких.
const MARKERS = [
	{ marker: '([', type: 'header', close: '])' },
	{ marker: '((', type: 'pause', close: '))' },
	{ marker: '{{', type: 'select', close: '}}' },
	{ marker: '[[', type: 'insertion', close: ']]' },
	{ marker: '>[/', type: 'input', close: '/]' },
	{ marker: '[/>', type: 'output', close: '/]' },
	{ marker: '%%', type: 'comment', close: null },
	{ marker: '->', type: 'jump', close: null },
	{ marker: '@|', type: 'branch', close: null },
	{ marker: '}}', type: 'closeSelect', close: null },
	{ marker: '@', type: 'label', close: null },
	{ marker: '|', type: 'variant', close: '|' },
	{ marker: '}', type: 'closeQuestion', close: null },
	{ marker: '[', type: 'action', close: ']' },
	{ marker: '{', type: 'question', close: '}' }
];

/**
 * Находит маркер иконы в начале строки.
 * @param {string} line строка без ведущих пробелов
 * @returns {{marker: Object, rest: string}|null}
 */
function detect(line) {
	for (const entry of MARKERS) {
		if (line.startsWith(entry.marker)) {
			return { marker: entry, rest: line.slice(entry.marker.length) };
		}
	}
	return null;
}

/**
 * Отрезает текст иконы от закрывающих скобок.
 * @param {string} raw текст после маркера
 * @param {string|null} close закрывающая последовательность
 * @returns {string}
 */
function cutText(raw, close) {
	let text = raw.trim();
	if (!close) {
		return text;
	}
	if (close === '|') {
		const index = text.indexOf('|');
		return (index >= 0 ? text.slice(0, index) : text).trim();
	}
	if (text.endsWith(close)) {
		text = text.slice(0, text.length - close.length);
	}
	return text.trim();
}

/**
 * Делит текст иконы на первый и второй текст по разделителю `::`.
 * @param {string} text
 * @returns {{content: string, secondary: string|null}}
 */
function splitSecondary(text) {
	const index = text.indexOf('::');
	if (index < 0) {
		return { content: text.trim(), secondary: null };
	}
	return {
		content: text.slice(0, index).trim(),
		secondary: text.slice(index + 2).trim()
	};
}

/**
 * Разбирает текст перехода: `-> @Имя` или `-> @|Имя`.
 * @param {string} raw
 * @returns {{target: string, toBranch: boolean}|null}
 */
function parseJump(raw) {
	const text = raw.trim();
	if (text.startsWith('@|')) {
		return { target: text.slice(2).trim(), toBranch: true };
	}
	if (text.startsWith('@')) {
		return { target: text.slice(1).trim(), toBranch: false };
	}
	return null;
}

/**
 * Разбирает текст нотации.
 * @param {string} source
 * @returns {{blocks: Array, errors: Array<string>}}
 */
function parse(source) {
	const errors = [];
	const blocks = [];
	let block = { name: null, items: [] };
	blocks.push(block);

	let currentItems = block.items;
	let lastIcon = null;
	const openQuestions = [];

	const lines = String(source).split(/\r?\n/);

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) {
			continue;
		}

		const found = detect(line);
		if (!found) {
			if (lastIcon && typeof lastIcon.text === 'string') {
				lastIcon.text = lastIcon.text ? lastIcon.text + '\n' + line : line;
			} else {
				errors.push('строка ' + (i + 1) + ': текст вне иконы');
			}
			continue;
		}

		const { marker, rest } = found;
		const text = cutText(rest, marker.close);

		switch (marker.type) {
			case 'header':
			case 'pause':
			case 'action':
			case 'comment':
			case 'insertion': {
				if (!currentItems) {
					errors.push('строка ' + (i + 1) + ': икона вне ветки вопроса');
					break;
				}
				const parts = splitSecondary(text);
				lastIcon = {
					kind: 'icon',
					type: marker.type,
					text: parts.content,
					secondary: parts.secondary
				};
				currentItems.push(lastIcon);
				break;
			}

			case 'input':
			case 'output': {
				if (!currentItems) {
					errors.push('строка ' + (i + 1) + ': икона вне ветки вопроса');
					break;
				}
				const parts = splitSecondary(text);
				const simple = marker.type === 'input' ? 'simpleinput' : 'simpleoutput';
				lastIcon = {
					kind: 'icon',
					type: parts.secondary ? marker.type : simple,
					text: parts.content,
					secondary: parts.secondary
				};
				currentItems.push(lastIcon);
				break;
			}

			case 'question':
			case 'select': {
				if (!currentItems) {
					errors.push('строка ' + (i + 1) + ': икона вне ветки вопроса');
					break;
				}
				const node = { kind: marker.type, text: text, branches: [] };
				currentItems.push(node);
				openQuestions.push({ node: node, parentItems: currentItems });
				currentItems = null;
				lastIcon = node;
				break;
			}

			case 'variant': {
				const open = openQuestions[openQuestions.length - 1];
				if (!open) {
					errors.push('строка ' + (i + 1) + ': вариант без вопроса');
					break;
				}
				const branch = { label: text, items: [] };
				open.node.branches.push(branch);
				currentItems = branch.items;
				lastIcon = null;
				break;
			}

			case 'closeQuestion':
			case 'closeSelect': {
				const open = openQuestions.pop();
				if (!open) {
					errors.push('строка ' + (i + 1) + ': закрывающая скобка без блока');
					break;
				}
				currentItems = open.parentItems;
				lastIcon = null;
				break;
			}

			case 'branch': {
				block = { name: text, items: [] };
				blocks.push(block);
				currentItems = block.items;
				openQuestions.length = 0;
				lastIcon = null;
				break;
			}

			case 'label': {
				if (!currentItems) {
					errors.push('строка ' + (i + 1) + ': метка вне ветки вопроса');
					break;
				}
				lastIcon = { kind: 'label', name: text };
				currentItems.push(lastIcon);
				break;
			}

			case 'jump': {
				const jump = parseJump(rest);
				if (!jump) {
					errors.push('строка ' + (i + 1) + ': переход без адреса');
					break;
				}
				if (!currentItems) {
					errors.push('строка ' + (i + 1) + ': переход вне ветки вопроса');
					break;
				}
				lastIcon = { kind: 'jump', target: jump.target, toBranch: jump.toBranch };
				currentItems.push(lastIcon);
				break;
			}

			default:
				errors.push('строка ' + (i + 1) + ': неизвестный маркер ' + marker.marker);
		}
	}

	for (const open of openQuestions) {
		errors.push('не закрыт блок: ' + open.node.text);
	}

	return { blocks: blocks, errors: errors };
}

module.exports = { parse: parse };
