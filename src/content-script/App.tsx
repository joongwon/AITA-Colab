import "../base.css";
import { useState } from 'react';

type state =
  | {
      // The user has not yet requested an explanation.
      tag: "inactive";
    }
  | {
      // The user has requested an explanation and the code is available.
      tag: "active";
      code: string;
    };
;

/**
 * This function is used to ensure that all possible cases of the state are handled.
 * If a new state is added but not handled in the switch statement,
 * this function will throw an error at runtime.
*/
const assertNever = (x: never): never => {
  throw new Error(`Unexpected state: ${x}`);
}

/**
 * App component that allows the user to request an explanation of their code.
*/
export const App = (props: { getCode: () => string }) => {
  const [state, setState] = useState<state>({ tag: "inactive" });
  switch (state.tag) {
    case "inactive":
      return (
        <button
          className="bg-blue-500 hover:bg-blue-700 w-100 h-100 rounded"
          onClick={() => {
            setState({ tag: "active", code: props.getCode() });
          }}
        />
      );
    case "active":
      return (
        <div className="bg-gray-100 p-4 rounded">
          <pre className="whitespace-pre-wrap">{state.code}</pre>
          <button
            className="bg-red-500 hover:bg-red-700 rounded mt-2"
            onClick={() => {
              setState({ tag: "inactive" });
            }}
          >
            Close
          </button>
        </div>
      );
    default:
      assertNever(state);
  }
};

