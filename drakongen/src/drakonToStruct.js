const { structFlow, redirectNode } = require("./structFlow");
const { createError, remove } = require("./tools");

var translate

function drakonToStruct(drakonJson, name, filename, translateFunction) {
    translate = translateFunction
    let drakonGraph;
    try {
        drakonJson = drakonJson || ""
        drakonJson = drakonJson.trim()
        drakonJson = drakonJson || "{}"
        drakonGraph = JSON.parse(drakonJson);
    } catch (error) {
        var message = translate("Error parsing JSON") + ": " + error.message
        throw createError(message, filename)
    }

    const nodes = drakonGraph.items || {};

    var branches = []
    var firstNodeId = findStartNode(nodes, filename, branches)

    if (!firstNodeId) {
        return {
            name: name,
            params: drakonGraph.params || "",
            description: drakonGraph.description || "",
            branches: []
        }
    }

    buildTwoWayConnections(nodes, firstNodeId)

    rewireSelectsMarkLoops(nodes, filename)
    branches.forEach(branch => checkBranchIsReferenced(branch, firstNodeId, filename))
    rewireShortcircuit(nodes, filename)
    branches.forEach(branch => cutOffBranch(nodes, branch))
    var branchTrees = structFlow(nodes, branches, filename, translate)
    return {
        name: name,
        params: drakonGraph.params || "",
        description: drakonGraph.description || "",
        branches: branchTrees
    }
}

function drakonToGraph(drakonJson, name, filename, translateFunction) {
    translate = translateFunction
    let drakonGraph;
    try {
        drakonGraph = JSON.parse(drakonJson);
    } catch (error) {
        var message = translate("Error parsing JSON") + ": " + error.message
        throw createError(message, filename)
    }

    const nodes = drakonGraph.items || {};

    var branches = []
    var firstNodeId = findStartNode(nodes, filename, branches)

    if (!firstNodeId) {
        return undefined
    }

    buildTwoWayConnections(nodes, firstNodeId)

    rewireSelectsMarkLoops(nodes, filename)
    rewireShortcircuit(nodes, filename)
    branches.forEach(branch => checkBranchIsReferenced(branch, firstNodeId, filename))
    branches.forEach(branch => cutOffBranch(nodes, branch))
    
    var branchTrees = structFlow(nodes, branches, filename, translate)

    return {
        name: name,
        params: drakonGraph.params || "",
        description: drakonGraph.description || "",
        branches: branchTrees
    }
}


function checkBranchIsReferenced(branch, firstNodeId, filename) {
    if (branch.id === firstNodeId) {
        return
    }
    if (branch.prev.length === 0) {
        throw createError(translate("A silhouette branch is not referenced"), filename, branch.id)
    }
}

function cutOffBranch(nodes, branch) {
    var end = {
        type: "end",
        id: branch.id + "-end",
        prev: []
    }
    nodes[end.id] = end
    branch.next = branch.one
    var addresses = []
    traverseToHitBranch(nodes, branch.id, {}, (prev, node) => addFakeEnd(nodes, prev, node, end, addresses))
}

function traverseToHitBranch(nodes, nodeId, visited, action) {
    if (!nodeId) {return}
    if (nodeId in visited) {return}
    visited[nodeId] = true
    var node = nodes[nodeId]
    if (!node) {return}
    if (node.one) {
        var one = nodes[node.one]
        if (one.type === "branch") {
            action(node, one)
        } else {
            traverseToHitBranch(nodes, node.one, visited, action)
        }
    }
    if (node.two) {
        var two = nodes[node.two]
        if (two.type === "branch") {
            action(node, two)
        } else {
            traverseToHitBranch(nodes, node.two, visited, action)
        }
    }    
}

var idCounter = 1000
function addFakeEnd(nodes, prev, node, end, addresses) {
    var lastAddress = undefined
    if (addresses.length > 0) {
        lastAddress = addresses[addresses.length - 1]
    }        
    var address
    if (lastAddress && lastAddress.branch === node.id) {
        address = lastAddress
    } else {
        address = {
            type: "address",
            content: node.content,
            id: "ad-" + idCounter,
            branch: node.id,
            one: end.id,
            prev: []
        }   
        idCounter++
        nodes[address.id] = address
        end.prev.push(address.id)
        addresses.push(address)
        node.prev.push(address.id)
    }
    redirectNode(nodes, prev, node.id, address.id)
    address.prev.push(prev.id)
    node.prev = remove(node.prev, prev.id)
}

function buildTwoWayConnections(nodes, firstNodeId) {
    for (var id in nodes) {
        var node = nodes[id]
        node.id = id
        node.prev = []        
    }

    traverse(nodes, firstNodeId, {}, connectBack)
}

function findStartNode(nodes, filename, branches) {
    var firstNodeId = undefined
    var minBranchId = 10000    
    for (var id in nodes) {
        var node = nodes[id]
        if (node.type === "branch") {
            if (node.branchId < minBranchId) {
                firstNodeId = id
                minBranchId = node.branchId
            }
            branches.push(node)
        } else if (node.type === "select") {
            if (!node.content) {
                throw createError(translate("A Select icon must have content"), filename, id)
            }            
            node.cases = [];
        } else if (node.type === "loopbegin") {
            if (!node.content) {
                throw createError(translate("A Loop begin icon must have content"), filename, id)
            }             
        } else if (node.type === "question") {
            if (!node.content) {
                throw createError(translate("A Question icon must have content"), filename, id)
            }             
        }
    }

    return firstNodeId
}

