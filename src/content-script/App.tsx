import Markdown from "markdown-to-jsx";
import "../base.css";
import { useState } from 'react';

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
async function initiateChat(code: string): Promise<ChatResponse> {
  void code;
  return {
    contextId: "example-context-id",
    explanation :
      ("**원인:**\n" +
       "`append` 메서드 때문에 의도치 않은 값이 출력되었어요! `append` 메서드는 제자리에서 리스트를 변경하고, 아무 값도 반환하지 않아요.\n\n" +
       "**사례:**\n" +
       "다음 코드에서도 비슷한 오류를 찾아볼 수 있어요.\n" +
       "```python\n" +
       "nums = [3, 1, 2]\n" +
       "print(nums.append(4))\n" +
       "```\n"),
    details :
      ("**분석기 메시지:**\n" +
       "```\n" +
       "Warning: The 'append' method always returns 'None'.\n" +
       "```\n" +
       "**설명:**\n" +
       "이 메시지는 `append` 메서드가 항상 `None`을 반환한다는 것을 알려줘요. " +
       "이 메서드는 리스트에 요소를 추가할 때 사용되지만, 반환값은 없어요. " +
       "따라서 `print` 함수로 출력하면 `None`이 나타나게 돼요."),
    followUps: [
      "리스트 메서드에 대해 더 알려주세요!",
      "해결하는 방법을 알려주세요!",
    ]
  };
}

/**
 * Continue the chat with the AI to ask for more details or follow-up questions.
 * @param contextId The ID of the context in which the code was analyzed.
 * @param question The follow-up question to ask.
 * @returns A promise that resolves to a ChatResponse containing the follow-up response.
 */
async function continueChat(contextId: string, question: string): Promise<ChatResponse> {
  if (question === "리스트 메서드에 대해 더 알려주세요!") {
    return {
      explanation:
        ("**6주차 강의 슬라이드 25쪽 [리스트의 원소 값을 자유롭게 조작해보자]**\n\n" +
         "이 슬라이드에서는 리스트의 다양한 메서드를 소개하고 있어요.\n\n" +
         "- `append(x)` : 리스트의 끝에 `x`를 추가한다.\n" +
         "- `count(x)` : 리스트에서 `x`의 개수를 반환한다.\n" +
         "- `insert(i, x)` : 리스트의 `i`번째 위치에 `x`를 삽입한다.\n" +
         "- `sort()` : 리스트를 오름차순으로 정렬한다.\n"),
      followUps: ["모두 해결했어요!"],
    };
  } else if (question === "해결하는 방법을 알려주세요!") {
    return {
      explanation:
        ("**해결 방법:**\n" +
         "리스트의 `append` 메서드를 사용할 때는 반환값을 출력하지 않도록 주의해야 해요. " +
         "대신, 리스트에 요소를 추가한 후 리스트 자체를 출력하면 됩니다.\n\n" +
         "**예시 코드:**\n" +
         "```python\n" +
         "t = [42, 43]\n" +
         "t.append(44)\n" +
         "print(t)\n" +
         "```\n"),
      followUps: [],
    };
  } else {
    return {
      explanation: "죄송해요, 그 질문에 대한 답변을 찾을 수 없어요.",
      followUps: [],
    };
  }
}


/**
 * App component that allows the user to request an explanation of their code.
*/
export const App = (props: { getCode: () => string }) => {
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<ChatResponse[]>([]);
  const [contextId, setContextId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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
      if (messages.length === 0) {
        // This is first time opening the chat, so we need to initiate it
        if (!isLoading) {
          // If we are already loading, do not initiate again
          setIsLoading(true);
          initiateChat(props.getCode())
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
            .finally(() => setIsLoading(false));
        }
      }
    }
  }

  const handleFollowUp = isLoading ? null : ((question: string) => {
    if (!contextId) {
      // This function should not be called if there is no context ID
      throw new Error("No context ID available for follow-up question");
    }
    setIsLoading(true);
    setPage(messages.length); // Go to the newly added message
    continueChat(contextId, question)
      .then((response) => {
        setMessages((prevMessages) => [...prevMessages, response]);
      })
      .catch((error) => {
        console.error("Error continuing chat:", error);
        // TODO
      })
      .finally(() => setIsLoading(false));
  });

  const gotoNextPage = page >= maxPage ? null : (() => {
    setPage((prev) => prev + 1);
  });

  const gotoPrevPage = page <= 0 ? null : (() => {
    setPage((prev) => prev - 1);
  });

  return (
    <>
      <div className={`transition-all bg-gray-100 rounded-lg shadow-lg ${
        isActive ? "p-4 w-75 max-h-96 overflow-y-auto" : "w-0 max-h-0 overflow-hidden"}`}>
        {isActive && (
          page < messages.length ? (
            <>
              <Markdown>{messages[page].explanation}</Markdown>
              {messages[page].details && (
                <details>
                  <summary>설명 펼치기</summary>
                  <Markdown>{messages[page].details}</Markdown>
                </details>
              )}
              {messages[page].followUps.map( (question, index) => (
                <button
                  key={index}
                  className="bg-red-100 hover:bg-red-200 font-bold py-2 px-4 rounded-full w-full my-1"
                  disabled={handleFollowUp === null}
                  onClick={() => handleFollowUp?.(question)}
                >
                  {question}
                </button>
              ))}
            </>
          ) : (
            <>loading...</>
          )
        )}
      </div>
      {isActive && (
        <div className="absolute w-fit bottom-0 left-0 right-0 m-auto translate-y-[100%]">
        <button
          className="cursor-pointer disabled:cursor-auto disabled:text-gray-300"
          disabled={gotoPrevPage === null}
          onClick={() => gotoPrevPage?.()}
        >
          {"<"}
        </button>
        <span className="mx-2">
          {page + 1}/{maxPage + 1}쪽
        </span>
        <button
          className="cursor-pointer disabled:cursor-auto disabled:text-gray-300"
          disabled={gotoNextPage === null}
          onClick={() => gotoNextPage?.()}
        >
          {">"}
        </button>
      </div>
      )}
      <button
        className={`transition-all absolute top-0 right-0 translate-x-[50%] translate-y-[-50%] bg-purple-500 hover:bg-purple-700 rounded-full ${
          isActive ? "w-4 h-4" : "w-8 h-8"}`}
        onClick={() => toggleActive()}
      />
    </>
  );
};

