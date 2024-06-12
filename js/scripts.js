import { allToponyms } from "../data/allToponyms.js"

// - helpers

function cleanCDLITranscriptions(transcription) {
    const transcriptionArray = transcription
        .split(/\r\n?\r?\n/g)
        .filter(line => line.trim() !== '' && /^\d/.test(line))
        .map(line => line.replace(/[#()?|\[\]]/g, '').replace(/^\d+[^ ]*\s*/, ' ').replace(', ', '').trim())
    
    const transcriptionString = transcriptionArray
        .join('\n')

    return { transcriptionArray, transcriptionString }
}

function cleanVariants(line) {
    return line.map(item => item.replace(/~[a-z](\d)?/g, ''))
}

// - workers

async function findSimilar(transcriptionString) {
    const queryClean = transcriptionString.replace(/\.\.\./g, '').replace(/\b[NX]\b/g, '').replace(/(?<=\s),(?=\s)/g, '').replace(/[^\S\r\n]+/g, ' ')
        .trim()

    const similarities = new Deno.Command('python3', { args: [ Deno.cwd() + '/ai/ai_similarity_loader.py', queryClean ] })
    const { stdout } = await similarities.output();
    return new TextDecoder().decode(stdout)
}

async function makePrediction(transcriptionString) {
    const prediction = new Deno.Command('python3', { args: [ Deno.cwd() + '/ai/ai_accountType_loader.py', transcriptionString ] })
    const { stdout } = await prediction.output();
    return new TextDecoder().decode(stdout)
}

function checkFeatures(transcriptionArray) {
    const foundLexicalItems = []
    const foundTimeExpressions = []
    const foundToponyms = []

    transcriptionArray.forEach(line => {
        const cleanLine = cleanVariants(line.split(' '))

        // find toponyms
        allToponyms.forEach(toponym => {
            if (toponym.every(sign => cleanLine.includes(sign))) {
                if (!foundToponyms.includes(toponym.join(' '))) {
                    foundToponyms.push(toponym.join(' '))
                } 
            }
        })

        // find time expressions
        cleanLine.forEach(sign => {
            const substrings = sign.split(/[.|x]/)
            if (substrings.includes('U4') && substrings.some(substring => substring.match(/N\d{2}$/))) {
                if (!foundTimeExpressions.includes(sign)) {
                    foundTimeExpressions.push(sign)
                }
            }
        })
    })

    return { foundLexicalItems, foundTimeExpressions, foundToponyms }
}

export async function printQuery(queryString) {
    const { transcriptionArray, transcriptionString } = cleanCDLITranscriptions(queryString)

    const results = await findSimilar(transcriptionString)
    const parsedResults = JSON.parse(results.replace(/'/g, '"'))

    const prediction = await makePrediction(transcriptionString)
    const { foundTimeExpressions, foundToponyms } = checkFeatures(transcriptionArray)

    let html = '<div class = "ugnResults"><strong>results:</strong><br><br>'
    
    // prediction
    html += `<div class = "ugnAllogram"><p><strong>account type:</strong><p>${prediction}</p></div>`

    // similarities
    if (parsedResults.length !== 0) {
        html += '<div class = "ugnAllogram"><p><strong>most similar tablets:</strong><p>'
        parsedResults.forEach(item => {
            const { id, designation, similarity_score: similarityScore } = item
            html += `<a href = 'https://cdli.mpiwg-berlin.mpg.de/artifacts/${id}' target='_blank'>${designation}</a> &ndash; ${(similarityScore * 100).toFixed(1)}%<br>`
        })
        html += '</p></div>'
    }

    // features
    html += `<div class = "ugnAllogram">
        <p><strong>found time expressions:</strong><br>${foundTimeExpressions}</p>
        <p><strong>found toponyms:</strong><br>${foundToponyms.join(', ')}</p>
    </div></div>`

    return html
}