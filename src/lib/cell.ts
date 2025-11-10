export type ResultOutput = {
  output_type: "result";
  text: string[];
};
export type StdoutOutput = {
  output_type: "stdout";
  text: string[];
};
export type StderrOutput = {
  output_type: "stderr";
  text: string[];
};
export type DisplayOutput = {
  output_type: "display";
};
export type Output = ResultOutput | StdoutOutput | StderrOutput | DisplayOutput;

export type ExecutedCodeCell = {
  cell_type: "code";
  execution_count: number;
  outputs: Output[];
  source: string[];
};

export type CodeCell = ExecutedCodeCell;

export type MarkdownCell = {
  cell_type: "markdown";
  source: string[];
};

export type Cell = CodeCell | MarkdownCell;
