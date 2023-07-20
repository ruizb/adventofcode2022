import { Chunk, Effect, HashMap, Number, Option, Struct } from 'effect'
import * as S from '@effect/schema/Schema'
import { ParseResult } from '@effect/schema/ParseResult'
import { InputProvider } from '../../common/index.js'
import { Command, Line, ListOutput, SupportedCommand } from './domain.js'

const getChunkOrEmpty = <A>(
  chunk: Option.Option<Chunk.Chunk<A>>
): Chunk.Chunk<A> => chunk.pipe(Option.getOrElse(() => Chunk.empty<A>()))

const getOrZero = (hm: HashMap.HashMap<string, number>, key: string): number =>
  HashMap.get(hm, key).pipe(Option.getOrElse(() => 0))

const parseLine = (line: string): ParseResult<Line> =>
  S.is(Command)(line)
    ? S.parse(SupportedCommand)(line)
    : S.parse(ListOutput)(line)

// const addChild = (
//   dir: Directory,
//   path: Chunk.Chunk<string>,
//   child: File | Directory
// ): Directory => {
//   if (Chunk.isEmpty(path)) {
//     return Struct.evolve(dir, {
//       children: _ => Chunk.append(_, child),
//     })
//   }

//   const nextDirName = Chunk.headNonEmpty(path as Chunk.NonEmptyChunk<string>)
//   const nextPath = Chunk.tail(path).pipe(getChunkOrEmpty)
//   const nextDirIndex = Chunk.findFirstIndex(
//     dir.children,
//     ({ name }) => name === nextDirName
//   )

//   return Option.match(nextDirIndex, {
//     onNone: () => dir,
//     onSome: index =>
//       Struct.evolve(dir, {
//         children: Chunk.modify(index, dir =>
//           addChild(dir as Directory, nextPath, child)
//         ),
//       }),
//   })
// }

export const computeTotalSizes = (
  lines: Chunk.Chunk<string>
): ParseResult<HashMap.HashMap<string, number>> => {
  const loop = (
    result: HashMap.HashMap<string, number>,
    path: Chunk.Chunk<string>,
    state: Chunk.Chunk<string>
  ): ParseResult<HashMap.HashMap<string, number>> => {
    if (Chunk.isEmpty(state)) {
      return Effect.succeed(result)
    }

    const line = Chunk.headNonEmpty(state as Chunk.NonEmptyChunk<string>)

    return parseLine(line).pipe(
      Effect.flatMap(parsedLine => {
        const nextState = Chunk.tail(state).pipe(getChunkOrEmpty)

        switch (parsedLine._tag) {
          case 'ChangeDirectoryCommand':
            const nextPath =
              parsedLine.dest === '/'
                ? Chunk.empty<string>()
                : parsedLine.dest === '..'
                ? Chunk.dropRight(path, 1)
                : Chunk.append(path, parsedLine.dest)

            return loop(result, nextPath, nextState)
          case 'ListCommand':
            return loop(result, path, nextState)
          case 'DirectoryOutput':
            return loop(
              result,
              // addChild(fileSystem, path, {
              //   ...parsedLine,
              //   _tag: 'Directory',
              //   children: Chunk.empty<File | Directory>(),
              // }),
              path,
              nextState
            )
          case 'FileOutput':
            const updateTotalSize = (
              hm: HashMap.HashMap<string, number>,
              path: Chunk.Chunk<string>
            ): HashMap.HashMap<string, number> => {
              if (Chunk.isEmpty(path)) {
                return hm
              }

              const fullDirName = Chunk.join(path, '/')
              return updateTotalSize(
                HashMap.set(
                  hm,
                  fullDirName,
                  getOrZero(hm, fullDirName) + parsedLine.size
                ),
                Chunk.dropRight(path, 1)
              )
            }
            const nextResult = updateTotalSize(result, path)
            const nextNextResult = HashMap.set(
              nextResult,
              '/',
              getOrZero(nextResult, '/') + parsedLine.size
            )

            return loop(
              nextNextResult,
              // addChild(fileSystem, path, { ...parsedLine, _tag: 'File' }),
              path,
              nextState
            )
        }
      })
    )
  }

  const initialResult = HashMap.empty<string, number>()
  // const initialFileSystem: Directory = {
  //   _tag: 'Directory',
  //   name: '/',
  //   children: Chunk.empty<File | Directory>(),
  // }

  return loop(
    initialResult,
    // initialFileSystem,
    Chunk.empty<string>(),
    lines
  )
}

const computeAnswer = (totalSizes: HashMap.HashMap<string, number>): number =>
  totalSizes.pipe(
    HashMap.filter(Number.lessThanOrEqualTo(100_000)),
    HashMap.values,
    Number.sumAll
  )

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('input.txt', import.meta.url))
  ),
  Effect.map(Chunk.fromIterable),
  Effect.flatMap(computeTotalSizes),
  Effect.map(computeAnswer)
)
