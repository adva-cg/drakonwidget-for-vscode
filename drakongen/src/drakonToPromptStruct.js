const {drakonToStruct} = require("./drakonToStruct");
const {printPseudo} = require('./printPseudo');
const {addRange} = require("./tools")

function drakonToPseudocode(drakonJson, name, filename, htmlToString, translate) {    
    var diagram = drakonToStruct(drakonJson, name, filename, translate)
    var lines = []
    if (diagram.params) {
        addRange(lines, htmlToString(diagram.params))
        lines.push("")
    }

    lines.push(translate("Procedure") + " \"" + diagram.name + "\"")
    lines.push("")
    lines.push(translate("Algorithm") + ":")    
    
    if (diagram.branches.length === 0) {
        lines.push(translate("Empty"))
    } else if (diagram.branches.length === 1) {
        var first = diagram.branches[0]
        printPseudo(first, translate, lines, htmlToString)
    } else {
        var first = diagram.branches[0]
        lines.push(translate("Call subroutine") + ": \"" + htmlToString(first.name) + "\"")
        diagram.branches.forEach(branch => {
            lines.push("")
            lines.push(translate("Subroutine") + ": \"" + htmlToString(branch.name) + "\"")
            printPseudo(branch, translate, lines, htmlToString)
            lines.push(translate("End of subroutine"))
        })
    }  
    lines.push(translate("End of procedure"))
    if (diagram.description) {
        lines.push("")       
        addRange(lines, htmlToString(diagram.description))
        lines.push("")       
    }      
    var text = lines.join("\n")
    
    var str = JSON.stringify(diagram, null, 4)
    return {text:text,json:str}
}

module.exports = { drakonToPseudocode };