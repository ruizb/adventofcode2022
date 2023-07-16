import { expect } from 'vitest'
import { Effect, Option } from 'effect'
import { ParseError, ParseErrors } from '@effect/schema/ParseResult'
import {
  MessageAnnotation,
  MessageAnnotationId,
  getAnnotation,
} from '@effect/schema/AST'

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
          expect(getErrorMessage(error.errors[0])).toEqual(expectedErrorMessage)

          // const errorMessage = formatErrors(error.errors)
          //   .replace('error(s) found\n', '')
          //   .replace('└─ ', '')
          // expect(errorMessage).toEqual(expectedErrorMessage)
        },
      })
    )
  )
}

import * as S from '@effect/schema/Schema'

const isParseError = (error: unknown): error is ParseError =>
  S.parseOption(
    S.object.pipe(S.filter(obj => '_tag' in obj && obj._tag === 'ParseError'))
  )(error).pipe(Option.isSome)

// inspired by https://github.com/Effect-TS/schema/blob/9a17bd3f03b5cff92a5849e68b222b67b85687e1/test/util.ts#L256
const getErrorMessage = (error: ParseErrors): string => {
  switch (error._tag) {
    case 'Type':
      return getAnnotation<MessageAnnotation<unknown>>(MessageAnnotationId)(
        error.expected
      ).pipe(
        Option.map(f => f(error.actual)),
        Option.orElse(() => error.message),
        Option.getOrThrow
      )
    default: // unused error tags for now
      return String(error)
  }
}
