import { Chunk, Effect, Number, Option, Struct, Tuple, pipe } from 'effect'
import { InputProvider } from '../../common/index.js'

type TreeLine = Chunk.Chunk<number>

interface Grid {
  readonly horizontalLines: Chunk.Chunk<TreeLine>
  readonly verticalLines: Chunk.Chunk<TreeLine>
}

const emptyGrid: Grid = {
  horizontalLines: Chunk.empty<TreeLine>(),
  verticalLines: Chunk.empty<TreeLine>(),
}

const buildGrid = (result: Grid, line: string): Grid => {
  // Assumption: the line is only composed of digits
  const horizontalTrees = Chunk.fromIterable(line).pipe(
    Chunk.map(_ => parseInt(_, 10))
  )

  return Struct.evolve(result, {
    horizontalLines: Chunk.append(horizontalTrees),
    verticalLines: verticalLines =>
      Chunk.reduce(horizontalTrees, verticalLines, (vl, tree, index) =>
        Option.isNone(Chunk.get(vl, index))
          ? Chunk.append(vl, Chunk.of(tree))
          : Chunk.modify(vl, index, Chunk.append(tree))
      ),
  }) as Grid
}

const isTreeVisible = (
  tree: number,
  topTrees: TreeLine,
  rightTrees: TreeLine,
  bottomTrees: TreeLine,
  leftTrees: TreeLine
): boolean => {
  // Micro-optimization: sort tree lines from shortest to longest, to first check shortest lines and avoid unecessary iterations
  return (
    Chunk.every(topTrees, Number.lessThan(tree)) ||
    Chunk.every(rightTrees, Number.lessThan(tree)) ||
    Chunk.every(bottomTrees, Number.lessThan(tree)) ||
    Chunk.every(leftTrees, Number.lessThan(tree))
  )
}

const countVisibleTrees = (grid: Grid) =>
  Chunk.reduce(grid.horizontalLines, 0, (treesCount, hLine, i) => {
    if (i === 0 || i === Chunk.size(grid.horizontalLines) - 1) {
      return treesCount + Chunk.size(grid.horizontalLines)
    }

    return Chunk.reduce(
      grid.verticalLines,
      treesCount,
      (treesCount, vLine, j) => {
        if (j === 0 || j === Chunk.size(grid.verticalLines) - 1) {
          return treesCount + 1
        }

        const [left, right] = pipe(
          Chunk.splitAt(hLine, j),
          Tuple.mapSecond(Chunk.drop(1))
        )
        const [top, bottom] = pipe(
          Chunk.splitAt(vLine, i),
          Tuple.mapSecond(Chunk.drop(1))
        )
        const tree = Chunk.unsafeGet(hLine, j)

        return (
          treesCount + (isTreeVisible(tree, top, right, bottom, left) ? 1 : 0)
        )
      }
    )
  })

export const program = InputProvider.pipe(
  Effect.flatMap(inputProvider =>
    inputProvider.get(new URL('input.txt', import.meta.url))
  ),
  Effect.map(Chunk.fromIterable),
  Effect.map(Chunk.reduce(emptyGrid, buildGrid)),
  Effect.map(countVisibleTrees)
)
