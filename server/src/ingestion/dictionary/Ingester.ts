import Entry from "../../entity/Entry"
import Translation from "../../entity/Translation"
import { Forms } from "../../entity/word/Forms"
import { Inflection } from "../../entity/word/Inflection"
import PrincipalPart from "../../entity/word/PrincipalPart"
import { Pronunciation } from "../../entity/word/Pronunciation"
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
      .prevAll(":header")
      .first()
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
    return await parseForms(this.$, this.elt)
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
