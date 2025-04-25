const { parse } = require('node-html-parser');


function htmlToString(html) {
    if (!html) return '';
    if (!html.startsWith('<') || !html.endsWith('>')) {
        return html.split("\n").map(line => {return line.trim()})
    }

    const root = parse(html);
    const output = [];

    root.childNodes.forEach((node) => {
        if (node.tagName === 'P') {
            output.push(node.text.trim());
        } else if (node.tagName === 'UL') {
            output.push('');
            node.childNodes.forEach((item) => {
                if (item.tagName === 'LI') {
                    output.push(`- ${item.text.trim()}`);
                }
            });
            output.push('');
        } else if (node.tagName === 'OL') {
            output.push('');
            node.childNodes.forEach((item, index) => {
                if (item.tagName === 'LI') {
                    output.push(`${index + 1}. ${item.text.trim()}`);
                }
            });
            output.push('');
        }
    });

    return output;
}

module.exports = {htmlToString}