import Markdown from "markdown-to-jsx";
import "../base.css";
import { useEffect, useState } from "react";
import { analyse, chat } from "./api";
import { CodeCell } from "./cell";
import { getExecutedCodes } from "./executedCodes";

type ChatResponse = {
  // The ID of the context in which the code was analyzed.
  contextId?: string;

  // A brief explanation of the code.
  explanation: string;
  // A detailed explanation of the linter message.
  details?: string;
  // A list of follow-up questions or recommendations.
  followUps: string[];
};

/**
 * Initiates a chat with the AI to analyze the provided code.
 * @param code The code to be analyzed.
 * @returns A promise that resolves to a ChatResponse containing the analysis.
 */
async function initiateChat(code: CodeCell): Promise<ChatResponse> {
  const allCodes = getExecutedCodes();
  const thisCount = code.execution_count;
  const context = thisCount === null ?
    allCodes :
    allCodes.filter(c => c.execution_count < thisCount);
  return analyse({ code, context });
}

/**
 * Continue the chat with the AI to ask for more details or follow-up questions.
 * @param contextId The ID of the context in which the code was analyzed.
 * @param prompt The follow-up question to ask.
 * @returns A promise that resolves to a ChatResponse containing the follow-up response.
 */
async function continueChat(
  prompt: string,
): Promise<ChatResponse> {
  return chat({ prompt });
}

/**
 * App component that allows the user to request an explanation of their code.
 */
export const App = (props: {
  parentElement: HTMLElement;
  getCell: () => CodeCell;
}) => {
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<ChatResponse[]>([]);
  const [contextId, setContextId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    // Close the chat when the user clicks outside of it
    const handleClickOutside = (event: Event) => {
      if (!props.parentElement.contains(event.target as Node) && isActive) {
        setIsActive(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isActive]);

  useEffect(() => {
    // z-index: 22 to ensure it appears above colab toolbar
    if (isActive) {
      props.parentElement.classList.add("z-22");
      return () => {
        props.parentElement.classList.remove("z-22");
      };
    }
  }, [isActive]);

  /*
   * page: zero-based index of the current message being displayed
   *   if 0 <= page < messages.length, then messages[page] is the current message being displayed
   *   if page === messages.length, then we are loading the next message
   */
  const maxPage = isLoading ? messages.length : messages.length - 1;

  const toggleActive = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      setIsActive(true);
      // If this is first time opening the chat, so we need to initiate it
      // If we are already loading, do not initiate again
      if (messages.length === 0 && !isLoading) {
        setIsLoading(true);
        initiateChat(props.getCell())
          .then((response) => {
            if (!response.contextId) {
              // Context ID is always returned, so this should not happen
              throw new Error("No context ID returned from initiateChat");
            }
            setMessages([response]);
            setContextId(response.contextId);
          })
          .catch((error) => {
            console.error("Error initiating chat:", error);
            // TODO
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  };

  // Event handlers are set to null when it's not available

  const handleFollowUp = isLoading
    ? null
    : (question: string) => {
        if (!contextId) {
          // This function should not be called if there is no context ID
          throw new Error("No context ID available for follow-up question");
        }
        setIsLoading(true);
        setPage(messages.length); // Go to the newly added message
        continueChat(question)
          .then((response) => {
            setMessages((prevMessages) => [...prevMessages, response]);
          })
          .catch((error) => {
            console.error("Error continuing chat:", error);
            // TODO
          })
          .finally(() => setIsLoading(false));
      };

  const gotoNextPage =
    page >= maxPage
      ? null
      : () => {
          setPage((prev) => prev + 1);
        };

  const gotoPrevPage =
    page <= 0
      ? null
      : () => {
          setPage((prev) => prev - 1);
        };

  return (
    <>
      <div
        className={`transition-all bg-white rounded-lg shadow-lg p-4 w-75 ${
          isActive
            ? "scale-100 translate-0 opacity-100"
            : "scale-90 translate-x-1/20 -translate-y-1/20 opacity-0"
        }`}
      >
        <div className="justify-center flex mb-2">
          <button
            className="cursor-pointer disabled:cursor-auto disabled:text-gray-300 border-none bg-transparent"
            disabled={gotoPrevPage === null}
            onClick={() => gotoPrevPage?.()}
          >
            {"<"}
          </button>
          <span className="mx-2">
            {page + 1}/{maxPage + 1}쪽
          </span>
          <button
            className="cursor-pointer disabled:cursor-auto disabled:text-gray-300 border-none bg-transparent"
            disabled={gotoNextPage === null}
            onClick={() => gotoNextPage?.()}
          >
            {">"}
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto overflow-x-hidden">
          {page < messages.length ? (
            <>
              <Markdown>{messages[page].explanation}</Markdown>
              {messages[page].details && (
                <details>
                  <summary>설명 펼치기</summary>
                  <Markdown>{messages[page].details}</Markdown>
                </details>
              )}
              {messages[page].followUps.map((question, index) => (
                <button
                  key={index}
                  className="bg-red-100 hover:bg-red-200 font-bold py-2 px-4 rounded-full w-full my-1 border-none"
                  disabled={handleFollowUp === null}
                  onClick={() => handleFollowUp?.(question)}
                >
                  {question}
                </button>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (handleFollowUp) {
                    handleFollowUp(question);
                    setQuestion(""); // Clear the input after submitting
                  }
                }}
              >
                <input
                  type="text"
                  placeholder="질문을 입력하세요..."
                  className="chat-input"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </form>
            </>
          ) : (
            <>loading...</>
          )}
        </div>
      </div>
      <button
        className={`transition-all absolute top-0 right-0 translate-x-[50%] translate-y-[-50%] bg-purple-500 hover:bg-purple-700 rounded-full border-none ${
          isActive ? "w-4 h-4" : "w-8 h-8"
        }`}
        onClick={() => toggleActive()}
      />
    </>
  );
};
