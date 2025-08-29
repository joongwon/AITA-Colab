import { ExecutedCodeCell } from "./cell";

/* codes executed in the notebook, in order of execution */
const executedCodes: ExecutedCodeCell[] = [];
export const getExecutedCodes = () => executedCodes;
export const addExecutedCode = (cell: ExecutedCodeCell) => {
  executedCodes.push(cell);
};

