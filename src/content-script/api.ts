import { Cell } from "./cell";

/* --------- /login ---------- */
export type LoginRequestBody = {};
export type LoginResult = { session_id: string };

/* -------- /analyses -------- */

export type AnalysisRequestBody = {
  session_id: string;
  cell_id: string;
  context: {
    cell_id: string;
    code: string;
  }[];
  code: string;
  output: {
    output_type: string;
    text: string[];
  };
};

export type AnalysisResult = {
  chat_id: string;
  explanation: string;
  details?: string;
  followUps: string[];
};

/* --------- /chats ---------- */
export type ChatRequestBody = {
  chat_id: string;
  prompt: string;
};

export type ChatResult = {
  explanation: string;
  followUps: string[];
};

/* ---------- error ---------- */
export type ApiError = {
  code: string;
  message: string;
};

// TODO: fix after hosting the server
const BASE_URL = "https://aita.fly.dev";

/**
 * Sends a POST request and processes the response.
 * @template Req, Res
 * @param {string} path
 * @param {Req} body
 * @returns {Promise<Res>}
 */
async function postJson<Req, Res>(path: string, body: Req): Promise<Res> {
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
    _;
  }

  const apiErr: ApiError =
    typeof errBody === "object" && errBody !== null
      ? (errBody as ApiError)
      : { code: String(res.status), message: res.statusText };

  throw Object.assign(new Error(`[${apiErr.code}] ${apiErr.message}`), {
    status: res.status,
    ...apiErr,
  });
}

/**
 * Requests an analysis.
 * @param {AnalysisRequestBody} req
 * @returns {Promise<AnalysisResult>}
 * @example
 * const result = await analyse({ code: myCell, context: [prevCell] });
 */
export async function analyse(
  req: AnalysisRequestBody,
): Promise<AnalysisResult> {
  return postJson<AnalysisRequestBody, AnalysisResult>("/analysis", req);
}

/**
 * Request a conversation with an LLM.
 * @param {ChatRequestBody} req
 * @returns {Promise<ChatResult>}
 * @example
 * const reply = await chat({ prompt: "Explain the error above." });
 */
export async function chat(req: ChatRequestBody): Promise<ChatResult> {
  return postJson<ChatRequestBody, ChatResult>("/chat", req);
}

/**
 * Requests a login to get a session ID.
 * @returns {Promise<LoginResult>}
 * @example
 * const { session_id } = await login();
 */
export async function login(req: LoginRequestBody): Promise<LoginResult> {
  return postJson<LoginRequestBody, LoginResult>("/login", req);
}
