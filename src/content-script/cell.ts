export type Output =
  | {
      output_type: "result" | "stdout" | "stderr";
      text: string[];
    }
  | {
      output_type: "display";
    };

export type CodeCell = {
  cell_type: "code";
  execution_count: number | null;
  outputs: Output[];
  source: string[];
};

export type ExecutedCodeCell = CodeCell & { execution_count: number };

export type MarkdownCell = {
  cell_type: "markdown";
  source: string[];
};

export type Cell = CodeCell | MarkdownCell;
