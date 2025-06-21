import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";

const openRouterKey = secret("OpenRouterKey");

export interface AnalyzeDocumentRequest {
  text: string;
}

export interface SimplifiedSection {
  originalText: string;
  simplifiedText: string;
  sectionIndex: number;
}

export interface ConfusingClause {
  clause: string;
  whyConfusing: string;
  suggestedRewrite?: string;
  riskLevel: "low" | "medium" | "high";
  sectionIndex: number;
}

export interface SuggestedQuestion {
  question: string;
  context: string;
  relatedClause: string;
}

export interface AnalyzeDocumentResponse {
  simplifiedSections: SimplifiedSection[];
  confusingClauses: ConfusingClause[];
  suggestedQuestions: SuggestedQuestion[];
}

// Analyzes a legal document and returns simplified explanations, confusing clauses, and suggested questions.
export const analyze = api<AnalyzeDocumentRequest, AnalyzeDocumentResponse>(
  { expose: true, method: "POST", path: "/legal/analyze" },
  async (req) => {
    if (!req.text || req.text.trim().length < 50) {
      throw APIError.invalidArgument("Document text must be at least 50 characters long");
    }

    const sections = splitIntoSections(req.text);
    
    const simplifiedSections: SimplifiedSection[] = [];
    const confusingClauses: ConfusingClause[] = [];
    const suggestedQuestions: SuggestedQuestion[] = [];

    // Process sections in parallel for better performance
    const promises = sections.map(async (section, index) => {
      try {
        const [simplified, clauses, questions] = await Promise.all([
          simplifySection(section, index),
          analyzeConfusingClauses(section, index),
          generateQuestions(section, index)
        ]);

        return { simplified, clauses, questions };
      } catch (error) {
        console.error(`Error processing section ${index}:`, error);
        // Return fallback data for this section
        return {
          simplified: {
            originalText: section,
            simplifiedText: "Unable to simplify this section due to processing error.",
            sectionIndex: index
          },
          clauses: [],
          questions: []
        };
      }
    });

    const results = await Promise.all(promises);

    results.forEach(result => {
      simplifiedSections.push(result.simplified);
      confusingClauses.push(...result.clauses);
      suggestedQuestions.push(...result.questions);
    });

    return {
      simplifiedSections,
      confusingClauses,
      suggestedQuestions
    };
  }
);

function splitIntoSections(text: string): string[] {
  // Split by double line breaks, numbered sections, or paragraph markers
  let sections = text.split(/\n\s*\n+|\d+\.\s+|§\s*\d+/).filter(s => s.trim().length > 30);
  
  // If no clear sections found, split by sentences for very long text
  if (sections.length === 1 && text.length > 2000) {
    const sentences = text.split(/\.\s+/).filter(s => s.trim().length > 30);
    const chunkSize = Math.ceil(sentences.length / 3);
    sections = [];
    for (let i = 0; i < sentences.length; i += chunkSize) {
      sections.push(sentences.slice(i, i + chunkSize).join('. ') + '.');
    }
  }
  
  return sections.length > 0 ? sections : [text];
}

async function simplifySection(sectionText: string, index: number): Promise<SimplifiedSection> {
  const systemPrompt = `You are a legal simplification assistant.
Your job is to:

1. Translate legal clauses into plain, human-understandable English
   - Do not lose meaning or nuance
   - Avoid complex vocabulary and legal terms

2. Identify clauses that may confuse or mislead non-lawyers
   - Look for vague or overly broad language
   - Highlight risks or uncommon implications

3. Generate follow-up questions a non-lawyer should ask
   - Use friendly but smart language
   - Do not offer legal advice or certainty
   - Keep questions practical and relevant to the clause

4. Always explain WHY a clause might be confusing
   - Describe what it does
   - Clarify how it could impact someone signing it

Tone: Clear, helpful, neutral. Avoid alarms. Don't sound like a lawyer — sound like a friend who understands contracts.`;

  const userPrompt = `Please simplify this legal text into plain English that anyone can understand. Keep the meaning intact but make it conversational and clear:

${sectionText}

Respond with ONLY the simplified explanation, no additional commentary.`;

  const response = await callOpenRouter([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ]);

  return {
    originalText: sectionText,
    simplifiedText: response || "Unable to simplify this section.",
    sectionIndex: index
  };
}

