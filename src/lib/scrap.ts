import { Output, CodeCell, MarkdownCell } from "./cell";

type CellElem = {
  cellElem: HTMLElement;
} & (
  | {
      cellType: "code";
      statusElem: HTMLElement;
      getCell: () => CodeCell | null;
    }
  | {
      cellType: "markdown";
      getCell: () => MarkdownCell;
    }
);

function makeTextCell(source: string[]): MarkdownCell {
  return {
    cell_type: "markdown",
    source: source,
  };
}

function makeCodeCell(
  executionCount: number,
  outputs: Output[],
  source: string[],
): CodeCell {
  return {
    cell_type: "code",
    execution_count: executionCount,
    outputs: outputs,
    source: source,
  };
}

function codeOfHiddenCell(elt: HTMLElement): string[] {
  const monaco = elt.querySelector("pre.monaco-colorized");
  if (monaco === null) {
    throw new Error("Invalid element: pre.monaco-colorized");
  }

  const lines = Array.from(monaco.querySelectorAll<HTMLElement>("> span")).map(
    (line) => line.innerText,
  );

  return lines;
}

function codeOfVisibleCell(elt: HTMLElement): string[] {
  const lines = elt.querySelectorAll<HTMLElement>(".view-line");
  return Array.from(lines).map((line) => line.innerText);
}

function makeOutput(
  output_type: "result" | "stdout" | "stderr" | "display",
  text: string[],
): Output {
  return {
    output_type,
    text,
  };
}

// TODO: remove this function... we cannot extract output from cross-origin iframe.
// currently always returns empty array.
function outputOfCell(elt: HTMLElement): Output[] {
  const outputView = elt.querySelector<HTMLIFrameElement>(
    ".outputview > iframe",
  )!;
  const outputBody =
    outputView?.contentDocument?.body.querySelector<HTMLElement>(
      ".output-body",
    );
  if (!outputBody) {
    return [];
  }

  const outputs = Array.from(outputBody.children).map((child) => {
    const outputDiv = child as HTMLElement;
    const outType = outputDiv.classList[0];
    const outText = outputDiv.innerText.trim().split("\n");

    switch (outType) {
      case "execute_result":
        return makeOutput("result", outText);
      case "stream":
        return makeOutput("stdout", outText);
      case "error":
        return makeOutput("stderr", outText);
      case "display_data":
        return makeOutput("display", []);
      default:
        throw new Error("Unexpected output type: " + outType);
    }
  });
  return outputs;
}

/*
function cellOfElt(elt: HTMLElement): Cell {
  return cellElemOfElt(elt).getCell();
}
*/

async function cellElemOfElt(elt: HTMLElement): Promise<CellElem> {
  if (elt.classList.contains("text")) {
    // if a text cell
    const markdown = elt.querySelector<HTMLElement>("div.markdown");
    if (markdown === null) {
      throw new Error("Invalid element: `div.markdown` expected.");
    } else {
      const getCell = () => {
        const source = markdown.innerText
          .replace("keyboard_arrow_down", "")
          .trim()
          .split("\n");
        return makeTextCell(source);
      };
      return {
        getCell,
        cellType: "markdown",
        cellElem: elt,
      };
    }
  } else if (elt.classList.contains("code")) {
    // if a code cell

    const runButton = elt.querySelector<HTMLElement>("colab-run-button");
    if (!runButton) {
      throw new Error("Invalid element: `colab-run-button` expected.");
    }

    const statusElem =
      runButton?.shadowRoot?.querySelector<HTMLElement>(".status");

    if (statusElem) {
      return extractCodeCell(statusElem, elt);
    } else {
      return new Promise<CellElem>((resolve) => {
        const observer = new MutationObserver((mutations, obs) => {
          for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
              if (!(node instanceof HTMLElement)) continue;

              const statusElem =
                node.shadowRoot?.querySelector<HTMLElement>(".status");
              if (statusElem) {
                obs.disconnect();
                resolve(extractCodeCell(statusElem, elt));
                return;
              }
            }
          }
        });

        observer.observe(runButton, { childList: true, subtree: true });
      });
    }
  } else {
    throw new Error("Invalid element: `cell code` or `cell text` expected.");
  }
}

function extractCodeCell(statusElem: HTMLElement, elt: HTMLElement) {
  const executionCountElement =
    statusElem.querySelector<HTMLElement>(".execution-count");

  const getCell = () => {
    const lastRunElement = statusElem?.querySelector<HTMLElement>(".last-run");
    if (lastRunElement === null) {
      // if the cell has never been run or is still running
      return null;
    }

    const executionCount = parseInt(
      executionCountElement?.innerText.slice(1, -1) ?? "0",
    );

    const source =
      elt.style.display === "none" // if a cell collapsed
        ? codeOfHiddenCell(elt)
        : codeOfVisibleCell(elt);

    const outputs = outputOfCell(elt);

    return makeCodeCell(executionCount, outputs, source);
  };

  return {
    getCell,
    cellType: "code" as const,
    cellElem: elt,
    statusElem: statusElem,
  };
}

/**
 * Gets a array of cells from DOM.
 * @param {HTMLElement} root - The root element to search for cell elements.
 * @example
 * const cells = getCells(document.body);
 */
export function getCellElems(root: HTMLElement): Promise<CellElem>[] {
  const elems = Array.from(root.querySelectorAll<HTMLElement>("div.cell"));
  if (root.matches("div.cell")) {
    elems.push(root);
  }
  return elems.map((elt) => cellElemOfElt(elt));
}

/**
 * Get the cells before the specified cell.
 * @param {HTMLElement} cellElt - The cell element to get cells before.
 * @return {Cell[]}
 * @example
 * const cells = getCellsBefore(props.cellElt);
export function getCellsBefore(cellElt: HTMLElement): Cell[] {
  const cellArr: Cell[] = [];

  for (const elt of document.querySelectorAll<HTMLElement>("div.cell")) {
    if (elt === cellElt) {
      break; // Stop when we reach the specified cell
    }
    cellArr.push(cellOfElt(elt));
  }

  return cellArr;
}
 */
