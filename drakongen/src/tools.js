
function createError(message, filename, nodeId) {
    var error = new Error(message)
    error.nodeId = nodeId
    error.filename = filename
    return error
}

function remove(array, element) {
    return array.filter(item => item != element)
}

function sortByProperty(array, property, order = "asc") {
    if (!Array.isArray(array)) {
        throw new Error("First argument must be an array");
    }

    return array.slice().sort((a, b) => {
        const valA = a[property];
        const valB = b[property];

        if (valA === null || valB === null || valA === undefined || valB === undefined) {
            return 0; // Handle null or undefined values
        }

        if (valA < valB) {
            return order === "asc" ? -1 : 1;
        }
        if (valA > valB) {
            return order === "asc" ? 1 : -1;
        }
        return 0; // Values are equal
    });
}
function addRange(to, from) {
    for (var item of from) {
        to.push(item)
    }
}
module.exports = { createError, sortByProperty, addRange, remove }