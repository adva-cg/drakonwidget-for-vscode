const { drakonToPseudocode } = require('./drakonToPromptStruct');
const { htmlToString } = require("./nodeTools")
const { setUpLanguage, translate } = require("./translate")
const { drakonToStruct } = require("./drakonToStruct");
const { astToDrakon } = require("./structToDrakon");

function toPseudocode(drakonJson, name, filename, language) {
    setUpLanguage(language)    
    var result = drakonToPseudocode(drakonJson, name, filename, htmlToString, translate)
    return result.text
}

function toTree(drakonJson, name, filename, language) {
    setUpLanguage(language)
    var result = drakonToStruct(drakonJson, name, filename, translate)
    return JSON.stringify(result, null, 4)
}

// function structToDrakon(text) {
//     setUpLanguage(language)
//     var result = astToDrakon(text)
//     return JSON.stringify(result, null, 4)
// }

module.exports = { toPseudocode, toTree, astToDrakon }