function rewireSelectsMarkLoops(nodes, filename) {
    for (var id of Object.keys(nodes)) {
        var node = nodes[id]
        if (!node) { continue }
        if (node.type === "select") {
            rewireSelect(nodes, node, filename)
        } else if (node.type === "loopbegin") {
            markLoopBody(nodes, node, filename)
        }
    }
}

function rewireSelect(nodes, selectNode, filename) {
    var caseNodeId = selectNode.one
    while (caseNodeId) {
        var caseNode = nodes[caseNodeId]
        caseNodeId = caseNode.two
        if (caseNode.content) {
            caseNode.type = "question"
            caseNode.flag1 = 1
            caseNode.content = {operator: "equal", left:selectNode.content, right:caseNode.content}
            if (!caseNode.two) {
                var errorId = caseNode.id + "-unexpected"
                var errorAction = insertIcon(nodes, "error", errorId,  selectNode.content)
                errorAction.message = "Unexpected case value"

                caseNode.two = errorId
                errorAction.prev.push(caseNode.id)
                errorAction.one = caseNode.one

                var next = nodes[caseNode.one]
                next.prev.push(errorId)
            }
        } else {
            if (caseNode.two) {
                throw createError(translate("Only the rightmost Case icon can be empty"), filename, caseNode.id)
            }
            removeNodeOne(nodes, caseNode.id)
        }
    }
    removeNodeOne(nodes, selectNode.id)
}

function insertIcon(nodes, type, id, content) {
    var node = {
        type: type,
        id: id,
        content: content,
        prev: []
    }
    nodes[id] = node
    return node
}

function removeNodeOne(nodes, nodeId) {
    var node = nodes[nodeId]
    redirectPrev(nodes, node, node.one)
    redirectNext(nodes, node, node.one)
    delete nodes[nodeId]
}

function removeFromNext(node, next) {
    next.prev = next.prev.filter(prevId => prevId !== node.id)
}

function redirectPrev(nodes, node, newTarget) {
    for (var prevId of node.prev) {
        var prev = nodes[prevId]
        if (prev.one === node.id) {
            prev.one = newTarget
        }
        if (prev.two === node.id) {
            prev.two = newTarget
        }      
    }
}

function redirectNext(nodes, node, newTarget) {
    var target = nodes[newTarget]
    removeFromNext(node, target)
    for (var prevId of node.prev) {
        target.prev.push(prevId)
    }
}

function rewireShortcircuit(nodes) {
    while (findShortcusts(nodes)) {

    }
}

function findShortcusts(nodes) {
    for (var id in nodes) {
        var node = nodes[id]
        if (node.type === "question") {
            var andOperand = findAndOperand(nodes, node)
            if (andOperand) {
                writeAndShortcut(nodes, node, andOperand)
                return true
            }
            var orOperand = findOrOperand(nodes, node)
            if (orOperand) {
                writeOrShortcut(nodes, node, orOperand)
                return true
            }            
        }
    }
    return false
}

function findAndOperand(nodes, node) {
    var below = nodes[node.one]
    if (below.type === "question") {
        if (below.prev.length === 1 && below.two === node.two) {
            return below
        }
    }
    return undefined
}

function findOrOperand(nodes, node) {
    var right = nodes[node.two]
    if (right.type === "question") {
        if (right.prev.length === 1 && right.one === node.one) {
            return right
        }
    }
    return undefined
}

function writeAndShortcut(nodes, node, andOperand) {
    var right = nodes[node.two]
    var down = nodes[andOperand.one]
    removeFromNext(andOperand, right)
    removeFromNext(andOperand, down)
    node.content = {
        operator: "and",
        left: normalizeContent(node),
        right: normalizeContent(andOperand)
    }
    node.one = down.id
    node.flag1 = 1
    down.prev.push(node.id)
    delete nodes[andOperand.id]
}

function writeOrShortcut(nodes, node, orOperand) {
    var right = nodes[orOperand.two]
    var down = nodes[orOperand.one]
    removeFromNext(orOperand, right)
    removeFromNext(orOperand, down)
    node.content = {
        operator: "or",
        left: normalizeContent(node),
        right: normalizeContent(orOperand)
    }
    node.two = right.id
    node.flag1 = 1
    right.prev.push(node.id)
    delete nodes[orOperand.id]
}

function normalizeContent(question) {
    if (question.flag1 === 1) {
        return question.content
    }

    return {
        operator: "not",
        operand: question.content
    }
}


function traverse(nodes, nodeId, visited, action) {
    if (!nodeId) {
        return
    }

    if (nodeId in visited) {
        return
    }
    visited[nodeId] = true
    var node = nodes[nodeId]
    action(nodes, node)
    traverse(nodes, node.one, visited, action)
    traverse(nodes, node.two, visited, action)
}

function connectBack(nodes, node) {
    if (node.one) {
        var one = nodes[node.one]
        one.prev.push(node.id)
    }
    if (node.two) {
        var two = nodes[node.two]
        two.prev.push(node.id)
    }    
}

function markLoopBody(nodes, start, filename) {
    var nextNodeId = start.one
    while (nextNodeId) {
        var current = nodes[nextNodeId]
        nextNodeId = current.one
        current.parentLoopId = start.id
        if (current.type === "loopbegin") {
            nextNodeId = markLoopBody(nodes, current, filename)
        } else if (current.type === "loopend") {
            start.end = current.id
            start.next = current.one
            current.start = start.id
            return nextNodeId
        }
    }
    throw createError(translate("Loop end expected here"), filename, start.one)
}

module.exports = { drakonToStruct, drakonToGraph };