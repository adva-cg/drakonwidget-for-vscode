
function htmlToString(html) {
    if (!html) return '';
    if (!html.startsWith('<') || !html.endsWith('>')) {
        return html.split("\n").map(line => {return line.trim()})
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");    

    const root = doc.body
    const output = [];

    root.childNodes.forEach((node) => {
        if (node.tagName === 'P') {
            output.push(node.textContent.trim());
        } else if (node.tagName === 'UL') {
            output.push('');
            node.childNodes.forEach((item) => {
                if (item.tagName === 'LI') {
                    output.push(`- ${item.textContent.trim()}`);
                }
            });
            output.push('');
        } else if (node.tagName === 'OL') {
            output.push('');
            node.childNodes.forEach((item, index) => {
                if (item.tagName === 'LI') {
                    output.push(`${index + 1}. ${item.textContent.trim()}`);
                }
            });
            output.push('');
        }
    });

    return output;
}

module.exports = {htmlToString}