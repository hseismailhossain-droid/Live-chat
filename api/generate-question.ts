import { GoogleGenAI } from '@google/genai';

// Vercel Serverless Function Config for maximum execution time (60 seconds)
export const maxDuration = 60;
export const config = {
  maxDuration: 60,
};

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
      console.warn(`Model ${model} failed in Vercel API, trying next...`, err);
      lastErr = err;
    }
  }

  throw lastErr || new Error('Gemini API calls failed on all available models.');
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { 
      type = 'mcq', 
      topic, 
      categoryId = 'job_prep', 
      levelId = 'job_prep-l1', 
      levelNum = 1,
      setName = 'সেট ১',
      timeLimitMinutes = 15,
      count = 5 
    } = body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    let rawKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
    if (!rawKey) {
      return res.status(400).json({ 
        error: 'GEMINI_API_KEY পাওয়া যায়নি। Vercel Project Settings -> Environment Variables এ GEMINI_API_KEY যুক্ত করে অ্যাপটি Redeploy করুন।' 
      });
    }

    if (rawKey.includes('...') || rawKey.endsWith('...')) {
      return res.status(400).json({ 
        error: 'অসম্পূর্ণ API Key! আপনার Vercel-এ বসানো GEMINI_API_KEY-টির শেষে "..." রয়েছে। Google AI Studio থেকে ৩৯ অক্ষরের সম্পূর্ণ Key-টি কপি করে Vercel-এ Save করুন এবং Redeploy দিন।' 
      });
    }

    const ai = new GoogleGenAI({ apiKey: rawKey });

    // Mode 1 & 2: MCQ Questions
    if (type === 'mcq' || type === 'live_exam') {
      const prompt = `You are an expert Bangladesh Job Exam question creator (BCS, Bank, Primary Teacher, Ministry, IT).
Create ${count} multiple choice questions in Bengali language on topic: "${topic}".

Format requirements:
Return ONLY a valid JSON array of objects. Do not include markdown code block backticks if possible, or format as standard clean JSON array.
Each object in the array must strictly have these fields:
- "questionText": string (the question in Bengali)
- "options": [string, string, string, string] (exactly 4 options in Bengali)
- "correctAnswerIndex": number (0, 1, 2, or 3)
- "explanation": string (detailed educational explanation in Bengali why this option is correct)

Example output JSON format:
[
  {
    "questionText": "বাংলাদেশের জাতীয় পতাকার দৈর্ঘ্য ও প্রস্থের অনুপাত কত?",
    "options": ["১০:৬", "৫:৩", "১০:৫", "উভয় ১ ও ২ (১০:৬ ও ৫:৩)"],
    "correctAnswerIndex": 3,
    "explanation": "বাংলাদেশের জাতীয় পতাকার দৈর্ঘ্য ও প্রস্থের অনুপাত ১০:৬ বা ৫:৩। উভয়টিই গাণিতিকভাবে সমান।"
  }
]`;

      const responseText = await generateWithGeminiFallback(ai, prompt);
      let parsedQuestions = [];
      try {
        parsedQuestions = JSON.parse(responseText);
      } catch (e) {
        const match = responseText.match(/\[[\s\S]*\]/);
        if (match) {
          parsedQuestions = JSON.parse(match[0]);
        } else {
          throw new Error('AI Response parsing failed');
        }
      }

      const formattedQuestions = parsedQuestions.map((q: any, idx: number) => ({
        id: `ai_mcq_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
        categoryId: categoryId || 'job_prep',
        levelId: levelId || 'job_prep-l1',
        questionText: q.questionText || 'প্রশ্ন পাওয়া যায়নি',
        options: Array.isArray(q.options) && q.options.length === 4 
          ? q.options 
          : ['অপশন ১', 'অপশন ২', 'অপশন ৩', 'অপশন ৪'],
        correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
        explanation: q.explanation || 'কোনো ব্যাখ্যা দেওয়া হয়নি।',
        points: 1,
      }));

      return res.status(200).json({ success: true, type: 'mcq', questions: formattedQuestions });
    }

    // Mode 3: Written Exam
    if (type === 'written') {
      const prompt = `You are an expert Bangladesh Written Exam Paper creator (BCS Written, Bank Officer Written, Ministry Written Exams).
Create a complete Written Exam Set in Bengali language on the topic: "${topic}".
Generate exactly ${count} written descriptive questions with detailed model answers and key points.

Format requirements:
Return ONLY a valid JSON object. Do not include markdown code block backticks if possible.
The object must strictly match this structure:
{
  "title": "written exam title in Bengali based on ${topic}",
  "setName": "${setName || 'সেট ১'}",
  "timeLimitMinutes": ${timeLimitMinutes || 20},
  "questions": [
    {
      "questionNum": 1,
      "questionText": "the written question in Bengali",
      "modelAnswer": "comprehensive, accurate model answer in Bengali with bullet points, dates, and essential facts",
      "marks": 10,
      "hints": "important concepts or key guidelines candidate must include"
    }
  ]
}`;

      const responseText = await generateWithGeminiFallback(ai, prompt);
      let parsedObj: any = {};
      try {
        parsedObj = JSON.parse(responseText);
      } catch (e) {
        const match = responseText.match(/\{[\s\S]*\}/);
        if (match) {
          parsedObj = JSON.parse(match[0]);
        } else {
          throw new Error('AI Written response parsing failed');
        }
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
        categoryId: categoryId || 'job_prep',
        levelNum: Number(levelNum) || 1,
        setName: parsedObj.setName || setName || 'সেট ১',
        title: parsedObj.title || `${topic} - লিখিত পরীক্ষা`,
        timeLimitMinutes: Number(parsedObj.timeLimitMinutes) || Number(timeLimitMinutes) || 20,
        questions: formattedSubQs,
        createdAt: new Date().toISOString(),
      };

      return res.status(200).json({ success: true, type: 'written', writtenSet: formattedWrittenSet });
    }

    // Mode 4: English Practice Set
    if (type === 'english') {
      const prompt = `You are an expert English Translation Instructor for Bangladesh Job Seekers (BCS, Bank, Newspaper Translation, Daily Conversation).
Create a complete English Practice Set based on the topic: "${topic}".
Generate exactly ${count} Bengali-to-English translation items.

Format requirements:
Return ONLY a valid JSON object. Do not include markdown code block backticks if possible.
The object must strictly match this structure:
{
  "title": "English practice set title in Bengali e.g. ${topic} - অনুবাদ চর্চা",
  "setName": "${setName || 'সেট ১'}",
  "timeLimitMinutes": ${timeLimitMinutes || 15},
  "items": [
    {
      "itemNum": 1,
      "bengaliSentence": "Bengali sentence to translate",
      "englishSentence": "Exact standard correct English translation",
      "hints": "Vocabulary breakdown, grammar notes, or phrasing tips in Bengali",
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
        if (match) {
          parsedObj = JSON.parse(match[0]);
        } else {
          throw new Error('AI English response parsing failed');
        }
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
        categoryId: categoryId || 'job_prep',
        levelNum: Number(levelNum) || 1,
        setName: parsedObj.setName || setName || 'সেট ১',
        title: parsedObj.title || `${topic} - ইংরেজি অনুবাদ চর্চা`,
        timeLimitMinutes: Number(parsedObj.timeLimitMinutes) || Number(timeLimitMinutes) || 15,
        items: formattedItems,
        createdAt: new Date().toISOString(),
      };

      return res.status(200).json({ success: true, type: 'english', englishSet: formattedEnglishSet });
    }

    return res.status(400).json({ error: 'Invalid generation type requested' });

  } catch (err: any) {
    console.error('Error in Vercel API handler:', err);
    return res.status(500).json({ error: err.message || 'প্রশ্ন তৈরি করতে সমস্যা হয়েছে।' });
  }
}
