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

const cellRoots = new Map<number, ReturnType<typeof createRoot>>();

function setupCodeCells(sessionId: string, element: HTMLElement) {
  const codeCellElems = getCellElems(element).filter(
    (cell) => cell.cellType === "code",
  );

  for (const { cellElem, cntElem, getCell } of codeCellElems) {
    // Observe the execution count to track executed code
    if (!cntElem) {
      console.warn("Execution count element not found in code cell:", cellElem);
      continue;
    }

    const cellId = (() => {
      if (cellElem.dataset.aitaCellId) {
        return Number(cellElem.dataset.aitaCellId);
      } else {
        const id = fresh_id();
        cellElem.dataset.aitaCellId = String(id);
        return id;
      }
    })();

    const observer = new MutationObserver(() => {
      const cell = getCell();
      if (cell.execution_count !== null) {
        // Mount the extension UI when the cell is executed
        const [parent, root] = (() => {
          const mainContent = cellElem.querySelector(".main-content")!;

          const oldRoot = cellRoots.get(cellId);
          if (oldRoot) {
            // Already mounted; reuse it
            const div = mainContent.lastChild;
            if (!(div instanceof HTMLElement)) {
              throw new Error("Expected last child to be an HTMLElement");
            }
            return [div, oldRoot];
          }

          // Mount the extension UI
          const div = document.createElement("div");
          div.classList.add("w-max", "absolute", "top-3", "right-3");
          mainContent.append(div);

          const root = createRoot(div);
          cellRoots.set(cellId, root);
          return [div, root];
        })();

        root.render(
          <App
            key={`${cellId}-${cell.execution_count}`}
            sessionId={sessionId}
            cellId={cellId}
            parentElement={parent}
            getCell={getCell}
          />,
        );

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

      const observer = new MutationObserver((mutationsList) => {
        mutationsList
          .flatMap((mutation) => Array.from(mutation.addedNodes))
          .filter((node) => node instanceof HTMLElement)
          .forEach((node) => setupCodeCells(sessionId, node));
      });
      observer.observe(document.body, { childList: true, subtree: true });
    })
    .catch((err) => {
      console.error("Failed to login:", err);
    });
}, 0);
