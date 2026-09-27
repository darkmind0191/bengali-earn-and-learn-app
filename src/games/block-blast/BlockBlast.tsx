import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Heart, RotateCcw, Trophy, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Cell = number | null;

type Shape = {
  id: number;
  cells: number[][];
};

const BOARD_SIZE = 8;
const HIGH_SCORE_KEY = 'blockBlastHighScore';

const SHAPES: number[][][] = [
  [[1]],
  [[1, 1]],
  [[1], [1]],
  [[1, 1], [1, 1]],
  [[1, 1, 1]],
  [[1], [1], [1]],
  [[1, 1, 1, 1]],
  [[1], [1], [1], [1]],
  [[1, 1, 1], [0, 1, 0]],
  [[1, 0], [1, 1]],
  [[0, 1], [1, 1]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 1], [1, 0, 0]],
  [[1, 1, 1], [0, 0, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[1, 1], [1, 1], [1, 0]],
  [[1, 1], [1, 1], [0, 1]],
];

const cloneBoard = (board: Cell[][]): Cell[][] =>
  board.map((row) => [...row]);

const createEmptyBoard = (): Cell[][] =>
  Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );

const randomColor = () => {
  const colors = [
    1, 2, 3, 4, 5, 6, 7, 8,
  ];

  return colors[
    Math.floor(Math.random() * colors.length)
  ];
};

const createShape = (id: number): Shape => {
  const template =
    SHAPES[Math.floor(Math.random() * SHAPES.length)];

  return {
    id,
    cells: template.map((row) => [...row]),
  };
};

const shapeWidth = (shape: Shape) =>
  Math.max(...shape.cells.map((row) => row.length));

const shapeHeight = (shape: Shape) =>
  shape.cells.length;

const canPlaceShape = (
  board: Cell[][],
  shape: Shape,
  row: number,
  col: number
) => {
  for (let r = 0; r < shape.cells.length; r++) {
    for (let c = 0; c < shape.cells[r].length; c++) {
      if (!shape.cells[r][c]) continue;

      const boardRow = row + r;
      const boardCol = col + c;

      if (
        boardRow < 0 ||
        boardRow >= BOARD_SIZE ||
        boardCol < 0 ||
        boardCol >= BOARD_SIZE
      ) {
        return false;
      }

      if (board[boardRow][boardCol] !== null) {
        return false;
      }
    }
  }

  return true;
};

const placeShape = (
  board: Cell[][],
  shape: Shape,
  row: number,
  col: number,
  color: number
) => {
  const next = cloneBoard(board);

  for (let r = 0; r < shape.cells.length; r++) {
    for (let c = 0; c < shape.cells[r].length; c++) {
      if (shape.cells[r][c]) {
        next[row + r][col + c] = color;
      }
    }
  }

  return next;
};

const clearCompletedLines = (board: Cell[][]) => {
  const fullRows: number[] = [];
  const fullCols: number[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    if (board[r].every((cell) => cell !== null)) {
      fullRows.push(r);
    }
  }

  for (let c = 0; c < BOARD_SIZE; c++) {
    let full = true;

    for (let r = 0; r < BOARD_SIZE; r++) {
      if (board[r][c] === null) {
        full = false;
        break;
      }
    }

    if (full) {
      fullCols.push(c);
    }
  }

  if (fullRows.length === 0 && fullCols.length === 0) {
    return {
      board,
      lines: 0,
    };
  }

  const next = cloneBoard(board);

  for (const row of fullRows) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      next[row][c] = null;
    }
  }

  for (const col of fullCols) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      next[r][col] = null;
    }
  }

  return {
    board: next,
    lines: fullRows.length + fullCols.length,
  };
};

const hasAnyMove = (
  board: Cell[][],
  shapes: Shape[]
) => {
  for (const shape of shapes) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (canPlaceShape(board, shape, row, col)) {
          return true;
        }
      }
    }
  }

  return false;
};

