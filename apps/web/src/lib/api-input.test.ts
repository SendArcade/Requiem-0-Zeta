import { describe, expect, it, vi } from "vitest";
import { readJsonObject, validThreshold, withApiErrors } from "./api-input";

const request = (body: string) => new Request("https://site.example/api", { method: "POST", body });
describe("API input boundaries", () => {
  it.each(['{', 'null', '[]', '"text"'])('rejects invalid object body %s', async body => {
    const res = await withApiErrors(async (req: Request) => Response.json(await readJsonObject(req)))(request(body));
    expect(res.status).toBe(400);
  });
  it('rejects oversized streamed bodies', async () => {
    const res = await withApiErrors(async (req: Request) => Response.json(await readJsonObject(req)))(request(JSON.stringify({ text: 'x'.repeat(17000) })));
    expect(res.status).toBe(413);
  });
  it('accepts valid thresholds and rejects non-finite or wrong types', () => {
    for (const value of [1, 10, 100]) expect(validThreshold(value)).toBe(true);
    for (const value of [0, -1, 101, NaN, Infinity, "10", null]) expect(validThreshold(value)).toBe(false);
  });
  it('redacts unexpected failures', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const res = await withApiErrors(async () => { throw new Error('postgres://private-credential'); })();
      expect(res.status).toBe(503);
      expect(JSON.stringify(await res.json())).not.toContain('private-credential');
      expect(JSON.stringify(log.mock.calls)).not.toContain('private-credential');
    } finally { log.mockRestore(); }
  });
  it('rejects cross-origin writes before executing the mutation', async () => {
    const write = vi.fn(async (_req: Request) => Response.json({ ok: true }));
    const res = await withApiErrors(write)(new Request('https://site.example/api', { method: 'POST', headers: { origin: 'https://attacker.example' }, body: '{}' }));
    expect(res.status).toBe(403);
    expect(write).not.toHaveBeenCalled();
  });

});
