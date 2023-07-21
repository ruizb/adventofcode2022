import { Chunk, Effect, Number, Option, Tuple, pipe } from 'effect'
import { InputProvider } from '../../common/index.js'
import { Grid, buildGrid, emptyGrid } from '../part1/index.js'

const countVisibleTrees = (tree: number) => (treesLine: Chunk.Chunk<number>) =>
  pipe(
    treesLine,
    Chunk.splitWhere(Number.greaterThanOrEqualTo(tree)),
    Tuple.mapBoth({
      onFirst: Chunk.size,
      onSecond: _ => (Chunk.isNonEmpty(_) ? 1 : 0),
    }),
    Number.sumAll
  )

const computeHighestScenicScore = (grid: Grid) =>
  Chunk.reduce(grid.horizontalLines, -Infinity, (highestScore, hLine, i) => {
    if (i === 0 || i === Chunk.size(grid.horizontalLines) - 1) {
      return highestScore
    }

    return Chunk.reduce(
      grid.verticalLines,
      highestScore,
      (highestScore, vLine, j) => {
        if (j === 0 || j === Chunk.size(grid.verticalLines) - 1) {
          return highestScore
        }

        const [leftTrees, rightTrees] = pipe(
          Chunk.splitAt(hLine, j),
          Tuple.mapSecond(Chunk.drop(1))
        )
        const [topTrees, bottomTrees] = pipe(
          Chunk.splitAt(vLine, i),
          Tuple.mapSecond(Chunk.drop(1))
        )
        const tree = Chunk.unsafeGet(hLine, j)

        const up = Chunk.reverse(topTrees).pipe(countVisibleTrees(tree))
        const right = rightTrees.pipe(countVisibleTrees(tree))
        const down = bottomTrees.pipe(countVisibleTrees(tree))
        const left = Chunk.reverse(leftTrees).pipe(countVisibleTrees(tree))

        return Math.max(highestScore, up * right * down * left)
      }
    )
  })

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('../part1/input.txt', import.meta.url))
  ),
  Effect.map(Chunk.fromIterable),
  Effect.map(Chunk.reduce(emptyGrid, buildGrid)),
  Effect.map(computeHighestScenicScore)
)
