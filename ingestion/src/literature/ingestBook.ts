import fs from "fs-extra"
import { getConnection } from "typeorm"
import Author from "../../../entity/literature/Author"
import Book from "../../../entity/literature/Book"
import ingestText from "./ingestText"

export default async function ingestBook(author: Author, title: string) {
  const Books = getConnection().getRepository(Book)
  const book = await Books.save({
    id: `${author.id}_${title}`,
    title,
    author,
  })
  const titles = fs.readdirSync(
    `../data/literature/${author.id}/${book.title}`,
  ) as string[]
  for (const title of titles) {
    await ingestText(author, book, title)
  }
}
