import { Forms } from "../../entity/forms/Forms"
import PrincipalPart from "../../entity/PrincipalPart"
import { Pronunciation } from "../../entity/Pronunciation"
import Translation from "../../entity/Translation"
import Word from "../../entity/Word"
import parseEtymology from "./ingester/etymology"
import parseForms from "./ingester/form"
import parsePrincipalParts from "./ingester/principalPart"
import parsePronunciation from "./ingester/pronunciation"
import parseTranslations from "./ingester/translation"

export default abstract class Ingester {
  $: cheerio.Root
  elt: any
  word: Word

  constructor($: cheerio.Root, elt: any, word: Word) {
    this.$ = $
    this.elt = elt
    this.word = word
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

  abstract ingestInflection(): Inflection

  firstPrincipalPartName: string = ""
  principalParts: PrincipalPart[]
  ingestPrincipalParts(): PrincipalPart[] {
    this.principalParts = parsePrincipalParts(
      this,
      this.$,
      this.elt,
      this.firstPrincipalPartName,
    )
    return this.principalParts
  }

  ingestTranslations(): Translation[] {
    return parseTranslations(this.$, this.elt, this.word)
  }

  async ingestForms(): Promise<Forms | null> {
    return await parseForms(this.$, this.elt, this.word)
  }

  macronizedWord: string
  ingestPronunciation(): Pronunciation {
    return parsePronunciation(this, this.$, this.elt, this.macronizedWord)
  }

  ingestEtymology(): string {
    return parseEtymology(this.$, this.elt)
  }

  ingestSynonyms(): Word[] {
    return []
  }

  ingestAntonyms(): Word[] {
    return []
  }
}
