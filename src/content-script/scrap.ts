import { Output, Cell } from "./cell";

function makeTextCell(source: string[]): Cell {
  return {
    cell_type: "markdown",
    source: source,
  };
}

function makeCodeCell(
  executionCount: number | null,
  outputs: Output[],
  source: string[],
): Cell {
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
  const inputArea = elt.querySelector<HTMLElement>("pre.inputarea");
  if (inputArea === null) {
    throw new Error("Invalid element: pre.inputarea");
  }

  return inputArea.innerText.trim().split("\n");
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

function outputOfCell(elt: HTMLElement): Output[] {
  const outputBody = elt.querySelector<HTMLElement>("div.output-body");
  if (outputBody === null) {
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

function cellOfElt(elt: HTMLElement): Cell {
  console.log(name);
  const name = elt.className;
  if (name.includes("text")) {
    // if a text cell
    const markdown = elt.querySelector<HTMLElement>("div.markdown");
    if (markdown === null) {
      throw new Error("Invalid element: `div.markdown` expected.");
    } else {
      const source = markdown.innerText
        .replace("keyboard_arrow_down", "")
        .trim()
        .split("\n");
      return makeTextCell(source);
    }
  } else if (name.includes("code")) {
    // if a code cell
    const source =
      elt.style.display === "none" // if a cell collapsed
        ? codeOfHiddenCell(elt)
        : codeOfVisibleCell(elt);

    const outputs = name.includes("code-has-output") // if a cell has output
      ? outputOfCell(elt)
      : [];

    const executionCountText = elt
      .querySelector("colab-run-button")
      ?.shadowRoot?.querySelector<HTMLElement>(".execution-count")?.innerText;

    const executionCount =
      executionCountText !== null &&
      executionCountText !== undefined &&
      executionCountText !== "[ ]" // unless not ever executed
        ? Number(executionCountText.slice(1, -1))
        : null;

    return makeCodeCell(executionCount, outputs, source);
  } else {
    throw new Error("Invalid element: `cell code` or `cell text` expected.");
  }
}

/**
 * Gets a array of cells from DOM.
 * But *cannot* tell which cell if focused.
 * @param {document} document
 * @returns {Cell[]}
 * @example
 * const cells = getCells(document);
 */
export function getCells(document: Document): Cell[] {
  const cellArr: Cell[] = [];

  document.querySelectorAll<HTMLElement>("div.cell").forEach((elt) => {
    cellArr.push(cellOfElt(elt));
  });

  return cellArr;
}
