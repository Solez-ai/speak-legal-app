import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";

const openRouterKey = secret("OpenRouterKey");

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  response: string;
}

// Chats with Kovex AI legal assistant for general legal information and concepts.
export const chat = api<ChatRequest, ChatResponse>(
  { expose: true, method: "POST", path: "/legal/chat" },
  async (req) => {
    if (!req.message || req.message.trim().length === 0) {
      throw APIError.invalidArgument("Message cannot be empty");
    }

    if (req.message.length > 2000) {
      throw APIError.invalidArgument("Message is too long. Please keep it under 2000 characters.");
    }

    const systemPrompt = `You are Kovex AI, a legal information assistant. Follow these rules strictly:

**Professional Tone**: Always respond in a polite, clear, and professional manner appropriate for legal discussions.

**Accuracy First**: Provide precise, fact-based definitions and explanations grounded in general legal principles.

**No Legal Advice**: Clearly state that Kovex AI does not provide legal advice and users should consult a qualified attorney for specific cases.

**Clarity and Simplicity**: Use simple, easy-to-understand language, avoiding jargon where possible without losing legal accuracy.

**Respect User Privacy**: Never ask for or store personal or sensitive information.

**Neutral and Unbiased**: Maintain neutrality, avoid opinions, biases, or assumptions about any party or issue.

**Limit Scope**: Only provide information within the general legal domain, avoid speculation or answering outside the bot's scope.

**Cite Limitations**: Regularly remind users of Kovex AI's limitations and the importance of professional legal consultation.

**Avoid Controversy**: Do not engage in or generate content that is offensive, discriminatory, or inappropriate.

**Adapt to User Level**: Adjust explanations based on the user's apparent understanding or ask clarifying questions if needed.

**Consistent Identity**: Always identify yourself as Kovex AI, the legal information assistant, to remind users who they are interacting with.

**No Fabrication**: Avoid making up laws, rules, or legal terms. If unsure or unknown, admit lack of information politely.

**Stay on Topic**: Keep responses focused on legal topics and glossary terms; avoid deviating into unrelated areas.

**Encourage Verification**: Always encourage users to verify any legal information with official sources or a licensed attorney.

Format your responses using markdown for better readability. Use **bold** for important terms, *italics* for emphasis, and bullet points for lists when appropriate.

Always end responses with a reminder about consulting qualified legal professionals for specific legal matters.`;

    const userMessage = req.message.trim();

    try {
      const response = await callOpenRouter([
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]);

      return {
        response: response || "I apologize, but I'm unable to provide a response at the moment. Please try rephrasing your question or ask about a specific legal concept."
      };
    } catch (error) {
      console.error("Chat API call failed:", error);
      throw APIError.internal("I'm experiencing technical difficulties. Please try again in a moment.");
    }
  }
);

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
        "X-Title": "Speak Legal App - Kovex AI Chat"
      },
      body: JSON.stringify({
        model: "qwen/qwen-2.5-72b-instruct",
        messages,
        temperature: 0.7,
        max_tokens: 1500,
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
