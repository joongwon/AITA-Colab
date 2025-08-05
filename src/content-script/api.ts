import { Cell } from "./cell";

/* -------- /analyses -------- */

export type AnalysisRequestBody = {
  code: Cell;
  context?: Cell[];
}

export type AnalysisResult = {
  explanation: string;
  details: string;
  followUps: string[];
}

/* --------- /chats ---------- */
export type ChatRequestBody = {
  prompt: string;
}

export type ChatResult = {
  explanation: string;
  followUps: string[];
}

/* ---------- error ---------- */
export type ApiError = {
  code: string;
  message: string;
}

// TODO: fix after hosting the server
const BASE_URL = "http://localhost:8080";

/**
 * Sends a POST request and processes the response.
 * @template Req, Res
 * @param {string} path
 * @param {Req} body
 * @returns {Promise<Res>}
 */
async function postJson<Req, Res>(
  path: string,
  body: Req
): Promise<Res> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // ok
  if (res.ok) return (await res.json()) as Res;

  // error
  let errBody: unknown = undefined;
  try {
    errBody = await res.json();
  } catch (_) {
    _
  }

  const apiErr: ApiError =
    typeof errBody === "object" && errBody !== null
      ? (errBody as ApiError)
      : { code: String(res.status), message: res.statusText };

  throw Object.assign(
    new Error(`[${apiErr.code}] ${apiErr.message}`),
    { status: res.status, ...apiErr }
  );
}

/**
 * Requests an analysis.
 * @param {AnalysisRequestBody} req
 * @returns {Promise<AnalysisResult>}
 * @example
 * const result = await analyse({ code: myCell, context: [prevCell] });
 */
export async function analyse(
  req: AnalysisRequestBody
): Promise<AnalysisResult> {
  // TODO: Uncomment this line after hosting the server
  // return postJson<AnalysisRequestBody, AnalysisResult>("/analyses", req);

  return {
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
 * Request a conversation with an LLM.
 * @param {ChatRequestBody} req
 * @returns {Promise<ChatResult>}
 * @example
 * const reply = await chat({ prompt: "Explain the error above." });
 */
export async function chat(req: ChatRequestBody): Promise<ChatResult> {
  // TODO: Uncomment this line after hosting the server
  // return postJson<ChatRequestBody, ChatResult>("/chats", req);

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
}
