import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const CATEGORIES = ['F&B', 'Transport', 'Groceries', 'Shopping', 'Entertainment', 'Bills', 'Salary', 'Investment', 'Gift', 'Other'];
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Kamu adalah asisten pencatatan keuangan. Dari teks berikut, ekstrak informasi transaksi dan kembalikan HANYA JSON valid (tanpa markdown, tanpa penjelasan):
{"amount": <angka dalam rupiah>, "category": "<kategori>", "notes": "<catatan singkat>"}

Kategori yang tersedia: ${CATEGORIES.join(', ')}
Jika kategori tidak cocok, gunakan "Other".
Jika tidak ada nominal, perkirakan dari konteks.

Teks: "${text}"`;

    let lastError: Error | null = null;
    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const raw = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return NextResponse.json({
          amount: Number(parsed.amount) || 0,
          category: CATEGORIES.includes(parsed.category) ? parsed.category : 'Other',
          notes: parsed.notes || text,
        });
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const msg = lastError.message || '';
        // If quota exhausted, try next model; otherwise break
        if (!msg.includes('429') && !msg.includes('RESOURCE_EXHAUSTED')) break;
        console.warn(`Model ${model} quota exhausted, trying next...`);
      }
    }

    // All models failed
    const isQuota = lastError?.message?.includes('429') || lastError?.message?.includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      return NextResponse.json(
        { error: 'API quota habis. Coba lagi besok atau buat API key baru di ai.google.dev.' },
        { status: 429 }
      );
    }
    throw lastError;
  } catch (error) {
    console.error('chat-process error:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
