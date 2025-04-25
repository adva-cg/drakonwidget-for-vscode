function buildTree(nodes, nodeId, body, stopId) {
    while (nodeId) {
        if (nodeId === stopId) {return;}
        const node = nodes[nodeId];
        let transformed;
        let next;

        if (node.type === "question") {
            next = reserveNext(nodes, node)

            transformed = {
                id: node.id,
                type: "question",
                content: node.content || "",
                yes: [],
                no: []
            };

            const yesNodeId = node.flag1 === 1 ? node.one : node.two;
            const noNodeId = node.flag1 === 1 ? node.two : node.one;

            buildTree(nodes, yesNodeId, transformed.yes, node.next);
            buildTree(nodes, noNodeId, transformed.no, node.next);
        } else if (node.type === "arrow-loop") {
            transformed = {
                id: node.id,
                type: "loopbegin",
                content: "",
                end: node.stub
            };

            next = node.one;
        } else if (node.type === "arrow-stub") {
            transformed = {
                id: node.id,
                type: "loopend",
                start: node.arrow
            };

            next = node.one;
        } else {
            transformed = {
                id: node.id,
                type: node.type,
            }
            copyFields(
                transformed,
                node,
                [
                    "content",
                    "secondary",
                    "start",
                    "message",
                    "end"
                ]
            )
            next = node.one;
        }

        body.push(transformed);
        nodeId = next;
    }
}

function copyFields(dst, src, fields) {
    for (var field of fields) {
        var value = src[field]
        if (value !== "" && value !== undefined && value !== null) {
            dst[field] = value
        }
    }
}

function reserveNext(nodes, node) {
    const target = nodes[node.next];
    if (target.targetTaken) {
        return undefined;
    } else {
        target.targetTaken = true;
        return node.next;
    }    
}

module.exports = {buildTree}
