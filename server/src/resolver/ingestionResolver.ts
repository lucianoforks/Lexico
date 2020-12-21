import { Logger } from "tslog"
import { Arg, Mutation, Resolver } from "type-graphql"
import { FindManyOptions, getConnection, Like } from "typeorm"
import Entry from "../entity/Entry"
import Translation from "../entity/Translation"
import Word from "../entity/Word"
import ingestDictionary from "../ingestion/dictionary/ingestDictionary"
import ingestEntry from "../ingestion/dictionary/ingestEntry"
import { ingestTranslationReference } from "../ingestion/dictionary/ingestTranslationReferences"
import { getEntryForms } from "../ingestion/dictionary/ingestWord"
import ingestWiktionary, {
  categories,
} from "../ingestion/wiktionary/ingestWiktionary"
import backupDatabase from "../utils/backup"

const log = new Logger()

@Resolver()
export default class IngestionResolver {
  Entries = getConnection().getRepository(Entry)
  Words = getConnection().getRepository(Word)
  Translations = getConnection().getRepository(Translation)

  @Mutation(() => Boolean)
  async ingestEntries(
    @Arg("firstLetter") firstLetter: string,
    @Arg("lastLetter") lastLetter: string,
  ) {
    validateLetters([firstLetter, lastLetter])
    await ingestDictionary(firstLetter, lastLetter)
    backupDatabase()
    return true
  }

  @Mutation(() => Boolean)
  async ingestWords(
    @Arg("firstLetter") firstLetter: string,
    @Arg("lastLetter") lastLetter: string,
  ) {
    validateLetters([firstLetter, lastLetter])
    let params = {
      where: `REGEXP_LIKE(word, "^[${firstLetter}-${lastLetter}]", "i")`,
      order: { word: "ASC" },
      take: 100,
    } as FindManyOptions<Entry>
    let skip = 0
    let entries = await this.Entries.find({ ...params, skip })
    while (entries.length) {
      log.info(skip, "selected", entries.length, "from", entries[0].word)
      for (const entry of entries) {
        await getEntryForms(entry)
      }
      skip += params.take as number
      entries = await this.Entries.find({ ...params, skip })
    }
    backupDatabase()
    return true
  }

  @Mutation(() => Boolean)
  async ingestTranslationReferences() {
    let params = {
      where: { translation: Like("%{*%*}%") },
      order: { translation: "ASC" },
      relations: ["entry"],
      take: 100,
    } as FindManyOptions<Translation>
    let skip = 0
    let translations = await this.Translations.find({ ...params, skip })
    while (translations.length) {
      log.info(skip, "selected", translations.length)
      for (const translation of translations) {
        await ingestTranslationReference(translation)
      }
      skip += params.take as number
      translations = await this.Translations.find({ ...params, skip })
    }
    backupDatabase()
    return true
  }

  @Mutation(() => Boolean)
  async ingestEntry(@Arg("word") word: string) {
    await ingestEntry(word)
    return true
  }

  @Mutation(() => Boolean)
  async clearEntries(
    @Arg("firstLetter") firstLetter: string,
    @Arg("lastLetter") lastLetter: string,
  ) {
    if (firstLetter === "-") {
      const regex = `REGEXP_LIKE(word, "^\\-", "i")`
      await this.Words.query(`DELETE FROM entry WHERE ${regex}`)
      firstLetter = "a"
    }
    validateLetters([firstLetter, lastLetter])
    log.info("Clearing entries")
    const regex = `REGEXP_LIKE(word, "^[${firstLetter}-${lastLetter}]", "i")`
    await this.Entries.query(`DELETE FROM entry WHERE ${regex}`)
    log.info("Cleared entries")
    return true
  }

  @Mutation(() => Boolean)
  async clearWords(
    @Arg("firstLetter") firstLetter: string,
    @Arg("lastLetter") lastLetter: string,
  ) {
    if (firstLetter === "-") {
      const regex = `REGEXP_LIKE(word, "^\\-", "i")`
      await this.Words.query(`DELETE FROM word WHERE ${regex}`)
      firstLetter = "a"
    }
    validateLetters([firstLetter, lastLetter])
    log.info("Clearing words")
    const regex = `REGEXP_LIKE(word, "^[${firstLetter}-${lastLetter}]", "i")`
    await this.Words.query(`DELETE FROM word WHERE ${regex}`)
    log.info("Cleared words")
    return true
  }

  @Mutation(() => Boolean)
  async ingestWiktionary(
    @Arg("category") category: string,
    @Arg("firstLetter") firstLetter: string,
    @Arg("lastLetter") lastLetter: string,
  ) {
    if (!categories[category]) throw new Error("unknown category")
    validateLetters([firstLetter, lastLetter])
    await ingestWiktionary(category, firstLetter, lastLetter)
    return true
  }

  @Mutation(() => Boolean)
  async backupDatabase() {
    backupDatabase()
    return true
  }
}

function validateLetters(letters: string[]): void {
  for (const letter of letters) {
    if (!letter.match(/[a-z]/i)) throw new Error("invalid letter")
  }
}
