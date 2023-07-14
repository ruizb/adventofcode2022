import { promises as fs } from 'node:fs'
import { Effect, List } from 'effect'

export const parseFile = (path: string | URL) => {
  return Effect.tryPromise(() => fs.readFile(path, 'utf-8'))
}

export const parseFileLines = (fileContents: string): List.List<string> => {
  return List.fromIterable(fileContents.trimEnd().split('\n'))
}
