import { expect } from 'vitest'
import { Effect, Option, ReadonlyArray, pipe } from 'effect'
import * as S from '@effect/schema/Schema'
import { ParseError, ParseErrors } from '@effect/schema/ParseResult'
import * as AST from '@effect/schema/AST'
export const expectParseError = (
  runnable: Effect.Effect<never, unknown, unknown>,
  expectedErrorMessage: string
) => {
  Effect.runSync(
    runnable.pipe(
      Effect.match({
        onSuccess: () => {
          throw new Error('Unexpected test success')
        },
        onFailure: error => {
          if (!isParseError(error)) {
            throw new Error('Expected error to be a ParseError')
          }

          expect(error.errors).toHaveLength(1)

          expect(formatDecodeError(error.errors[0])).toEqual(
            expectedErrorMessage
          )

          // const errorMessage = formatErrors(error.errors)
          //   .replace('error(s) found\n', '')
          //   .replace('└─ ', '')
          // expect(errorMessage).toEqual(expectedErrorMessage)
        },
      })
    )
  )
}

const isParseError = (error: unknown): error is ParseError =>
  S.parseOption(
    S.object.pipe(S.filter(obj => '_tag' in obj && obj._tag === 'ParseError'))
  )(error).pipe(Option.isSome)

const getMessage = AST.getAnnotation<AST.MessageAnnotation<unknown>>(
  AST.MessageAnnotationId
)

// Taken from https://github.com/Effect-TS/schema/blob/9a17bd3f03b5cff92a5849e68b222b67b85687e1/test/util.ts#L256
const formatDecodeError = (e: ParseErrors): string => {
  switch (e._tag) {
    case 'Type':
      return pipe(
        getMessage(e.expected),
        Option.map(f => f(e.actual)),
        Option.orElse(() => e.message),
        Option.getOrElse(
          () =>
            `Expected ${formatExpected(e.expected)}, actual ${formatActual(
              e.actual
            )}`
        )
      )
    case 'Forbidden':
      return 'is forbidden'
    case 'Index':
      return `/${e.index} ${pipe(
        e.errors,
        ReadonlyArray.map(formatDecodeError),
        ReadonlyArray.join(', ')
      )}`
    case 'Key':
      return `/${String(e.key)} ${pipe(
        e.errors,
        ReadonlyArray.map(formatDecodeError),
        ReadonlyArray.join(', ')
      )}`
    case 'Missing':
      return `is missing`
    case 'Unexpected':
      return `is unexpected`
    case 'UnionMember':
      return `union member: ${pipe(
        e.errors,
        ReadonlyArray.map(formatDecodeError),
        ReadonlyArray.join(', ')
      )}`
  }
}

const formatActual = (actual: unknown): string => {
  if (
    actual === undefined ||
    actual === null ||
    typeof actual === 'number' ||
    typeof actual === 'symbol' ||
    actual instanceof Date
  ) {
    return String(actual)
  }
  if (typeof actual === 'bigint') {
    return String(actual) + 'n'
  }
  try {
    return JSON.stringify(actual)
  } catch (e) {
    return String(actual)
  }
}

const formatTemplateLiteralSpan = (span: AST.TemplateLiteralSpan): string => {
  switch (span.type._tag) {
    case 'StringKeyword':
      return '${string}'
    case 'NumberKeyword':
      return '${number}'
  }
}

const formatTemplateLiteral = (ast: AST.TemplateLiteral): string =>
  ast.head +
  ast.spans.map(span => formatTemplateLiteralSpan(span) + span.literal).join('')

const getTitle = AST.getAnnotation<AST.TitleAnnotation>(AST.TitleAnnotationId)

const getIdentifier = AST.getAnnotation<AST.IdentifierAnnotation>(
  AST.IdentifierAnnotationId
)

const getDescription = AST.getAnnotation<AST.DescriptionAnnotation>(
  AST.DescriptionAnnotationId
)

const getExpected = (ast: AST.AST): Option.Option<string> =>
  pipe(
    getIdentifier(ast),
    Option.orElse(() => getTitle(ast)),
    Option.orElse(() => getDescription(ast))
  )

const formatExpected = (ast: AST.AST): string => {
  switch (ast._tag) {
    case 'StringKeyword':
    case 'NumberKeyword':
    case 'BooleanKeyword':
    case 'BigIntKeyword':
    case 'UndefinedKeyword':
    case 'SymbolKeyword':
    case 'ObjectKeyword':
    case 'AnyKeyword':
    case 'UnknownKeyword':
    case 'VoidKeyword':
    case 'NeverKeyword':
      return Option.getOrElse(getExpected(ast), () => ast._tag)
    case 'Literal':
      return Option.getOrElse(getExpected(ast), () => formatActual(ast.literal))
    case 'UniqueSymbol':
      return Option.getOrElse(getExpected(ast), () => formatActual(ast.symbol))
    case 'Union':
      return ast.types.map(formatExpected).join(' or ')
    case 'TemplateLiteral':
      return Option.getOrElse(getExpected(ast), () =>
        formatTemplateLiteral(ast)
      )
    case 'Tuple':
      return Option.getOrElse(
        getExpected(ast),
        () => '<anonymous tuple or array schema>'
      )
    case 'TypeLiteral':
      return Option.getOrElse(
        getExpected(ast),
        () => '<anonymous type literal schema>'
      )
    case 'Enums':
      return Option.getOrElse(getExpected(ast), () =>
        ast.enums.map((_, value) => JSON.stringify(value)).join(' | ')
      )
    case 'Lazy':
      return Option.getOrElse(getExpected(ast), () => '<anonymous lazy schema>')
    case 'Declaration':
      return Option.getOrElse(
        getExpected(ast),
        () => '<anonymous declaration schema>'
      )
    case 'Refinement':
      return Option.getOrElse(
        getExpected(ast),
        () => '<anonymous refinement schema>'
      )
    case 'Transform':
      return Option.getOrElse(
        getExpected(ast),
        () => `${formatExpected(ast.from)} -> ${formatExpected(ast.to)}`
      )
  }
}
