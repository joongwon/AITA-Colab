import { createRoot } from "react-dom/client";
import "../base.css";
import { App } from "./App";
import { getCellElems } from "./scrap";
import { addExecutedCode } from "./executedCodes";

function setupCodeCells(element: HTMLElement) {
  const codeCellElems = getCellElems(element).filter(
    (cell) => cell.cellType === "code",
  );

  for (const { cellElem, cntElem, getCell } of codeCellElems) {
    const mainContent = cellElem.querySelector(".main-content")!;
    if (mainContent.children.length > 1) {
      // If there are more than one child, extension is already mounted
      return;
    }

    // Mount the extension UI
    const div = document.createElement("div");
    div.classList.add("w-max", "absolute", "top-3", "right-3");
    mainContent.append(div);

    const root = createRoot(div);
    root.render(<App parentElement={div} getCell={getCell} />);

    // Observe the execution count to track executed code
    if (!cntElem) {
      console.warn("Execution count element not found in code cell:", cellElem);
      continue;
    }
    const observer = new MutationObserver(() => {
      const executionCount = cntElem.innerText;
      if (executionCount !== "[ ]") {
        addExecutedCode(getCell());
      }
    });
    observer.observe(cntElem, { characterData: true, subtree: true });
  }
}

setupCodeCells(document.body);

const observer = new MutationObserver((mutationsList) =>
  mutationsList
    .flatMap((mutation) => Array.from(mutation.addedNodes))
    .filter((node) => node instanceof HTMLElement)
    .forEach(setupCodeCells),
);
observer.observe(document.body, { childList: true, subtree: true });
