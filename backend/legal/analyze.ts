import { api } from "encore.dev/api";
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
    const sections = splitIntoSections(req.text);
    
    const simplifiedSections: SimplifiedSection[] = [];
    const confusingClauses: ConfusingClause[] = [];
    const suggestedQuestions: SuggestedQuestion[] = [];

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      // Get simplified explanation for this section
      const simplified = await simplifySection(section, i);
      simplifiedSections.push(simplified);

      // Analyze for confusing clauses
      const clauses = await analyzeConfusingClauses(section, i);
      confusingClauses.push(...clauses);

      // Generate questions for this section
      const questions = await generateQuestions(section, i);
      suggestedQuestions.push(...questions);
    }

    return {
      simplifiedSections,
      confusingClauses,
      suggestedQuestions
    };
  }
);

function splitIntoSections(text: string): string[] {
  // Split by double line breaks or numbered sections
  const sections = text.split(/\n\s*\n|\d+\.\s+/).filter(s => s.trim().length > 50);
  return sections.length > 0 ? sections : [text];
}

async function simplifySection(sectionText: string, index: number): Promise<SimplifiedSection> {
  const response = await callOpenRouter([
    {
      role: "system",
      content: `You are a legal language simplifier. Translate legal clauses into plain, friendly English without losing meaning or nuance. Be clear, helpful, and neutral.`
    },
    {
      role: "user",
      content: `Simplify this legal text into plain English that anyone can understand:\n\n${sectionText}`
    }
  ]);

  return {
    originalText: sectionText,
    simplifiedText: response,
    sectionIndex: index
  };
}

async function analyzeConfusingClauses(sectionText: string, index: number): Promise<ConfusingClause[]> {
  const response = await callOpenRouter([
    {
      role: "system",
      content: `You are a legal clause analyzer. Identify clauses that may confuse non-lawyers. Look for vague, overly broad, or risky language. Return your analysis as JSON with this structure:
      [{"clause": "exact text", "whyConfusing": "explanation", "suggestedRewrite": "optional better version", "riskLevel": "low|medium|high"}]`
    },
    {
      role: "user",
      content: `Analyze this legal text for confusing or problematic clauses:\n\n${sectionText}`
    }
  ]);

  try {
    const parsed = JSON.parse(response);
    return Array.isArray(parsed) ? parsed.map(clause => ({
      ...clause,
      sectionIndex: index
    })) : [];
  } catch {
    return [];
  }
}

async function generateQuestions(sectionText: string, index: number): Promise<SuggestedQuestion[]> {
  const response = await callOpenRouter([
    {
      role: "system",
      content: `You are a legal question generator. Based on legal text, suggest practical questions a non-lawyer should ask their attorney. Return as JSON:
      [{"question": "What should I ask?", "context": "section topic", "relatedClause": "relevant clause text"}]`
    },
    {
      role: "user",
      content: `Generate 2-3 practical questions someone should ask a lawyer about this text:\n\n${sectionText}`
    }
  ]);

  try {
    const parsed = JSON.parse(response);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function callOpenRouter(messages: Array<{role: string; content: string}>): Promise<string> {
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
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}
