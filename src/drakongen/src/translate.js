var translationsRu = {
    "error": "ОШИБКА",
    "not": "не",
    break: 'выход из цикла',
    "and": "и",
    "or": "или",
    "if": "Если",
    "else": "Иначе",
    "empty": "ПУСТОЙ",
    "loop forever": "Бесконечный цикл",
    "pass": "Пропустить",
    "Only the rightmost Case icon can be empty": "Только самая правая икона Вариант может быть пустой",
    "Error parsing JSON": "Ошибка парсинга JSON",
    "A Loop begin icon must have content": "Икона начала цикла ДЛЯ должна содержать данные",
    "A Question icon must have content": "Икона Вопрос должна содержать данные",
    "A Select icon must have content": "Икона Выбор должна содержать данные",
    "Loop end expected here": "Здесь ожидается конец цикла",
    "An exit from the loop must lead to the point right after the loop end": "Выход из цикла должен вести в точку сразу за его концом",
    "A silhouette branch is not referenced": "Нет ссылок на ветку силуэта",
    "Call subroutine": "Вызвать подпрограмму",
    "Procedure": "Процедура",
    "End of procedure": "Конец процедуры",
    "Subroutine": "Подпрограмма",
    "End of subroutine": "Конец подпрограммы",
    "Description": "Описание",
    "Algorithm": "Алгоритм",
    Remarks: "Замечания"
}

var translationsEn = {
    error: 'Error',
    not: 'not',
    break: 'break',
    and: 'and',
    or: 'or',
    if: 'If',
    else: 'Else',
    empty: 'Empty',
    'loop forever': 'Loop forever',
    pass: 'Pass',
    'Only the rightmost Case icon can be empty': 'Only the rightmost Case icon can be empty',
    'Error parsing JSON': 'Error parsing JSON',
    'A Loop begin icon must have content': 'A Loop begin icon must have content',
    'A Question icon must have content': 'A Question icon must have content',
    'A Select icon must have content': 'A Select icon must have content',
    'Loop end expected here': 'Loop end expected here',
    'An exit from the loop must lead to the point right after the loop end': 'An exit from the loop must lead to the point right after the loop end',
    'A silhouette branch is not referenced': 'A silhouette branch is not referenced',
    'Call subroutine': 'Call subroutine',
    Procedure: 'Procedure',
    'End of procedure': 'End of procedure',
    Subroutine: 'Subroutine',
    'End of subroutine': 'End of subroutine',
    Description: 'Description',
    Algorithm: 'Algorithm',
    Remarks: "Remarks"
}

var translationsNo = {
    error: 'Feil',
    not: 'ikke',
    break: 'avslutt løkken',
    and: 'og',
    or: 'eller',
    if: 'Hvis',
    else: 'Ellers',
    empty: 'Tom',
    'loop forever': 'Gjør evig',
    pass: 'Hopp over',
    'Only the rightmost Case icon can be empty': 'Bare den ytterste høyre Case-ikonet kan være tomt',
    'Error parsing JSON': 'Feil ved parsing av JSON',
    'A Loop begin icon must have content': 'Et Loop-startikon må ha innhold',
    'A Question icon must have content': 'Et Spørsmål-ikon må ha innhold',
    'A Select icon must have content': 'Et Velg-ikon må ha innhold',
    'Loop end expected here': 'Slutt på løkke forventet her',
    'An exit from the loop must lead to the point right after the loop end': 'En utgang fra løkken må føre til punktet rett etter løkkens slutt',
    'A silhouette branch is not referenced': 'En silhuettgren er ikke referert',
    'Call subroutine': 'Kall delprosedyre',
    Procedure: 'Prosedyre',
    'End of procedure': 'Slutt på prosedyre',
    Subroutine: 'Delprosedyre',
    'End of subroutine': 'Slutt på delprosedyre',
    Description: 'Beskrivelse',
    Algorithm: 'Algoritme',
    Remarks: "Bemerkninger"
};


var translations = translationsEn

function translate(text) {
    return translations[text] || text;
}

function setUpLanguage(language) {
    if (language === "ru") {
        translations = translationsRu
    } else if (language === "no") {
        translations = translationsNo
    } else if (language === "en") {
        translations = translationsEn
    } else {
        translations = {}
    }
}


module.exports = { setUpLanguage, translate };