import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  console.log("api hit");

  try {
    const { kpis } = await req.json();
    console.log("Received KPIs:", kpis);

    if (!kpis || typeof kpis !== "object") {
      return NextResponse.json({ error: "KPIs are required" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Groq API key not configured" },
        { status: 500 }
      );
    }

    const prompt = `
You are a healthcare revenue cycle analytics assistant.

You are given clinic metrics consisting of:
- Volume metrics that describe scale
- Normalized KPIs that describe efficiency or timing

For EACH metric, explain what the VALUE MEANS in practical terms.

Metrics (JSON):
\`\`\`json
${JSON.stringify(kpis, null, 2)}
\`\`\`

Instructions:
- Write EXACTLY one sentence per metric.
- Each sentence must:
  1. Reference the metric value
  2. Explain what that value indicates or implies
- Do NOT repeat the raw number without interpretation.
- Do NOT combine multiple metrics into one sentence.
- Do NOT use judgmental language.
- Focus on operational or financial meaning.

Metrics to interpret (use these exact keys):

Volume metrics:
- totalClaims
- totalBilled
- totalPaid

Normalized KPIs:
- collectionRate
- revenuePerClaim
- patientResponsibilityPct
- insuranceCollectionPct
- avgPaymentDays

Return STRICT JSON only in this format:
{
  "interpretation": {
    "totalClaims": "...",
    "totalBilled": "...",
    "totalPaid": "...",
    "collectionRate": "...",
    "revenuePerClaim": "...",
    "patientResponsibilityPct": "...",
    "insuranceCollectionPct": "...",
    "avgPaymentDays": "..."
  }
}
`.trim();

    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are a clear, concise healthcare revenue analytics assistant.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.6,
          max_tokens: 500,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Groq API error:", errText);
      return NextResponse.json({ error: "Groq API failed" }, { status: 500 });
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return NextResponse.json({ bullets: [] });
    }

    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error(e,"Invalid JSON from Groq:", cleaned);
      return NextResponse.json({ bullets: [] });
    }

    const interpretation = parsed?.interpretation ?? {};

    return NextResponse.json({
      bullets: Object.values(interpretation).filter(
        (v): v is string => typeof v === "string"
      ),
    });
  } catch (err) {
    console.error("Interpret KPI error:", err);
    return NextResponse.json(
      { error: "Failed to interpret KPIs" },
      { status: 500 }
    );
  }
}
