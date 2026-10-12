import "server-only";
import {
  createHandler,
  type ProxyQuery,
  type ProxyResponse,
} from "@/server/blizzard.cjs";
export const runtime = "nodejs";
export const maxDuration = 60;
const handler = createHandler();
export async function GET(request: Request) {
  const url = new URL(request.url),
    query: ProxyQuery = {};
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    query[key] = values.length === 1 ? values[0] : values;
  }
  const headers = new Headers();
  let status = 200,
    body: unknown;
  const adapter: ProxyResponse = {
    setHeader(key, value) {
      headers.set(key, value);
    },
    status(code) {
      status = code;
      return this;
    },
    json(value) {
      body = value;
      return this;
    },
  };
  await handler({ method: "GET", query }, adapter);
  return Response.json(body, { status, headers });
}
