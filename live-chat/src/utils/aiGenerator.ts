import { GoogleGenAI } from '@google/genai';
import { Question } from '../types';

export interface GenerateQuestionsParams {
  type: 'mcq' | 'live_exam' | 'written' | 'english';
  topic: string;
  categoryId?: string;
  levelId?: string;
  levelNum?: number;
  setName?: string;
  timeLimitMinutes?: number;
  count?: number;
}

async function generateWithGeminiFallback(ai: GoogleGenAI, prompt: string): Promise<string> {
  const models = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.1-pro-preview'];
  let lastErr: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn(`Model ${model} failed in client fallback, trying next...`, err);
      lastErr = err;
    }
  }

  throw lastErr || new Error('Gemini API calls failed on all available models.');
}

export async function generateQuestionsWithAI(params: GenerateQuestionsParams): Promise<any> {
  // 1. Try Vercel Server API first
  try {
    const res = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.success) {
        return data;
      }
      if (data && data.error) {
        throw new Error(data.error);
      }
    }
  } catch (apiErr: any) {
    if (apiErr?.message && !apiErr.message.includes('fetch')) {
      throw apiErr;
    }
    console.warn('API Route /api/generate-questions unreachable or failed, trying direct client-side AI fallback...', apiErr);
  }

  // 2. Client-side fallback if VITE_GEMINI_API_KEY or process.env.GEMINI_API_KEY exists
  let rawKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '') || '').trim();

  if (!rawKey) {
    throw new Error(
      'Vercel-এ AI কাজ করানোর জন্য Vercel Settings -> Environment Variables এ GEMINI_API_KEY যোগ করুন এবং Redeploy দিন।'
    );
  }

  if (rawKey.includes('...') || rawKey.endsWith('...')) {
    throw new Error(
      'অসম্পূর্ণ API Key! Vercel-এ দেওয়া GEMINI_API_KEY-টির শেষে "..." দেখা যাচ্ছে। Google AI Studio থেকে ৩৯ অক্ষরের পুরো Key-টি কপি করে Vercel-এ Save করুন এবং Redeploy দিন।'
    );
  }

  const ai = new GoogleGenAI({ apiKey: rawKey });
  const { type, topic, categoryId = 'job_prep', levelId = 'job_prep-l1', levelNum = 1, setName = 'সেট ১', timeLimitMinutes = 15, count = 5 } = params;

  if (type === 'mcq' || type === 'live_exam') {
    const prompt = `You are an expert Bangladesh Job Exam question creator (BCS, Bank, Primary Teacher, Ministry, IT).
Create ${count} multiple choice questions in Bengali language on topic: "${topic}".

Format requirements:
Return ONLY a valid JSON array of objects.
Each object:
- "questionText": string
- "options": [string, string, string, string] (4 options in Bengali)
- "correctAnswerIndex": number (0, 1, 2, or 3)
- "explanation": string (Bengali explanation)

JSON array format only:
[
  {
    "questionText": "বাংলাদেশের জাতীয় পতাকার দৈর্ঘ্য ও প্রস্থের অনুপাত কত?",
    "options": ["১০:৬", "৫:৩", "১০:৫", "উভয় ১ ও ২ (১০:৬ ও ৫:৩)"],
    "correctAnswerIndex": 3,
    "explanation": "বাংলাদেশের জাতীয় পতাকার দৈর্ঘ্য ও প্রস্থের অনুপাত ১০:৬ বা ৫:৩।"
  }
]`;

    const responseText = await generateWithGeminiFallback(ai, prompt);
    let parsedQuestions = [];
    try {
      parsedQuestions = JSON.parse(responseText);
    } catch (e) {
      const match = responseText.match(/\[[\s\S]*\]/);
      if (match) parsedQuestions = JSON.parse(match[0]);
      else throw new Error('AI Response parsing failed');
    }

    const formattedQuestions = parsedQuestions.map((q: any, idx: number) => ({
      id: `ai_mcq_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
      categoryId,
      levelId,
      questionText: q.questionText || 'প্রশ্ন পাওয়া যায়নি',
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['অপশন ১', 'অপশন ২', 'অপশন ৩', 'অপশন ৪'],
      correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
      explanation: q.explanation || 'কোনো ব্যাখ্যা দেওয়া হয়নি।',
      points: 1,
    }));

    return { success: true, type: 'mcq', questions: formattedQuestions };
  }

  if (type === 'written') {
    const prompt = `Create a Written Exam Set in Bengali language on: "${topic}" with ${count} questions.
Return ONLY valid JSON:
{
  "title": "${topic} - লিখিত পরীক্ষা",
  "setName": "${setName}",
  "timeLimitMinutes": ${timeLimitMinutes},
  "questions": [
    {
      "questionNum": 1,
      "questionText": "written question in Bengali",
      "modelAnswer": "detailed model answer in Bengali",
      "marks": 10,
      "hints": "hints"
    }
  ]
}`;

    const responseText = await generateWithGeminiFallback(ai, prompt);
    let parsedObj: any = {};
    try {
      parsedObj = JSON.parse(responseText);
    } catch (e) {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) parsedObj = JSON.parse(match[0]);
      else throw new Error('AI Written response parsing failed');
    }

    const questionsList = Array.isArray(parsedObj.questions) ? parsedObj.questions : [];
    const formattedSubQs = questionsList.map((sq: any, idx: number) => ({
      id: `wq_sub_${Date.now()}_${idx}`,
      questionNum: idx + 1,
      questionText: sq.questionText || `লিখিত প্রশ্ন #${idx + 1}`,
      modelAnswer: sq.modelAnswer || 'মডেল উত্তর প্রস্তুত রাখা হয়নি।',
      marks: Number(sq.marks) || 10,
      hints: sq.hints || '',
    }));

    const formattedWrittenSet = {
      id: `ai_written_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      categoryId,
      levelNum: Number(levelNum) || 1,
      setName: parsedObj.setName || setName,
      title: parsedObj.title || `${topic} - লিখিত পরীক্ষা`,
      timeLimitMinutes: Number(parsedObj.timeLimitMinutes) || Number(timeLimitMinutes) || 20,
      questions: formattedSubQs,
      createdAt: new Date().toISOString(),
    };

    return { success: true, type: 'written', writtenSet: formattedWrittenSet };
  }

  if (type === 'english') {
    const prompt = `Create an English Practice Set based on "${topic}" with ${count} items.
Return ONLY valid JSON:
{
  "title": "${topic} - ইংরেজি অনুবাদ চর্চা",
  "setName": "${setName}",
  "timeLimitMinutes": ${timeLimitMinutes},
  "items": [
    {
      "itemNum": 1,
      "bengaliSentence": "Bengali sentence",
      "englishSentence": "English translation",
      "hints": "hints in Bengali",
      "marks": 10
    }
  ]
}`;

    const responseText = await generateWithGeminiFallback(ai, prompt);
    let parsedObj: any = {};
    try {
      parsedObj = JSON.parse(responseText);
    } catch (e) {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) parsedObj = JSON.parse(match[0]);
      else throw new Error('AI English response parsing failed');
    }

    const itemsList = Array.isArray(parsedObj.items) ? parsedObj.items : [];
    const formattedItems = itemsList.map((it: any, idx: number) => ({
      id: `eng_item_${Date.now()}_${idx}`,
      itemNum: idx + 1,
      bengaliSentence: it.bengaliSentence || 'বাংলা বাক্য পাওয়া যায়নি',
      englishSentence: it.englishSentence || 'Correct English translation missing',
      hints: it.hints || '',
      marks: Number(it.marks) || 10,
    }));

    const formattedEnglishSet = {
      id: `ai_english_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      categoryId,
      levelNum: Number(levelNum) || 1,
      setName: parsedObj.setName || setName,
      title: parsedObj.title || `${topic} - ইংরেজি অনুবাদ চর্চা`,
      timeLimitMinutes: Number(parsedObj.timeLimitMinutes) || Number(timeLimitMinutes) || 15,
      items: formattedItems,
      createdAt: new Date().toISOString(),
    };

    return { success: true, type: 'english', englishSet: formattedEnglishSet };
  }

  throw new Error('Invalid generation type requested');
}