async function analyzeConfusingClauses(sectionText: string, index: number): Promise<ConfusingClause[]> {
  const systemPrompt = `You are a legal clause analyzer following these rules:

1. Translate legal clauses into plain, human-understandable English
2. Identify clauses that may confuse or mislead non-lawyers
3. Look for vague or overly broad language
4. Highlight risks or uncommon implications
5. Always explain WHY a clause might be confusing

Tone: Clear, helpful, neutral. Avoid alarms. Don't sound like a lawyer — sound like a friend who understands contracts.

You must respond with valid JSON only, using this exact structure:
[
  {
    "clause": "exact problematic text from the document",
    "whyConfusing": "clear explanation of why this is confusing or risky",
    "suggestedRewrite": "optional clearer version",
    "riskLevel": "low" | "medium" | "high"
  }
]

If no confusing clauses are found, return an empty array: []`;

  const userPrompt = `Analyze this legal text for confusing, vague, or potentially problematic clauses:

${sectionText}

Return only valid JSON with the structure specified in the system prompt.`;

  const response = await callOpenRouter([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ]);

  try {
    const parsed = JSON.parse(response);
    if (Array.isArray(parsed)) {
      return parsed.map(clause => ({
        ...clause,
        sectionIndex: index,
        riskLevel: clause.riskLevel || "medium"
      }));
    }
  } catch (error) {
    console.error("Failed to parse confusing clauses JSON:", error);
  }
  
  return [];
}

async function generateQuestions(sectionText: string, index: number): Promise<SuggestedQuestion[]> {
  const systemPrompt = `You are a legal question generator following these rules:

1. Generate follow-up questions a non-lawyer should ask their attorney
2. Use friendly but smart language
3. Do not offer legal advice or certainty
4. Keep questions practical and relevant to the clause
5. Focus on what the person signing should understand

Tone: Clear, helpful, neutral. Don't sound like a lawyer — sound like a friend who understands contracts.

You must respond with valid JSON only, using this exact structure:
[
  {
    "question": "What should I ask my lawyer?",
    "context": "brief topic/section description",
    "relatedClause": "relevant clause text (keep under 100 chars)"
  }
]

Generate 2-3 practical questions. If no questions are needed, return an empty array: []`;

  const userPrompt = `Based on this legal text, generate 2-3 practical questions someone should ask their lawyer:

${sectionText}

Return only valid JSON with the structure specified in the system prompt.`;

  const response = await callOpenRouter([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ]);

  try {
    const parsed = JSON.parse(response);
    if (Array.isArray(parsed)) {
      return parsed.map(q => ({
        question: q.question || "What does this mean for me?",
        context: q.context || "General",
        relatedClause: q.relatedClause ? q.relatedClause.substring(0, 100) : sectionText.substring(0, 100)
      }));
    }
  } catch (error) {
    console.error("Failed to parse questions JSON:", error);
  }
  
  return [];
}

async function callOpenRouter(messages: Array<{role: string; content: string}>): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://speaklegal.app",
        "X-Title": "Speak Legal App"
      },
      body: JSON.stringify({
        model: "qwen/qwen-2.5-72b-instruct",
        messages,
        temperature: 0.3,
        max_tokens: 2000,
        top_p: 0.9
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error: ${response.status} - ${errorText}`);
      throw APIError.internal(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid response structure from OpenRouter:", data);
      throw APIError.internal("Invalid response from AI service");
    }

    return data.choices[0].message.content || "";
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw APIError.deadlineExceeded("AI service request timed out");
    }
    
    console.error("OpenRouter API call failed:", error);
    throw APIError.internal("Failed to communicate with AI service");
  }
}
