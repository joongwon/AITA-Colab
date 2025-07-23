export type MetaData = {
  colab?: { base_uri: string }; 
  id: string;
  outputId?: string;
}

export type Output = {
  name: string;        // e.g. "stdout"
  output_type: string; // e.g. "stream"
  text: string[];      // e.g. "Hello, world!"
}

// A Jupyter Notebook cell
export type Cell =
  | {
      cell_type: 'code';
      execution_count?: number;
      metadata: MetaData;
      outputs: Output[];
      source: string[];
    }
  | {
      cell_type: 'markdown';
      metadata: MetaData;
      source: string[];
    }

/* -------- /analyses -------- */

export type AnalysisRequestBody = {
  code: Cell;
  context?: Cell[];
}

export type AnalysisResult = {
  text: string;
}

/* --------- /chats ---------- */
export type ChatRequestBody = {
  prompt: string;
}

export type ChatResult = {
  answer: string;
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
  return postJson<AnalysisRequestBody, AnalysisResult>("/analyses", req);
}

/**
 * Request a conversation with an LLM.
 * @param {ChatRequestBody} req
 * @returns {Promise<ChatResult>}
 * @example
 * const reply = await chat({ prompt: "Explain the error above." });
 */
export async function chat(req: ChatRequestBody): Promise<ChatResult> {
  return postJson<ChatRequestBody, ChatResult>("/chats", req);
}
