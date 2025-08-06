import { createRoot } from "react-dom/client";
import "../base.css";
import { App } from "./App";

/* codes executed in the notebook, in order of execution */
const executedCodes: string[] = [];
const getExecutedCodes = () => executedCodes;
const addExecutedCode = (code: string) => {
  executedCodes.push(code);
};

const getCode = (codeCell: Element) => {
  const codeElems = codeCell.querySelectorAll(".view-line");
  const code = Array.from(codeElems)
    .map((elem) => elem.textContent ?? "")
    .join("\n");
  return code;
};

function setupCodeCells(element: Element) {
  for (const codeCell of element.querySelectorAll(".cell.code")) {
    const mainContent = codeCell.querySelector(".main-content")!;
    if (mainContent.children.length > 1) {
      // If there are more than one child, extension is already mounted
      return;
    }

    // Mount the extension UI
    const div = document.createElement("div");
    div.classList.add("w-max", "absolute", "top-3", "right-3");
    mainContent.append(div);

    const root = createRoot(div);
    root.render(<App parentElement={div} getCode={() => getCode(codeCell)} />);

    // Observe the execution count to track executed code
    const countElem = codeCell
      .querySelector("colab-run-button")
      ?.shadowRoot?.querySelector<HTMLElement>(".execution-count");
    if (!countElem) {
      console.warn("Execution count element not found in code cell:", codeCell);
      continue;
    }
    const observer = new MutationObserver(() => {
      const executionCount = countElem.innerText;
      if (executionCount !== "[ ]") {
        const code = getCode(codeCell);
        addExecutedCode(code);
        console.debug("Code executed:", code);
      }
    });
    observer.observe(countElem, { characterData: true, subtree: true });
  }
}

setupCodeCells(document.body);

const observer = new MutationObserver((mutationsList) =>
  mutationsList
    .flatMap((mutation) => Array.from(mutation.addedNodes))
    .filter((node) => node instanceof Element)
    .forEach(setupCodeCells),
);
observer.observe(document.body, { childList: true, subtree: true });
