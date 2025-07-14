import { createRoot } from 'react-dom/client';
import "../base.css";
import { useEffect, useState } from 'react';

const App = (props: { getCode: () => string }) => {
  const [code, _] = useState(() => props.getCode());
  return (
    <div>
      AI TA가 설명해줄 코드:
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

const codecells = document.getElementsByClassName("codecell-input-output");

function mount(cell: Element) {
  if ((cell as HTMLElement).dataset["mounted"] === "true") {
    return; // If already mounted, do not remount
  }
  const rootElem = document.createElement("div");
  cell.appendChild(rootElem);
  const root = createRoot(rootElem);
  root.render(<App getCode={() => {
    const codeElems = cell.querySelectorAll(".view-line");
    const code = Array.from(codeElems).map(elem => elem.textContent ?? "").join("\n");
    return code;
  }} />);
  (cell as HTMLElement).dataset["mounted"] = "true"; // Mark the cell as mounted to avoid remounting
}

for (const cell of codecells) {
  mount(cell);
}

const observer = new MutationObserver(function (mutationsList) {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const codecells = (node as Element).querySelectorAll(".codecell-input-output");
          for (const cell of codecells) {
            mount(cell);
          }
        }
      }
    }
  }
});
observer.observe(document.body, { childList: true, subtree: true });
