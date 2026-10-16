import Groq from 'groq-sdk';

export interface ScoringResult {
  score: number;
  categorie: string;
}

function buildPrompt(title: string, description: string, profileStack: string[], profilePriorities: string[]): string {
  return `Tu es un assistant de veille technologique pour une agence web.
Profil de l'agence :
- Stack : ${profileStack.join(', ')}
- Priorités : ${profilePriorities.join(', ')}

Article à évaluer :
Titre : ${title}
Description : ${description ?? 'Aucune description'}

Réponds UNIQUEMENT avec un JSON valide (pas de markdown, pas de backticks) :
{"score": <nombre entier 0-10>, "categorie": "<tendances|sécurité|versions>"}

Le score reflète la pertinence de l'article par rapport au profil de l'agence.
La catégorie doit être l'une des trois valeurs exactes ci-dessus.`;
}

function parseAIResponse(text: string): ScoringResult | null {
  try {
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const score = typeof parsed?.score === 'number' ? Math.min(10, Math.max(0, Math.round(parsed.score))) : null;
    const validCats = ['tendances', 'sécurité', 'versions'];
    const categorie = validCats.includes(parsed?.categorie) ? parsed.categorie : null;
    if (score === null || categorie === null) return null;
    return { score, categorie };
  } catch {
    return null;
  }
}

export async function scoreWithGroq(title: string, description: string, stack: string[], priorities: string[]): Promise<ScoringResult | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY non configurée');
  const client = new Groq({ apiKey });
  const prompt = buildPrompt(title, description, stack, priorities);
  const completion = await client.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_completion_tokens: 1024,
    reasoning_effort: 'low',
  } as any);
  const text = (completion as any)?.choices?.[0]?.message?.content ?? '';
  return parseAIResponse(text);
}

export async function scoreWithGemini(title: string, description: string, stack: string[], priorities: string[]): Promise<ScoringResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'placeholder') throw new Error('GEMINI_API_KEY non configurée');
  const prompt = buildPrompt(title, description, stack, priorities);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return parseAIResponse(text);
}

export async function scoreArticle(title: string, description: string, stack: string[], priorities: string[]): Promise<{ result: ScoringResult; engine: string }> {
  // Try Groq first
  try {
    const result = await scoreWithGroq(title, description, stack, priorities);
    if (result) return { result, engine: 'groq' };
    // retry once
    const retry = await scoreWithGroq(title, description, stack, priorities);
    if (retry) return { result: retry, engine: 'groq' };
  } catch (err: any) {
    console.error('Groq scoring failed:', err?.message);
  }

  // Fallback to Gemini
  try {
    const result = await scoreWithGemini(title, description, stack, priorities);
    if (result) return { result, engine: 'gemini' };
    const retry = await scoreWithGemini(title, description, stack, priorities);
    if (retry) return { result: retry, engine: 'gemini' };
  } catch (err: any) {
    console.error('Gemini scoring failed:', err?.message);
  }

  // Default score
  return { result: { score: 5, categorie: 'tendances' }, engine: 'default' };
}
