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
  }).catch((err) => {
    console.error("Network error:", err);
    throw new Error("Network error");
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

async function* fetchNDJSONStream<Req, Res>(path: string, body: Req) : AsyncGenerator<Res> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((err) => {
    console.error("Network error:", err);
    throw new Error("Network error");
  });

  if (!res.body) throw new Error("No body in response");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    let lines = buffer.split("\n");
    buffer = lines.pop()!; // save last partial line

    for (const line of lines) {
      if (line.trim() !== "") {
        yield JSON.parse(line);
      }
    }
  }

  // Flush last line if any
  if (buffer.trim() !== "") {
    yield JSON.parse(buffer);
  }
}

async function* collectJSONStream<Res>(stream: AsyncGenerator<Partial<Res>>) : AsyncGenerator<Partial<Res>> {
  let result: Partial<Res> = {};
  for await (const chunk of stream) {
    result = { ...result, ...chunk };
    yield result;
  }
}

/**
 * Requests an analysis.
 * @param {AnalysisRequestBody} req
 * @returns {Promise<AnalysisResult>}
 * @example
 * const result = await analyse({ code: myCell, context: [prevCell] });
 */
export function analyse(
  req: AnalysisRequestBody,
): AsyncGenerator<Partial<AnalysisResult>> {
  const stream = fetchNDJSONStream<AnalysisRequestBody, Partial<AnalysisResult>>("/analysis", req);
  return collectJSONStream<AnalysisResult>(stream);
}

/**
 * Request a conversation with an LLM.
 * @param {ChatRequestBody} req
 * @returns {Promise<ChatResult>}
 * @example
 * const reply = await chat({ prompt: "Explain the error above." });
 */
export function chat(req: ChatRequestBody): AsyncGenerator<Partial<ChatResult>> {
  const stream = fetchNDJSONStream<ChatRequestBody, Partial<ChatResult>>("/chat", req);
  return collectJSONStream<ChatResult>(stream);
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
