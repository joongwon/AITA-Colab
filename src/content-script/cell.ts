export type Output =
  | {
      output_type: 'result' | 'stdout' | 'stderr';
      text: string[];
    }
  | {
      output_type: 'display';
    }

export type Cell =
  | {
      cell_type: 'code';
      execution_count?: number | null;
      outputs: Output[];
      source: string[];
    }
  | {
      cell_type: 'markdown';
      source: string[];
    }