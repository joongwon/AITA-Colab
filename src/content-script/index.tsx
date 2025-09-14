import { createRoot } from "react-dom/client";
import "../base.css";
import { App } from "./App";
import { getCellElems } from "./scrap";
import { addExecutedCode } from "./executedCodes";
import { login } from "./api";

const fresh_id = (() => {
  let next_id = 0;
  return () => {
    next_id += 1;
    return next_id;
  };
})();

function setupCodeCells(sessionId: string, element: HTMLElement) {
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
    const cellId = fresh_id();
    root.render(
      <App
        sessionId={sessionId}
        cellId={cellId}
        parentElement={div}
        getCell={getCell}
      />,
    );

    // Observe the execution count to track executed code
    if (!cntElem) {
      console.warn("Execution count element not found in code cell:", cellElem);
      continue;
    }
    const observer = new MutationObserver(() => {
      const cell = getCell();
      if (cell.execution_count !== null) {
        addExecutedCode({
          cell_id: cellId,
          code: cell.source.join("\n"),
          execution_count: cell.execution_count,
        });
      }
    });
    observer.observe(cntElem, { characterData: true, subtree: true });
  }
}

// Wait for the notebook to load
setTimeout(() => {
  login({})
    .then(({ session_id: sessionId }) => {
      setupCodeCells(sessionId, document.body);

      const observer = new MutationObserver((mutationsList) =>
        mutationsList
          .flatMap((mutation) => Array.from(mutation.addedNodes))
          .filter((node) => node instanceof HTMLElement)
          .forEach((node) => setupCodeCells(sessionId, node)),
      );
      observer.observe(document.body, { childList: true, subtree: true });
    })
    .catch((err) => {
      console.error("Failed to login:", err);
    });
}, 3000);
