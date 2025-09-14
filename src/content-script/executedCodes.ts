/* codes executed in the notebook, in order of execution */
type ExecutedCode = {
  cell_id: number;
  code: string;
  execution_count: number;
};
const executedCodes: ExecutedCode[] = [];
export const getExecutedCodes = () => executedCodes;
export const addExecutedCode = (executedCode: ExecutedCode) => {
  executedCodes.push(executedCode);
};
