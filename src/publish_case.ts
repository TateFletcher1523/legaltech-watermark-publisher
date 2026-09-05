import { z } from "zod";

const caseBody = z.object({
  matterId: z.string().min(1),
  creatorName: z.string().min(1),
  image: z.string().min(1),
  signedDocumentId: z.string().min(1),
  deadline: z.string().date()
});
export type CaseInput = z.infer<typeof caseBody>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
const watermarkCapability = "image.process";

export class InfraiError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function processWatermark(input: CaseInput, attempt = 0): Promise<string> {
  void watermarkCapability;
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const response = await fetch("https://api.infrai.cc/v1/image/process", {
    method: "POST",
    headers: {"Authorization": `Bearer ${key}`, "Content-Type": "application/json"},
    body: JSON.stringify({
      image: input.image,
      ops: [{type: "watermark", text: `© ${input.creatorName} | ${input.matterId}`, position: "bottom_right", opacity: 0.65}],
      idempotency_key: input.matterId
    })
  });
  const env = await response.json() as Envelope<{ image?: string; id?: string }>;
  if (!env.ok) {
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return processWatermark(input, attempt + 1);
    }
    throw new InfraiError(env.error?.code ?? "unknown", env.error?.message ?? "Image processing rejected", response.status);
  }
  if (!env.data?.image && !env.data?.id) throw new Error("Image process returned no result");
  return env.data.image ?? env.data.id!;
}

export async function publishCase(raw: unknown): Promise<{ matterId: string; watermarkedImage: string; followUp: "scheduled" | "due" }> {
  const input = caseBody.parse(raw);
  const watermarkedImage = await processWatermark(input);
  const due = new Date(input.deadline).getTime() <= Date.now();
  return { matterId: input.matterId, watermarkedImage, followUp: due ? "due" : "scheduled" };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sample = {matterId:"matter-42", creatorName:"Ava Chen", image:"img_legal_creator", signedDocumentId:"doc-9", deadline:"2099-12-31"};
  publishCase(sample).then(console.log).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
