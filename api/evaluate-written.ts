import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60;
export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
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
    const { questionText, modelAnswer, userAnswer, maxMarks = 10 } = body;

    if (!questionText || !modelAnswer) {
      return res.status(400).json({ error: 'Question and model answer are required' });
    }

    if (!userAnswer || !userAnswer.trim()) {
      return res.status(200).json({
        success: true,
        evaluation: {
          obtainedMarks: 0,
          matchPercentage: 0,
          feedback: 'কোনো উত্তর দেওয়া হয়নি। অনুগ্রহ করে বিস্তারিত উত্তর লিখুন।',
          keyPointsFound: [],
          keyPointsMissing: ['সম্পূর্ণ উত্তর অনুপস্থিত।'],
        },
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are an expert exam paper examiner for Bangladesh Job Examinations (BCS, Bank, Ministry written exams).
Evaluate the candidate's written answer against the provided model answer/explanation.

Question: "${questionText}"
Max Marks: ${maxMarks}
Model Answer / Detailed Explanation: "${modelAnswer}"

Candidate's Submitted Answer:
"${userAnswer}"

Your Task:
Compare the candidate's answer with the model answer/explanation.
Check key concepts, facts, dates, points, accuracy, and completeness.
Determine the obtained mark out of ${maxMarks} (can be decimal e.g. 7.5, 8.0, 4.0, 0, etc.).
Calculate a match percentage (0 to 100).
Identify key points correctly included by the candidate.
Identify key points missing or inaccurate.
Provide clear constructive feedback in Bengali language.

Return ONLY a valid JSON object with no markdown block formatting:
{
  "obtainedMarks": number (between 0 and ${maxMarks}),
  "matchPercentage": number (0 to 100),
  "feedback": "detailed Bengali feedback string",
  "keyPointsFound": ["point 1 in Bengali", "point 2 in Bengali"],
  "keyPointsMissing": ["missing point 1 in Bengali", "missing point 2 in Bengali"]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const responseText = response.text || '';
        let evalData = null;
        try {
          evalData = JSON.parse(responseText);
        } catch (e) {
          const match = responseText.match(/\{[\s\S]*\}/);
          if (match) {
            evalData = JSON.parse(match[0]);
          }
        }

        if (evalData && typeof evalData.obtainedMarks === 'number') {
          return res.status(200).json({
            success: true,
            evaluation: {
              obtainedMarks: Math.min(maxMarks, Math.max(0, evalData.obtainedMarks)),
              matchPercentage: Math.min(100, Math.max(0, Math.round(evalData.matchPercentage || (evalData.obtainedMarks / maxMarks) * 100))),
              feedback: evalData.feedback || 'উত্তর মূল্যায়ন করা হয়েছে।',
              keyPointsFound: Array.isArray(evalData.keyPointsFound) ? evalData.keyPointsFound : [],
              keyPointsMissing: Array.isArray(evalData.keyPointsMissing) ? evalData.keyPointsMissing : [],
            },
          });
        }
      } catch (geminiErr) {
        console.warn('Gemini evaluation failed in Vercel API, falling back:', geminiErr);
      }
    }

    // Smart Fallback Evaluator Algorithm
    const cleanModel = modelAnswer.replace(/[^\u0980-\u09FFa-zA-Z0-9\s]/g, ' ').toLowerCase();
    const cleanUser = userAnswer.replace(/[^\u0980-\u09FFa-zA-Z0-9\s]/g, ' ').toLowerCase();

    const modelWords = cleanModel.split(/\s+/).filter((w: string) => w.length > 2);
    const userWords = cleanUser.split(/\s+/).filter((w: string) => w.length > 2);

    const uniqueModelWords = Array.from(new Set(modelWords));
    const matchedWords = uniqueModelWords.filter((w: string) => cleanUser.includes(w));

    const wordMatchRatio = uniqueModelWords.length > 0 ? matchedWords.length / uniqueModelWords.length : 0;
    const lengthRatio = Math.min(1, userWords.length / Math.max(1, modelWords.length * 0.6));

    const rawMatch = (wordMatchRatio * 0.75 + lengthRatio * 0.25) * 100;
    const matchPercentage = Math.min(100, Math.round(rawMatch));

    const rawScore = (matchPercentage / 100) * maxMarks;
    const obtainedMarks = parseFloat(rawScore.toFixed(1));

    const keyPointsFound = matchedWords.slice(0, 5).map((w: string) => `মূল শব্দ/ধারণা অন্তর্ভুক্ত: "${w}"`);
    const keyPointsMissing = uniqueModelWords.filter((w: string) => !matchedWords.includes(w)).slice(0, 5).map((w: string) => `অনুপস্থিত কী-ওয়ার্ড: "${w}"`);

    let feedback = '';
    if (matchPercentage >= 80) {
      feedback = 'চমৎকার উত্তর! আপনার উত্তরে আদর্শ উত্তরের মূল তথ্য ও ব্যাখ্যাগুলো অত্যন্ত নিখুঁতভাবে ফুটে উঠেছে।';
    } else if (matchPercentage >= 50) {
      feedback = 'ভালো উত্তর! আপনি বেশ কয়েকটি গুরুত্বপূর্ণ বিষয় কভার করেছেন, তবে পূর্ণাঙ্গ নম্বর পেতে আরেকটু বিস্তারিত ও স্পষ্ট তথ্য থাকা প্রয়োজন।';
    } else if (matchPercentage >= 25) {
      feedback = 'আংশিক উত্তর মিলেছে। আদর্শ উত্তরের সাথে তুলনা করে প্রধান পয়েন্টগুলো রিভিশন দেওয়ার পরামর্শ দেওয়া হচ্ছে।';
    } else {
      feedback = 'উত্তরের সাথে আদর্শ ব্যাখ্যা ও তথ্যের মিল যথেষ্ট কম। অনুগ্রহ করে সঠিক উত্তরের ব্যাখ্যাটি মনোযোগ দিয়ে পড়ে আবার অনুশীলন করুন।';
    }

    return res.status(200).json({
      success: true,
      evaluation: {
        obtainedMarks,
        matchPercentage,
        feedback,
        keyPointsFound,
        keyPointsMissing,
      },
    });

  } catch (err: any) {
    console.error('Error evaluating written answer in Vercel API:', err);
    return res.status(500).json({ error: 'উত্তর মূল্যায়ন প্রক্রিয়ায় ত্রুটি হয়েছে।' });
  }
}