const colorClass: Record<number, string> = {
  1: 'bg-pink-500',
  2: 'bg-purple-500',
  3: 'bg-blue-500',
  4: 'bg-cyan-400',
  5: 'bg-emerald-400',
  6: 'bg-yellow-400',
  7: 'bg-orange-500',
  8: 'bg-red-500',
};

export default function BlockBlast() {
  const navigate = useNavigate();

  const [board, setBoard] = useState<Cell[][]>(
    createEmptyBoard
  );

  const [shapes, setShapes] = useState<Shape[]>(() => [
    createShape(1),
    createShape(2),
    createShape(3),
  ]);

  const [score, setScore] = useState(0);

  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem(HIGH_SCORE_KEY);
    return saved ? Number(saved) : 0;
  });

  const [lives, setLives] = useState(3);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const [selectedShape, setSelectedShape] =
    useState<number | null>(null);

  const [preview, setPreview] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const [message, setMessage] = useState<string | null>(
    null
  );

  const [dragging, setDragging] = useState(false);

  const startGame = useCallback(() => {
    setBoard(createEmptyBoard());

    setShapes([
      createShape(1),
      createShape(2),
      createShape(3),
    ]);

    setScore(0);
    setLives(3);

    setSelectedShape(null);
    setPreview(null);
    setMessage(null);
    setDragging(false);

    setGameOver(false);
    setGameStarted(true);
  }, []);

  const finishGame = useCallback(() => {
    setGameStarted(false);
    setGameOver(true);
    setSelectedShape(null);
    setPreview(null);
  }, []);

  const selectShape = (index: number) => {
    if (!gameStarted || gameOver) return;

    setSelectedShape(index);
    setPreview(null);
    setDragging(true);
  };

  const getCellFromPointer = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    const boardElement =
      event.currentTarget.getBoundingClientRect();

    const x =
      event.clientX - boardElement.left;

    const y =
      event.clientY - boardElement.top;

    const cellWidth =
      boardElement.width / BOARD_SIZE;

    const cellHeight =
      boardElement.height / BOARD_SIZE;

    return {
      row: Math.floor(y / cellHeight),
      col: Math.floor(x / cellWidth),
    };
  };

  const updatePreview = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      selectedShape === null ||
      !gameStarted ||
      gameOver
    ) {
      return;
    }

    const cell = getCellFromPointer(event);

    const shape = shapes[selectedShape];

    if (!shape) return;

    const height = shapeHeight(shape);
    const width = shapeWidth(shape);

    let row = cell.row - Math.floor(height / 2);
    let col = cell.col - Math.floor(width / 2);

    row = Math.max(
      0,
      Math.min(
        BOARD_SIZE - height,
        row
      )
    );

    col = Math.max(
      0,
      Math.min(
        BOARD_SIZE - width,
        col
      )
    );

    setPreview({
      row,
      col,
    });
  };

  const placeSelectedShape = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      selectedShape === null ||
      !gameStarted ||
      gameOver
    ) {
      return;
    }

    const shape = shapes[selectedShape];

    if (!shape) return;

    const cell = getCellFromPointer(event);

    const height = shapeHeight(shape);
    const width = shapeWidth(shape);

    let row = cell.row - Math.floor(height / 2);
    let col = cell.col - Math.floor(width / 2);

    row = Math.max(
      0,
      Math.min(
        BOARD_SIZE - height,
        row
      )
    );

    col = Math.max(
      0,
      Math.min(
        BOARD_SIZE - width,
        col
      )
    );

    if (
      !canPlaceShape(
        board,
        shape,
        row,
        col
      )
    ) {
      setMessage('❌ এখানে Block বসানো যাবে না!');

      setTimeout(() => {
        setMessage(null);
      }, 1400);

      return;
    }

    const color = randomColor();

    const placedBoard = placeShape(
      board,
      shape,
      row,
      col,
      color
    );

    const result =
      clearCompletedLines(placedBoard);

    const nextShapes = [...shapes];

    nextShapes.splice(
      selectedShape,
      1,
      createShape(Date.now())
    );

    setBoard(result.board);
    setShapes(nextShapes);

    const basePoints =
      shape.cells.flat().filter(Boolean).length * 2;

    const lineBonus =
      result.lines * result.lines * 20;

    const gained =
      basePoints + lineBonus;

    setScore((current) => {
      const next = current + gained;

      if (next > highScore) {
        setHighScore(next);

        localStorage.setItem(
          HIGH_SCORE_KEY,
          String(next)
        );
      }

      return next;
    });

    if (result.lines > 0) {
      setMessage(
        result.lines === 1
          ? '💥 LINE BLAST!'
          : `💥 ${result.lines} LINES BLAST!`
      );

      setTimeout(() => {
        setMessage(null);
      }, 1400);
    }

    setSelectedShape(null);
    setPreview(null);
    setDragging(false);

    const nextBoard = result.board;

    if (!hasAnyMove(nextBoard, nextShapes)) {
      finishGame();
    }
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!dragging) return;

    updatePreview(event);
  };

  const handlePointerUp = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!dragging) return;

    placeSelectedShape(event);
  };

  const handlePointerLeave = () => {
    if (dragging) {
      setPreview(null);
    }
  };

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);

      localStorage.setItem(
        HIGH_SCORE_KEY,
        String(score)
      );
    }
  }, [highScore, score]);

  const previewCells = useMemo(() => {
    if (
      selectedShape === null ||
      preview === null
    ) {
      return new Set<string>();
    }

    const shape = shapes[selectedShape];

    if (!shape) {
      return new Set<string>();
    }

    const cells = new Set<string>();

    for (let r = 0; r < shape.cells.length; r++) {
      for (let c = 0; c < shape.cells[r].length; c++) {
        if (shape.cells[r][c]) {
          cells.add(
            `${preview.row + r}-${preview.col + c}`
          );
        }
      }
    }

    return cells;
  }, [preview, selectedShape, shapes]);

  const previewValid = useMemo(() => {
    if (
      selectedShape === null ||
      preview === null
    ) {
      return false;
    }

    const shape = shapes[selectedShape];

    if (!shape) return false;

    return canPlaceShape(
      board,
      shape,
      preview.row,
      preview.col
    );
  }, [
    board,
    preview,
    selectedShape,
    shapes,
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-slate-900 border-b border-slate-800">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center active:scale-95"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="text-center">
          <h1 className="text-xl font-black tracking-wide">
            BLOCK BLAST
          </h1>

          <p className="text-xs text-slate-400">
            ব্লক বসান, লাইন ভাঙুন
          </p>
        </div>

        <div className="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Sparkles
            size={22}
            className="text-purple-300"
          />
        </div>
      </div>

      {/* HUD */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2 bg-slate-900/80">
        <div className="rounded-xl bg-slate-800 px-3 py-2">
          <div className="text-[10px] text-slate-400">
            SCORE
          </div>

          <div className="font-black text-lg">
            {score}
          </div>
        </div>

        <div className="rounded-xl bg-slate-800 px-3 py-2 text-center">
          <div className="text-[10px] text-slate-400">
            LIFE
          </div>

          <div className="flex justify-center gap-1 mt-1">
            {Array.from(
              { length: 3 },
              (_, index) => (
                <Heart
                  key={index}
                  size={17}
                  fill={
                    index < lives
                      ? 'currentColor'
                      : 'transparent'
                  }
                  className={
                    index < lives
                      ? 'text-red-400'
                      : 'text-slate-600'
                  }
                />
              )
            )}
          </div>
        </div>

        <div className="rounded-xl bg-slate-800 px-3 py-2 text-right">
          <div className="text-[10px] text-slate-400">
            BEST
          </div>

          <div className="font-black text-lg text-yellow-400">
            {highScore}
          </div>
        </div>
      </div>

      {/* Game */}
      <div className="flex-1 px-3 py-4 flex flex-col items-center">
        <div
          className="w-full max-w-md"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
        >
          {/* Board */}
          <div className="relative aspect-square rounded-3xl bg-slate-900 border border-slate-700 p-2 shadow-2xl touch-none select-none">
            <div className="grid grid-cols-8 gap-1.5 w-full h-full">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const key = `${rowIndex}-${colIndex}`;

                  const isPreview =
                    previewCells.has(key);

                  return (
                    <div
                      key={key}
                      className={`rounded-md transition-all duration-100 ${
                        cell !== null
                          ? colorClass[cell]
                          : isPreview
                            ? previewValid
                              ? 'bg-white/30'
                              : 'bg-red-500/40'
                            : 'bg-slate-800'
                      }`}
                    />
                  );
                })
              )}
            </div>

            {/* Start */}
            {!gameStarted && !gameOver && (
              <div className="absolute inset-0 rounded-3xl bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-5">
                <div className="w-full rounded-3xl bg-slate-900 border border-purple-500/30 p-6 text-center">
                  <div className="text-6xl mb-3">
                    🧱
                  </div>

                  <h2 className="text-2xl font-black">
                    BLOCK BLAST
                  </h2>

                  <p className="text-sm text-slate-400 mt-2">
                    Block বসিয়ে পুরো Row বা Column
                    পূর্ণ করুন এবং Blast করুন!
                  </p>

                  <button
                    type="button"
                    onClick={startGame}
                    className="mt-6 w-full py-4 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-black text-lg shadow-lg active:scale-95"
                  >
                    🧱 START GAME
                  </button>
                </div>
              </div>
            )}

            {/* Game Over */}
            {gameOver && (
              <div className="absolute inset-0 rounded-3xl bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-5">
                <div className="w-full rounded-3xl bg-slate-900 border border-purple-500/30 p-6 text-center shadow-2xl">
                  <Trophy
                    size={55}
                    className="mx-auto text-yellow-400"
                  />

                  <h2 className="mt-3 text-3xl font-black">
                    GAME OVER
                  </h2>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <div className="bg-slate-800 rounded-2xl p-4">
                      <div className="text-xs text-slate-400">
                        SCORE
                      </div>

                      <div className="text-2xl font-black mt-1">
                        {score}
                      </div>
                    </div>

                    <div className="bg-slate-800 rounded-2xl p-4">
                      <div className="text-xs text-slate-400">
                        BEST
                      </div>

                      <div className="text-2xl font-black mt-1 text-yellow-400">
                        {highScore}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={startGame}
                    className="mt-6 w-full py-4 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-black text-lg shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={20} />
                    PLAY AGAIN
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className="mt-3 text-center font-black text-yellow-300 animate-pulse">
              {message}
            </div>
          )}

          {/* Pieces */}
          <div className="mt-5 rounded-3xl bg-slate-900 border border-slate-800 p-4">
            <div className="text-center text-xs font-bold text-slate-400 mb-4">
              BLOCK বেছে নিয়ে BOARD-এ বসান
            </div>

            <div className="grid grid-cols-3 gap-3">
              {shapes.map((shape, index) => {
                const selected =
                  selectedShape === index;

                return (
                  <button
                    key={shape.id}
                    type="button"
                    onPointerDown={() =>
                      selectShape(index)
                    }
                    disabled={!gameStarted}
                    className={`h-28 rounded-2xl flex items-center justify-center transition-all ${
                      selected
                        ? 'bg-purple-500/30 ring-2 ring-purple-400 scale-105'
                        : 'bg-slate-800 hover:bg-slate-700'
                    } disabled:opacity-50`}
                  >
                    <div
                      className="grid gap-1"
                      style={{
                        gridTemplateColumns: `repeat(${shapeWidth(
                          shape
                        )}, 20px)`,
                      }}
                    >
                      {shape.cells.map(
                        (row, r) =>
                          row.map((cell, c) => (
                            <div
                              key={`${r}-${c}`}
                              className={`w-5 h-5 rounded ${
                                cell
                                  ? colorClass[
                                      ((index + 3) %
                                        8) +
                                        1
                                    ]
                                  : 'opacity-0'
                              }`}
                            />
                          ))
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-5 text-center text-xs text-slate-500">
        একই Row বা Column পূর্ণ হলেই সেটি Blast হবে 💥
      </div>
    </div>
  );
}