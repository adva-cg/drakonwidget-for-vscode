# drakongen

**drakongen** generates pseudocode from drakon flowcharts built with [DrakonWidget](https://github.com/stepan-mitkin/drakonwidget) or [DrakonHub](https://github.com/stepan-mitkin/drakonhub_desktop).

One can use the output pseudocode as a prompt for AI applications like ChatGPT or CodePilot.

**drakongen** can also generate a generic AST from drakon flowcharts to generate source code in programming languages, for example, JavaScript.
**drakongen**  turns a drakon flowchart into a tree in the JSON format that one can trivially transform into code in any programming language.

## How to use drakongen in the browser

Include the `drakongen.js` script on the web page.

```html
<script src="browser/drakongen.js"></script>
```

Call `drakongen.toPseudocode` or `drakongen.toTree` functions.

```html
<script>
var drakon = ... // Get the drakon chart from DrakonWidget
var name = "Diagram one"
var filename = "Diagram one.drakon"

var pseudo = drakongen.toPseudocode(drakon, name, filename, "en")
console.log(pseudo)

var tree = drakongen.toTree(drakon, name, filename, "en")
console.log(tree)

</script>
```

Available languages:

- en English
- no Norwegian
- ru Russian

## How to use drakongen in Node JS

Add the **drakongen** package to dependencies.

```
npm i drakongen
```

- Require the **drakongen** module.
- Call `toPseudocode` or `toTree` functions.

```javascript
const {toTree, toPseudocode} = require("drakongen")

var drakon = ... // Get the drakon chart from DrakonWidget
var name = "Diagram one"
var filename = "Diagram one.drakon"

var pseudo = toPseudocode(drakon, name, filename, "en")
console.log(pseudo)

var tree = toTree(drakon, name, filename, "en")
console.log(tree)
```

## How to use drakongen as a command-line tool

Install **drakongen** globally.

```
npm i --global drakongen
```

Run the **drakongen** utility.

In this example, the language is Norwegian, the path to the output folder is **out**, the input file is **Hello.drakon**:

```
drakongen --language no --output out Hello.drakon
```
