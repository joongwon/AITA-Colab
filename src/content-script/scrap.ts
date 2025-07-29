import { Output, Cell } from "./cell";

function makeTextCell(source: string[]): Cell {
  return {
    cell_type: 'markdown',
    source: source
  };
}

function makeCodeCell(outputs: Output[], source: string[]): Cell {
  return {
    cell_type: 'code',
    outputs: outputs,
    source: source
  };
}

function codeOfHiddenCell(elt: HTMLElement): string[] {
  let monaco = elt.querySelector('pre.monaco-colorized');
  if (monaco === null) {
    throw new Error("Invalid element: pre.monaco-colorized")
  }

  let lines = [];
  let children = monaco.children;

  for (let child of children) {
    let line = child as HTMLElement;
    if (line.nodeName === "SPAN") {
      lines.push(line.innerText)
    }
  }

  return lines;
}

function codeOfVisibleCell(elt: HTMLElement): string[] {
  let inputArea = elt.querySelector<HTMLElement>('pre.inputarea');
  if (inputArea === null) {
    throw new Error("Invalid element: pre.inputarea")
  }

  return inputArea.innerText.trim().split('\n');
}

function makeOutput(
  output_type: 'result' | 'stdout' | 'stderr' | 'display',
  text: string[]
): Output {
  return {
    output_type: output_type,
    text: text
  };
}

function outputOfCell(elt: HTMLElement): Output[] {
  let outputBody = elt.querySelector<HTMLElement>('div.output-body');
  if (outputBody === null) {
    return [];
  }

  let outputs = [];
  let children = outputBody.children;

  for (let child of children) {
    let outputDiv = child as HTMLElement;
    let outType = outputDiv.className.split(' ')[0];
    let outText = outputDiv.innerText.trim().split('\n');

    switch (outType) {
      case "execute_result":
        outputs.push(makeOutput('result', outText));
        break;
      case "stream":
        outputs.push(makeOutput('stdout', outText));
        break;
      case "error":
        outputs.push(makeOutput('stderr', outText));
        break;
      case "display_data":
        outputs.push(makeOutput('display', []));
        break;
      default:
        throw new Error("Unexpected output type: " + outType)
    }
  }

  return outputs;
}

function cellOfElt(elt: HTMLElement): Cell {
  let name = elt.className;
  if (name.includes("text")) {
    let markdown = elt.querySelector<HTMLElement>('div.markdown');
    if (markdown === null) {
      throw new Error("Invalid element: `div.markdown` expected.");
    } else {
      let source = markdown.innerText
        .replace("keyboard_arrow_down", "")
        .trim()
        .split('\n');
      return makeTextCell(source);
    }
  } else if (name.includes("code")) {
    let source = elt.style.display === "none" ? codeOfHiddenCell(elt) : codeOfVisibleCell(elt);
    let outputs = name.includes("code-has-output") ? outputOfCell(elt) : [];
    return makeCodeCell(outputs, source);
  } else {
    throw new Error("Invalid element: `cell code` or `cell text` expected.");
  }
}

function getCells(document: Document): [Cell, Cell[]] {
  let currentCell: Cell | null = null;
  let cellArr: Cell[] = [];

  document.querySelectorAll<HTMLElement>('div.cell')
    .forEach((elt) => {
      if (elt.className.includes("focused")) {
        let source = codeOfVisibleCell(elt);
        let outputs = outputOfCell(elt);
        currentCell = makeCodeCell(outputs, source);
      } else if (currentCell === null) {
        cellArr.push(cellOfElt(elt));
      }
    });

  if (currentCell === null) {
    let maybeCurrentCell = cellArr
      .filter((cell) => { cell.cell_type === 'code' && cell.outputs.length > 0 })
      .pop();
    if (maybeCurrentCell === undefined) {
      throw new Error("Focused cell not exists.");
    } else {
      currentCell = maybeCurrentCell;
    }
  }
  return [currentCell, cellArr];
}
