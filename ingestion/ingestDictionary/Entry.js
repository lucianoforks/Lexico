'use strict';
const fs = require('fs'), path = require('path')
const chalk = require('chalk')
const cheerio = require('cheerio')
const _ = require('lodash')
const putItem = entry => fs.writeFileSync(path.join(process.cwd(), `../dictionary/json/${entry.word}.json`),
    JSON.stringify(entry,null,2))
const getItem = word => {
    try { return require(path.join(process.cwd(),`../dictionary/json/${word}.json`)) }
    catch (e) { return undefined }
}
String.prototype.norm = function() {
    return this.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
}

const Noun = require("./wordTypes/nouns/Noun")
const ProperNoun = require("./wordTypes/nouns/ProperNoun")
const Adjective = require("./wordTypes/adjectives/Adjective")
const Prefix = require("./wordTypes/adjectives/Prefix")
const Suffix = require("./wordTypes/adjectives/Suffix")
const Participle = require("./wordTypes/adjectives/Participle")
const Numeral = require("./wordTypes/adjectives/Numeral")
const Verb = require("./wordTypes/Verb")
const Adverb = require("./wordTypes/Adverb")
const Pronoun = require("./wordTypes/adjectives/Pronoun")
const Preposition = require("./wordTypes/Preposition")
const Conjunction = require("./wordTypes/simple/Conjunction")
const Interjection = require("./wordTypes/simple/Interjection")
const Phrase = require("./wordTypes/simple/Phrase")
const Inflection = require("./wordTypes/Inflection")

function log(message) {
    const logFilename = path.join(process.cwd(), `./ingestion/ingestDictionary/logs/${process.pid}.txt`)
    if (process.argv.length === 2) fs.appendFileSync(logFilename, message + '\n')
    return console.log(chalk.red(message))
}

class Entry {
    constructor(entry) {
        this.word = entry.word.toLowerCase()
        this.href = entry.href.includes('#Latin') ? entry.href : entry.href + '#Latin'
        this.etymologies = []
    }

    ingest(html) {
        try {
            const $ = cheerio.load(html)
            for (const elt of $('p:has(strong.Latn.headword)').get())
                this.ingestEtymology($, elt)

            if (!this.etymologies)
                return log(`Skipped "${this.word}" - ${this.href}`)
            console.log(chalk.blue(`Ingested "${this.word}" - ${this.etymologies.map(etymology => etymology.partOfSpeech).join(', ')}`))
            for (const etymology of this.etymologies) {
                if (etymology.errors.length)
                    console.log(chalk.yellow(`${etymology.errors.join('\n')}`))
                delete etymology.errors
            }

            putItem({word: this.word, href: this.href,
                etymologies: this.etymologies.map(({ disorganizedForms, ...etymology }) => etymology)
            })
            this.ingestInflections()

            if (process.argv[2] === 'printWord') console.log(chalk.white(JSON.stringify(this.etymologies, null, 2)))
        } catch (e) { return log(`Error "${this.word}" - ${e}`) }
    }

    ingestEtymology($, elt) {
        let etymology
        const partOfSpeech = $(elt).prevAll(':header').first().text()
            .toLowerCase().replace(/(\[edit\])|\d+/g, '').trim()
        if (partOfSpeech === 'noun') etymology = new Noun()
        else if (partOfSpeech === 'proper noun') etymology = new ProperNoun()
        else if (partOfSpeech === 'verb') etymology = new Verb()
        else if (partOfSpeech === 'adjective') etymology = new Adjective()
        else if (partOfSpeech === 'participle') etymology = new Participle()
        else if (partOfSpeech === 'numeral') etymology = new Numeral()
        else if (partOfSpeech === 'prefix') etymology = new Prefix()
        else if (partOfSpeech === 'suffix') etymology = new Suffix()
        else if (['pronoun','determiner'].includes(partOfSpeech)) etymology = new Pronoun()
        else if (['adverb','particle'].includes(partOfSpeech)) etymology = new Adverb()
        else if (partOfSpeech === 'preposition') etymology = new Preposition()
        else if (partOfSpeech === 'conjunction') etymology = new Conjunction()
        else if (partOfSpeech === 'interjection') etymology = new Interjection()
        else if (['phrase','proverb','idiom'].includes(partOfSpeech)) etymology = new Phrase()
        else return
        etymology.ingest($, elt)
        if (etymology.inflection === 'repeat')
            return log(`Repeat "${this.word}" - ${this.href}\n\t${
                this.etymologies.reduce((output,etymology) =>
                    output + etymology.translations.join('\n\t') + '\n\t', '').trim()
            }`)
        else return this.etymologies.push(etymology)
    }

    ingestInflections() {
        for (const etymology of this.etymologies) {
            if (!etymology.disorganizedForms) continue
            for (const form of etymology.disorganizedForms) {
                for (const word of form.word) {
                    const inf = new Inflection(word, etymology, form.identifiers)
                    const existingEntry = getItem(word.norm())
                    if (existingEntry) {
                        const sameEtymology = existingEntry.etymologies.find(etymology =>
                            etymology.inflection === 'inflection'
                            && _.isEqual(etymology.principalParts, inf.principalParts)
                            && _.isEqual(etymology.translations, inf.translations))

                        if (sameEtymology && sameEtymology.forms.every(form => !_.isEqual(form, inf.forms[0])))
                            sameEtymology.forms.push(...inf.forms)
                        else if (!sameEtymology) existingEntry.etymologies.push(inf)
                        putItem(existingEntry)
                    } else {
                        const newEntry = new Entry({word: word.norm(),
                            href: `https://en.wiktionary.org/wiki/${word.norm()}#Latin`})
                        newEntry.etymologies.push(inf)
                        putItem(newEntry)
                    }
                    console.log(chalk.cyan(`Referred "${this.word}" - ${word.norm()}`))
                }
            }
            delete etymology.disorganizedForms
        }
    }

}

module.exports = { Entry, log }