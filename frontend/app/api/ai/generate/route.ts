import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ChatGroq } from '@langchain/groq';

import { CVDataSchema } from '@/lib/validators';

const RequestSchema = z.object({
    prompt: z.string().min(10, 'Please provide more details to generate a quality resume.'),
});

const getModel = () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('Missing GROQ_API_KEY. Add it to frontend/.env.local');
    }

    return new ChatGroq({
        apiKey,
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.35,
    });
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = RequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten().formErrors[0] || 'Invalid request' }, { status: 400 });
        }

        const model = getModel();
        const structuredModel = model.withStructuredOutput(CVDataSchema);

        const result = await structuredModel.invoke([
            {
                role: 'system',
                content:
                    'You are an expert resume writer. Generate a complete, ATS-friendly technical resume in structured JSON based on the provided user profile. Fill all sections with realistic, high-quality entries when details are partial. Keep claims plausible and concise.',
            },
            {
                role: 'user',
                content: `Create a production-grade resume from this profile:\n\n${parsed.data.prompt}`,
            },
        ]);

        return NextResponse.json({ data: result });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || 'Failed to generate resume' }, { status: 500 });
    }
}
