export type ProxyQuery = Record<string, string | string[]>;
export interface ProxyResponse {
  setHeader(key: string, value: string): void;
  status(code: number): ProxyResponse;
  json(value: unknown): ProxyResponse;
}
export function createHandler(options?: {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
}): (
  request: { method: string; query: ProxyQuery },
  response: ProxyResponse,
) => Promise<unknown>;
