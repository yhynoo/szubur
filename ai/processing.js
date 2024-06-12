import data from '../data/4ky_clean.json' with {type: 'json'}

const processedData = data.map(item => {
    const { id, designation, inscription: { transliterationClean, accountType } } = item
    const transliterationNoStopWords = transliterationClean.replace(/\.\.\./g, '').replace(/\b[NX]\b/g, '').replace(/(?<=\s),(?=\s)/g, '').replace(/[^\S\r\n]+/g, ' ')
        .trim()

    return { id, designation, transliterationNoStopWords, accountType }
})

Deno.writeTextFile('inputData.json', JSON.stringify(processedData, null, 4))