import "server-only";
import sharp from "sharp";
export const runtime = "nodejs";
const cache = new Map<
  string,
  { bytes: Uint8Array<ArrayBuffer>; expires: number }
>();
const pending = new Map<string, Promise<Uint8Array<ArrayBuffer>>>();
const allowed =
  /^https:\/\/render\.worldofwarcraft\.com\/(?:us|eu|kr|tw)\/character\/[a-z0-9]+(?:-[a-z0-9]+)*\/\d{1,3}\/\d+-main-raw\.png$/;
export async function GET(request: Request) {
  const url = new URL(request.url),
    values = url.searchParams.getAll("src"),
    src = values[0];
  if (values.length !== 1 || !allowed.test(src || ""))
    return Response.json({ error: "invalid_character_image" }, { status: 400 });
  try {
    const stored = cache.get(src);
    let bytes = stored && stored.expires > Date.now() ? stored.bytes : null;
    if (!bytes) {
      if (!pending.has(src))
        pending.set(
          src,
          (async () => {
            const response = await fetch(src, {
              signal: AbortSignal.timeout(10000),
              redirect: "error",
            });
            if (!response.ok || !response.body)
              throw Error("image_unavailable");
            const chunks: Uint8Array[] = [];
            let size = 0;
            for await (const chunk of response.body) {
              size += chunk.byteLength;
              if (size > 8 * 1024 * 1024) throw Error("image_too_large");
              chunks.push(chunk);
            }
            const input = Buffer.concat(chunks);
            const output = await sharp(input, { limitInputPixels: 8000000 })
              .trim({ threshold: 0, margin: 24 })
              .resize({
                width: 700,
                height: 800,
                fit: "inside",
                withoutEnlargement: true,
              })
              .png()
              .toBuffer();
            if (cache.size >= 16) cache.delete(cache.keys().next().value!);
            const value = new Uint8Array(output);
            cache.set(src, { bytes: value, expires: Date.now() + 300000 });
            return value;
          })().finally(() => pending.delete(src)),
        );
      bytes = await pending.get(src)!;
    }
    return new Response(bytes, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "image_unavailable" }, { status: 502 });
  }
}
