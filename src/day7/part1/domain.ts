import { Chunk, Option, String, pipe } from 'effect'
import * as S from '@effect/schema/Schema'
import { failure, success, type } from '@effect/schema/ParseResult'

export interface Directory {
  readonly _tag: 'Directory'
  readonly name: string
  readonly children: Chunk.Chunk<Directory | File>
}

export interface File {
  _tag: 'File'
  readonly name: string
  readonly size: number
}

export const Command = S.string.pipe(
  S.startsWith('$ '),
  _ => _ as S.Schema<string, `$ ${string}`>
)

const ChangeDirectoryCommand = S.struct({
  _tag: S.literal('ChangeDirectoryCommand'),
  dest: S.string,
}).pipe(S.identifier('"$ cd"'))
export type ChangeDirectoryCommand = S.To<typeof ChangeDirectoryCommand>

const ListCommand = S.struct({
  _tag: S.literal('ListCommand'),
}).pipe(S.identifier('"$ ls"'))
export type ListCommand = S.To<typeof ListCommand>

const SupportedCommandSchema = S.union(ChangeDirectoryCommand, ListCommand)

export const SupportedCommand = S.transformResult(
  Command,
  SupportedCommandSchema,
  cmd =>
    cmd.startsWith('$ cd ')
      ? success({
          _tag: 'ChangeDirectoryCommand',
          dest: cmd.replace('$ cd ', ''),
        } as const)
      : cmd === '$ ls'
      ? success({ _tag: 'ListCommand' } as const)
      : failure(type(SupportedCommandSchema.ast, cmd)),
  () => success('$ not implemented' as const)
)
export type SupportedCommand = S.To<typeof SupportedCommand>

const FileOutput = S.struct({
  _tag: S.literal('FileOutput'),
  name: S.string,
  size: S.number,
})
export type FileOutput = S.To<typeof FileOutput>

const DirectoryOutput = S.struct({
  _tag: S.literal('DirectoryOutput'),
  name: S.string,
})
export type DirectoryOutput = S.To<typeof DirectoryOutput>

const ListOutputSchema = S.union(FileOutput, DirectoryOutput)

const dirPattern = /^dir (.+)$/
const filePattern = /^(\d+) (.+)$/

export const ListOutput = S.transformResult(
  S.string,
  ListOutputSchema,
  output =>
    pipe(
      output,
      String.match(dirPattern),
      Option.map(([_, name]) =>
        success({ _tag: 'DirectoryOutput', name } as const)
      ),
      Option.orElse(() =>
        pipe(
          output,
          String.match(filePattern),
          Option.map(([_, size, name]) =>
            success({
              _tag: 'FileOutput',
              name,
              size: parseInt(size, 10),
            } as const)
          )
        )
      ),
      Option.getOrElse(() =>
        failure(
          type(
            S.union(
              S.string.pipe(S.pattern(dirPattern)),
              S.string.pipe(S.pattern(filePattern))
            ).ast,
            output
          )
        )
      )
    ),
  () => success('not implemented' as const)
)
export type ListOutput = S.To<typeof ListOutput>

export type Line = SupportedCommand | ListOutput
