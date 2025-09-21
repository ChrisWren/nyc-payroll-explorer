import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const MAX_TOKENS = Number.parseInt(process.env.OPENAI_MAX_TOKENS ?? "400", 10);

const encoder = new TextEncoder();

function buildPrompt({
  title,
  agency,
  payMin,
  payMax,
  count,
}: {
  title: string;
  agency: string;
  payMin: number | null;
  payMax: number | null;
  count: number | null;
}) {
  const hasSalary = payMin !== null && payMax !== null;
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const salaryPortion = hasSalary
      ? `The typical salary range is ${formatter.format(Math.round(payMin ?? 0))} to ${formatter.format(Math.round(payMax ?? 0))}.`
      : "";

  const headcountPortion = count !== null ? ` About ${count} employees currently hold this role.` : "";
  const agencyPortion = agency ? `The role is part of the ${agency}.` : "This role is part of NYC government.";

  return `Write a concise, plain-English overview of the NYC civil service job title "${title}".
${agencyPortion}
${salaryPortion}${headcountPortion}
Focus on typical responsibilities, who the role serves, and any teamwork or public impact. Keep it factual and avoid speculation. Aim for 3 short paragraphs or fewer.`;
}

function parseMoney(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseCount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const { title, agency = "", payMin, payMax, count } = payload as Record<string, unknown>;

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Missing or invalid 'title'" }, { status: 400 });
  }

  const normalized = {
    title: title.trim(),
    agency: typeof agency === "string" ? agency.trim() : "",
    payMin: parseMoney(payMin),
    payMax: parseMoney(payMax),
    count: parseCount(count),
  };

  const prompt = buildPrompt(normalized);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      max_tokens: MAX_TOKENS,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are an assistant helping New Yorkers understand city government job titles. You summarize their responsibilities factually and concisely.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok || !response.body) {
    try {
      const errorBody = await response.json();
      return NextResponse.json({ error: errorBody?.error?.message ?? "Failed to contact OpenAI" }, { status: 502 });
    } catch {
      return NextResponse.json({ error: "Failed to contact OpenAI" }, { status: 502 });
    }
  }

  const openAiStream = response.body.getReader();
  const textDecoder = new TextDecoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let accumulated = "";

      try {
        while (true) {
          const { value, done } = await openAiStream.read();
          if (done) {
            break;
          }
          accumulated += textDecoder.decode(value, { stream: true });
          const lines = accumulated.split("\n");
          accumulated = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) {
              continue;
            }
            const data = trimmed.slice("data:".length).trim();
            if (!data || data === "[DONE]") {
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                controller.enqueue(encoder.encode(delta));
              }
            } catch {
              // ignore malformed SSE payloads
            }
          }
        }

        if (accumulated) {
          try {
            const parsed = JSON.parse(accumulated.replace(/^data:/, "").trim());
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) {
              controller.enqueue(encoder.encode(delta));
            }
          } catch {
            // ignore trailing fragment
          }
        }
      } catch (error) {
        controller.error(error);
        return;
      }

      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
