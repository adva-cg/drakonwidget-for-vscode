var {buildTree} = require("./technicalTree")
const { createError, sortByProperty } = require("./tools");
const { optimizeTree } = require("./treeTools")

function redirectNode(nodes, node, from, to) {
    if (node.one === from) {
        node.one = to;
    }
    if (node.two === from) {
        node.two = to;
    }
    if (node.next === from) {
        node.next = to
    }
    if (node.start && node.type === "loopend") {
        start = nodes[node.start]
        if (start.next === from) {
            start.next = to
        }
    }
}

function structFlow(nodes, branches, filename, translate) {



    function flowGraph(nodes, nodeId, branchingStack) {
        if (!nodeId) {return;}

        const node = nodes[nodeId];

        if (!node.stack) {
            node.stack = [];
            node.remaining = node.prev.length;
        }
        node.remaining--;

        mergeBranchingStack(nodes, node, branchingStack);
        if (node.remaining > 0) {return;}       

        if (node.type === "question") {
            for (let i = 0; i < node.stack.length; i++) {
                const questionId = node.stack[i];
                const question = nodes[questionId];
                question.branching++;
            }

            const stackOne = node.stack.slice();
            const stackTwo = node.stack.slice();
            stackOne.push(nodeId);
            stackTwo.push(nodeId);

            flowGraph(nodes, node.two, stackTwo);
            flowGraph(nodes, node.one, stackOne);
        } else if (node.type === "arrow-loop") {
            const stackOne = node.stack.slice();
            stackOne.push(nodeId);
            flowGraph(nodes, node.one, stackOne);
        } else if (node.type === "arrow-stub") {
            decrementBranchingForArrow(nodes, node)
        } else {
            flowGraph(nodes, node.one, node.stack);
        }
    }

    function decrementBranchingForArrow(nodes, node) {        
        var algonode = nodes[node.arrow]
        algonode.branching--        
    }

    function decrementQuestions(nodes, algonode, dictionary) {
        var stub = nodes[algonode.stub]
        for (var id of stub.stack) {
            var snode = nodes[id]
            if (id != algonode) {
                if (id in dictionary) {
                    snode.branching--
                }
            }
        }
        return stub
    }



    function mergeBranchingStack(nodes, node, branchingStack) {
        // Append all elements of the branching stack to node.stack
        addRange(node.stack, branchingStack)

        // Build a dictionary of occurrences
        const dictionary = buildDictionaryOfOccurences(node);

        // Merge all nodes
        mergeAll(nodes, node, dictionary);

        // Rebuild the stack
        node.stack = buildStackFromDictionary(dictionary);
    }

    function addRange(dst, src) {
        for (let i = 0; i < src.length; i++) {
            dst.push(src[i]);
        }
    }

    function buildStackFromDictionary(dictionary) {
        const rebuiltStack = [];
        for (const id in dictionary) {
            if (dictionary[id] > 0) {
                rebuiltStack.push(id);
            }
        }
        return rebuiltStack;
    }

    function buildDictionaryOfOccurences(node) {
        const dictionary = {};
        for (let i = 0; i < node.stack.length; i++) {
            const id = node.stack[i];
            dictionary[id] = (dictionary[id] || 0) + 1;
        }
        return dictionary;
    }

    function mergeAll(nodes, node, dictionary) {
        for (const id in dictionary) {
            const occurrences = dictionary[id];
            const algonode = nodes[id];
            if (occurrences > 1) {
                algonode.branching--;
                dictionary[id] = occurrences - 1;
            }
            if (algonode.branching === 1) {
                if (algonode.type === "arrow-loop" && !algonode.next) {
                    if (!isInMap(node.astack, id)) {
                        algonode.next = node.id
                        dictionary[algonode.id] = 0;
                        var stub = decrementQuestions(nodes, algonode, dictionary)
                        stub.one = node.id
                    }
                }                
            }            
        }
      
        for (const id in dictionary) {
            const algonode = nodes[id];
            if (algonode.branching === 1) {
                if (algonode.type === "question") {
                    algonode.next = node.id;
                    dictionary[algonode.id] = 0;
                }                
            }
        }
    }
    function isInMap(map, key) {
        if (!map) { return false }
        return key in map
    }

    function prepareQuestions(nodes) {
        for (const nodeId in nodes) {
            const node = nodes[nodeId];
            if (node.type === "question") {
                node.branching = 2;
            } else if (node.type === "arrow-loop") {
                node.branching = 1;
            }
        }
    }

    function rewireArrows(nodes, branches) {
        branches.forEach(branch => rewireArrowsInBranch(nodes, branch.id, branch.next, []))
        for (var id in nodes) {
            var node = nodes[id]
            if (node.type === "arrow-loop") {
                var stub = insertArrowStub(nodes, node)
                fillAStack(nodes, stub, stub.arrow)
            }
        }    
    }
    
    function fillAStack(nodes, node, arrowId) {
        if (!node.astack) {
            node.astack = {}
        }
        node.astack[arrowId] = true
        if (node.id === arrowId) {
            return
        }    
        for (var prevId of node.prev) {
            var prev = nodes[prevId]
            fillAStack(nodes, prev, arrowId)
        }
    }
    
    function rewireArrowsInBranch(nodes, prevNodeId, nodeId, arrowStack) {
        if (!nodeId) {return}
        var node = nodes[nodeId]
        if (node.type === "branch") {
            return
        }
        if (node.type === "arrow-loop") {
            if (!node.noloop) {
                node.noloop = {}
            }
            if (arrowStack.includes(nodeId)) {
                return            
            }
            node.noloop[prevNodeId] = true
            arrowStack = arrowStack.slice()
            arrowStack.push(nodeId)
            rewireArrowsInBranch(nodes, nodeId, node.one, arrowStack)
        } else if (node.type === "question") {
            var left = arrowStack.slice()
            var right = arrowStack.slice()
            rewireArrowsInBranch(nodes, nodeId, node.one, left)
            rewireArrowsInBranch(nodes, nodeId, node.two, right)
        } else {
            rewireArrowsInBranch(nodes, nodeId, node.one, arrowStack)
        }
    }
    
    function insertArrowStub(nodes, node) {
        var stub = {
            type: "arrow-stub",
            id: "arrow-stub-" + node.id,
            arrow: node.id,
            prev: []
        }
        nodes[stub.id] = stub
        node.stub = stub.id
        var prev2 = []
        for (var prevId of node.prev) {
            if (prevId in node.noloop) {
                prev2.push(prevId)
            } else {
                stub.prev.push(prevId)
                var prev = nodes[prevId]
                redirectNode(nodes, prev, node.id, stub.id)
            }
        }
        node.prev = prev2
        return stub
    }

    function rewriteTree(body, index, endId, output) {
        while (index < body.length) {
            var node = body[index]
            index++
            if (endId && node.id === endId) {
                return index
            }
            if (node.type === "question") {
                var transformed = rewriteQuestionTree(node, output)
                if (endId) {                    
                    var breakYes = findLoopEnd(transformed.yes, endId)
                    var breakNo = findLoopEnd(transformed.no, endId) 
                    if (breakYes || breakNo) {
                        var toBreak = []
                        findPlacesToBreak(transformed.yes, endId, toBreak)
                        findPlacesToBreak(transformed.no, endId, toBreak)                        
                        addBreaks(toBreak)
                        return index    
                    }
                }
            } else if (node.type === "loopbegin") {
                var body2 = []
                index = rewriteTree(body, index, node.end, body2)
                output.push({
                    id: node.id,
                    type: "loop",
                    content: node.content,
                    body: body2
                })
            } else {
                output.push(node)
            }
        }
    }

    function findPlacesToBreak(body, endId, output) {
        if (body.length === 0) {
            output.push(body)
            return
        }
        var last = body[body.length - 1]
        if (last.id === endId) {
            return
        }
        if (last.type === "question") {
            var qends = []
            findPlacesToBreak(last.yes, endId, qends)
            findPlacesToBreak(last.no, endId, qends)
            if (qends.length === 2
                && qends[0] === last.yes
                && qends[1] === last.no) {
                output.push(body)                
            } else {
                addRange(output, qends)
            }
        } else {
            output.push(body)
        }
    }

    function findLoopEnd(body, endId) {
        for (var i = 0; i < body.length; i++) {
            var node = body[i]
            if (node.id === endId) {
                if (i === body.length - 1) {
                    return true
                } else {
                    throw createError(
                        translate("An exit from the loop must lead to the point right after the loop end"),
                        filename,
                        node.id
                    );
                }
            }
            if (node.type === "question") {
                if (findLoopEnd(node.yes, endId)) {
                    return true
                }
                if (findLoopEnd(node.no, endId)) {
                    return true
                }                
            }            
        }
        return false
    }

    function addBreaks(toBreak) {
        for (var body of toBreak) {
            body.push({
                type: "break"
            })
        }
    }

    function rewriteQuestionTree(question, output) {
        var yes = []
        var no = []
        rewriteTree(question.yes, 0, undefined, yes)
        rewriteTree(question.no, 0, undefined, no)
        var transformed = {
            type: "question",
            id: question.id,
            content: question.content,
            yes: yes,
            no: no
        }
        output.push(transformed)
        return transformed
    }
    

    function structMain() {
        rewireArrows(nodes, branches)
        prepareQuestions(nodes)    
        var result = []
        for (var branch of branches) {
            flowGraph(nodes, branch.next, [])
        }
        
        for (var branch of branches) {
            var body = []
            buildTree(nodes, branch.next, body, "<dummy id>")
            var body2 = []
            rewriteTree(body, 0, undefined, body2)
            result.push({
                name: branch.content,
                branchId: branch.branchId,
                start: branch.next,
                refs: branch.prev.length,
                body: optimizeTree(body2)
            })
        }

        return sortByProperty(result, "branchId")
    }

    return structMain()
}
module.exports = { structFlow, redirectNode };