import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

if (!apiKey) {
    console.warn("VITE_GOOGLE_API_KEY is not set in environment variables.");
}

let genAI: GoogleGenAI | null = null;

export const getGeminiClient = () => {
    if (!genAI && apiKey) {
        try {
            genAI = new GoogleGenAI({ apiKey });
        } catch (error) {
            console.error("Failed to initialize Gemini client:", error);
        }
    }
    return genAI;
};

export const generateContent = async (prompt: string | any[], modelName: string = "gemini-3-flash-preview") => {
    const client = getGeminiClient();
    if (!client) {
        throw new Error("Gemini client not initialized. Check API key.");
    }

    try {
        // In the new SDK, we use client.models.generateContent
        const response = await client.models.generateContent({
            model: modelName,
            contents: Array.isArray(prompt) ? prompt : [{ role: 'user', parts: [{ text: prompt }] }]
        });

        // The response structure might be different, let's extract text
        return (response as any).text;
    } catch (error) {
        console.error("Error generating content:", error);
        throw error;
    }
};



export interface EvaluationResult {
    verdict: "PASS" | "FAIL";
    deposit_type?: "credibility" | "reliability" | "intimacy" | "low_self_orientation" | "";
    // MIT specific fields
    mit_criteria?: {
        big_impact: boolean;
        in_control: boolean;
        growth_oriented: boolean;
    };
    reason: string;
    improvement_hint: string;
    rewrite_if_fail?: string; // Captured from mit prompt
}

export const evaluateNextStep = async (
    relationshipLevel: string,
    protemoiType: string,
    nextStep: string
): Promise<EvaluationResult> => {
    const prompt = `
You are evaluating a proposed NEXT STEP to advance a professional relationship (Protemoi). Return PASS if it is a meaningful trust deposit; otherwise FAIL.

PASS criteria (must all be true):
1) Value-to-them: framed around a benefit to them (insight, help, connection, problem-solving, support)
2) Specific + calendar-able: a concrete action/interaction doable in 15–45 minutes or a scheduled meeting
3) Time-bound: includes a date/timeframe
4) Appropriate ask size for current level: not a big ask too early (Target/Acquaintance should be low-friction)
5) Continuity: it naturally sets up the next interaction or feedback loop

If PASS, label the trust deposit type as ONE of:
- "credibility" (expertise/insight/professional value)
- "reliability" (follow-through, consistency, doing what you said)
- "intimacy" (rapport, safety, personal connection, listening)
- "low_self_orientation" (clearly about them; giving without asking)

Input:
- Relationship level: ${relationshipLevel}
- Protemoi type: ${protemoiType}
- Proposed next step (verbatim): ${nextStep}

Return valid JSON only:
{
  "verdict": "PASS" or "FAIL",
  "deposit_type": "credibility" or "reliability" or "intimacy" or "low_self_orientation" or "",
  "reason": "one short sentence",
  "improvement_hint": "one short rewrite suggestion if FAIL, otherwise empty string"
}

Rules:
- If any PASS criterion is missing, verdict must be FAIL and deposit_type must be empty.
- Do not invent personal details. Keep outputs short.
- If the step is generic (“check in”, “catch up sometime”), it must be FAIL.
`;

    try {
        const resultText = await generateContent(prompt);
        // Clean up markdown code blocks if present
        const jsonString = resultText.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(jsonString) as EvaluationResult;
    } catch (error) {
        console.error("Evaluation failed:", error);
        throw error;
    }
};

export const evaluateOpportunityNextStep = async (
    stage: string,
    buyer: string,
    nextStep: string
): Promise<EvaluationResult> => {
    const prompt = `
You are evaluating a proposed NEXT STEP for a consulting opportunity. Your job is to return PASS if it is sufficient to advance the opportunity, otherwise FAIL.

A next step is PASS only if it is:
1) Stage-moving: clearly aims to earn the next commitment for the current stage
2) Specific: starts with a verb and describes a concrete action (not “follow up”, “touch base”, “share deck”)
3) Owned: who does what (at least me; ideally includes the counterpart)
4) Time-bound: includes a date or timeframe (e.g., “by Fri”, “this week”)
5) Calendar-able: doable in one focused block OR it schedules the meeting that will do it
6) Outcome-clear: states what “done” means (meeting booked, doc sent + response requested, decision meeting scheduled, etc.)

Input:
- Stage: ${stage}
- Buyer/sponsor: ${buyer}
- Proposed next step (verbatim): ${nextStep}

Return valid JSON only:
{
  "verdict": "PASS" or "FAIL",
  "reason": "one short sentence explaining the main reason",
  "improvement_hint": "one short rewrite suggestion if FAIL, otherwise empty string"
}

Rules:
- If any of the 6 criteria are missing, verdict must be FAIL.
- Do not invent facts. If needed info is missing, FAIL and state what is missing in reason.
- Keep outputs short.
`;

    try {
        const resultText = await generateContent(prompt);
        const jsonString = resultText.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(jsonString) as EvaluationResult;
    } catch (error) {
        console.error("Opportunity Evaluation failed:", error);
        throw error;
    }
};

export const evaluateMIT = async (
    mitText: string,
): Promise<EvaluationResult> => {
    const prompt = `
You are evaluating whether a proposed task qualifies as a GrowBIG Most Important Thing (MIT).

An MIT must meet ALL 3 criteria that spell BIG:
1) Big Impact: a game changer, not an easy/admin task. A little fear is a good sign.
2) In your control: written so success is 100% under my control (e.g., "ask Sue to lunch", not "have lunch with Sue").
3) Growth oriented: directly builds growth/BD momentum, not delivery execution or generic operational work.

Input:
- Proposed MIT (verbatim): ${mitText}

Return valid JSON only:
{
  "verdict": "PASS" or "FAIL",
  "big_impact": true/false,
  "in_your_control": true/false,
  "growth_oriented": true/false,
  "reason": "one short sentence explaining the main issue",
  "rewrite_if_fail": "if FAIL, rewrite into a PASS MIT in one line; otherwise empty string"
}

Rules:
- If any of the three BIG criteria are false, verdict must be FAIL.
- Be strict: vague items (e.g., "work on X", "follow up", "touch base") are FAIL.
- If it depends on another person saying yes/attending, rewrite it into an action I control (ask, send, propose times, draft, prepare).
- Keep output short and do not invent context.
`;

    try {
        const resultText = await generateContent(prompt);
        const jsonString = resultText.replace(/```json\n?|\n?```/g, "").trim();
        const rawResult = JSON.parse(jsonString);

        return {
            verdict: rawResult.verdict,
            reason: rawResult.reason,
            improvement_hint: rawResult.rewrite_if_fail,
            mit_criteria: {
                big_impact: rawResult.big_impact,
                in_control: rawResult.in_your_control,
                growth_oriented: rawResult.growth_oriented
            }
        } as EvaluationResult;
    } catch (error) {
        console.error("MIT Evaluation failed:", error);
        throw error;
    }
};
