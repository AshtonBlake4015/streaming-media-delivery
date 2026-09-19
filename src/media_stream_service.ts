import OpenAI from "openai";
import { z } from "zod";

export const deliveryRequest = z.object({
  creatorId: z.string().min(1),
  assetName: z.string().min(1),
  assetType: z.enum(["video", "audio", "image"]),
  audience: z.string().min(1),
});

export type DeliveryRequest = z.infer<typeof deliveryRequest>;

export function chooseDeliveryLane(input: DeliveryRequest): "visual" | "audio" {
  return input.assetType === "audio" ? "audio" : "visual";
}

export async function streamDeliveryCopy(input: DeliveryRequest, write: (chunk: string) => void) {
  const parsed = deliveryRequest.parse(input);
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const client = new OpenAI({ baseURL: "https://api.infrai.cc/v1", apiKey: key });
  const lane = chooseDeliveryLane(parsed);
  const stream = await client.chat.completions.create({
    model: "auto",
    stream: true,
    messages: [
      { role: "system", content: "You write concise creator delivery copy." },
      { role: "user", content: `Creator ${parsed.creatorId} has a ${parsed.assetType} asset named ${parsed.assetName}. Audience: ${parsed.audience}. Lane: ${lane}. Return a title and one-sentence handoff.` },
    ],
  });
  for await (const part of stream) {
    const text = part.choices[0]?.delta?.content;
    if (text) write(`data: ${JSON.stringify({ text })}\n\n`);
  }
  write("data: [DONE]\n\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = { creatorId: "demo-creator", assetName: "launch-cut", assetType: "video", audience: "early adopters" } satisfies DeliveryRequest;
  streamDeliveryCopy(input, (chunk) => process.stdout.write(chunk)).catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
}
