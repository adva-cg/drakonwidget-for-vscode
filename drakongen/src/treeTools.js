
function optimizeTree(steps) {
    var result = []

    for (var step of steps) {
        if (step.type === "end" || step.type === "branch" || step.type === "loopend") { continue }
        if ((step.type === "action" || step.type === "comment") && !step.content) { continue }
        var copy
        if (step.type === "question") {
            copy = optimizeQuestion(step)
        } else if (step.type === "loop") {
            copy = optimizeLoop(step)
        } else {
            copy = step
        }
        result.push(copy)
    }

    return result
}

function optimizeLoop(step) {
    return {
        type: step.type,
        content: step.content,
        body: optimizeTree(step.body)
    }
}

function optimizeQuestion(step) {
    var yes = optimizeTree(step.yes)
    var no = optimizeTree(step.no)
    if (yes.length === 0 && no.length === 0) {
        return {
            type: step.type,
            content: step.content,
            yes: [],
            no: []
        }    
    }
    if (yes.length === 0) {
        return {
            type: step.type,
            content: {operator:"not",operand:step.content},
            yes: no,
            no: []
        }
    }
    return {
        type: step.type,
        content: step.content,
        yes: yes,
        no: no
    }    
}


module.exports = {optimizeTree}