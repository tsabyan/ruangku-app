import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const CATEGORIES = ['F&B', 'Transport', 'Groceries', 'Shopping', 'Entertainment', 'Bills', 'Other'];
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite'];

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const [header, base64Data] = image.split(',');
    const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';

    const prompt = `Kamu adalah asisten OCR untuk struk belanja. Dari gambar struk ini, ekstrak informasi dan kembalikan HANYA JSON valid:
{"amount": <total belanja dalam rupiah>, "category": "<kategori>", "notes": "<nama toko atau deskripsi singkat>", "items": ["<item1>", "<item2>"]}

Kategori: ${CATEGORIES.join(', ')}
Jika tidak bisa membaca total, perkirakan dari item-item yang ada.
Maksimal 5 items.`;

    let lastError: Error | null = null;
    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: prompt },
            ],
          }],
        });

        const raw = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return NextResponse.json({
          amount: Number(parsed.amount) || 0,
          category: CATEGORIES.includes(parsed.category) ? parsed.category : 'Other',
          notes: parsed.notes || 'Struk belanja',
          items: Array.isArray(parsed.items) ? parsed.items.slice(0, 5) : [],
        });
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const msg = lastError.message || '';
        if (!msg.includes('429') && !msg.includes('RESOURCE_EXHAUSTED')) break;
        console.warn(`Model ${model} quota exhausted, trying next...`);
      }
    }

    const isQuota = lastError?.message?.includes('429') || lastError?.message?.includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      return NextResponse.json(
        { error: 'API quota habis. Coba lagi nanti atau buat API key baru di ai.google.dev.' },
        { status: 429 }
      );
    }
    throw lastError;
  } catch (error) {
    console.error('scan-receipt error:', error);
    return NextResponse.json({ error: 'Failed to scan receipt' }, { status: 500 });
  }
}
