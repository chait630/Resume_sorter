const OpenAI = require('openai');

let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Uses GPT-4 to extract structured data from raw resume text.
 * Falls back to a sophisticated rule-based extraction if API key is missing.
 */
async function extractStructuredData(rawText) {
  if (!openai) {
    console.warn('AI_SERVICE: OPENAI_API_KEY missing or invalid. Falling back to local heuristics.');
    return mockAIExtraction(rawText);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a specialized HR AI that extracts structured information from resume text. Return ONLY valid JSON."
        },
        {
          role: "user",
          content: `Extract the following fields from the resume text below: name, email, phone, skills (comma separated), state, district, education, and experience summary.\n\nText:\n${rawText.substring(0, 4000)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (err) {
    console.error('AI_SERVICE_ERROR:', err);
    return mockAIExtraction(rawText);
  }
}

/**
 * Heuristic fallback for when AI is unavailable.
 */
function mockAIExtraction(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const name = lines[0] || 'Unknown';
  
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
  
  // Basic skill detection (common ones)
  const commonSkills = ['React', 'Node', 'Python', 'Java', 'SQL', 'MongoDB', 'JavaScript', 'AWS', 'Docker'];
  const foundSkills = commonSkills.filter(s => new RegExp(s, 'i').test(text));

  return {
    name,
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0] : '',
    skills: foundSkills.join(', '),
    state: 'Unknown',
    district: 'Unknown'
  };
}

module.exports = { extractStructuredData };
