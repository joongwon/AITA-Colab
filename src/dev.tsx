import { createRoot } from 'react-dom/client';
import "./base.css";
import "./content-script/codeCellStyles.css";
import { App } from './content-script/App';

const getCode = (codeCell : Element) => {
  const codeElems = codeCell.querySelectorAll(".view-line");
  const code = Array.from(codeElems).map(elem => elem.textContent ?? "").join("\n");
  return code;
}

function mountCodeCells(element: Element) {
  const codeCells = element.querySelectorAll(".cell.code");
  codeCells.forEach(codeCell => {
    const mainContent = codeCell.querySelector(".main-content")!;
    if (mainContent.children.length > 1) {
      // If there are already more than one child, skip this cell
      return;
    }
    const div = document.createElement("div");
    div.classList.add("w-max");
    mainContent.append(div);

    const root = createRoot(div);
    root.render(<App getCode={() => getCode(codeCell)} />);
  });
}

mountCodeCells(document.body);

const observer = new MutationObserver(
  (mutationsList) =>
    mutationsList
        .flatMap(mutation => Array.from(mutation.addedNodes))
        .filter(node => node instanceof Element)
        .forEach(node => mountCodeCells(node))
);
observer.observe(document.body, { childList: true, subtree: true });
