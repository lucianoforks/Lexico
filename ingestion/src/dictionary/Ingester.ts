import Entry from "../../../entity/dictionary/Entry"
import Translation from "../../../entity/dictionary/Translation"
import { Forms } from "../../../entity/dictionary/word/Forms"
import { Inflection } from "../../../entity/dictionary/word/Inflection"
import { PartOfSpeech } from "../../../entity/dictionary/word/PartOfSpeech"
import PrincipalPart from "../../../entity/dictionary/word/PrincipalPart"
import { Pronunciation } from "../../../entity/dictionary/word/Pronunciation"
import parseEtymology from "./ingester/etymology"
import parseForms from "./ingester/form"
import parsePrincipalParts from "./ingester/principalPart"
import parsePronunciation from "./ingester/pronunciation"
import parseTranslations from "./ingester/translation"

export default abstract class Ingester {
  $: cheerio.Root
  elt: any
  entry: Entry

  constructor($: cheerio.Root, elt: any, entry: Entry) {
    this.$ = $
    this.elt = elt
    this.entry = entry
  }

  static getPartOfSpeech($: cheerio.Root, elt: any): PartOfSpeech {
    return $(elt)
      .prevAll(":header, h3, h4")
      .last()
      .text()
      .toLowerCase()
      .replace(/(\[edit])|\d+/g, "")
      .trim()
      .replace("proper noun", "properNoun") as PartOfSpeech
  }

  abstract ingestInflection(): Promise<Inflection>

  firstPrincipalPartName: string = ""
  principalParts: PrincipalPart[]
  async ingestPrincipalParts(): Promise<PrincipalPart[]> {
    this.principalParts = await parsePrincipalParts(
      this,
      this.$,
      this.elt,
      this.firstPrincipalPartName,
    )
    return this.principalParts
  }

  translations: Translation[] = []
  async ingestTranslations(): Promise<Translation[]> {
    const translations = await parseTranslations(this.$, this.elt, this.entry)
    this.translations.unshift(...translations)
    return this.translations
  }

  async ingestForms(): Promise<Forms | null> {
    return await parseForms(this.$, this.elt, this.entry)
  }

  macronizedWord: string
  ingestPronunciation(): Pronunciation {
    return parsePronunciation(this, this.$, this.elt, this.macronizedWord)
  }

  ingestEtymology(): string {
    return parseEtymology(this, this.$, this.elt)
  }

  ingestSynonyms(): Entry[] {
    return []
  }

  ingestAntonyms(): Entry[] {
    return []
  }
}
