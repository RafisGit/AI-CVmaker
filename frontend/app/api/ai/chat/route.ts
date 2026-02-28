import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ChatGroq } from '@langchain/groq';

import { CVDataSchema } from '@/lib/validators';

const RequestSchema = z.object({
    instruction: z.string().min(2),
    cvData: CVDataSchema,
});

const ResponseSchema = z.object({
    assistantMessage: z.string(),
    data: CVDataSchema,
});

const getModel = () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('Missing GROQ_API_KEY. Add it to frontend/.env.local');
    }

    return new ChatGroq({
        apiKey,
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.25,
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
        const structuredModel = model.withStructuredOutput(ResponseSchema);

        const result = await structuredModel.invoke([
            {
                role: 'system',
                content:
                    'You are a resume copilot assistant. Update and optimize resume content based on user instruction while preserving factual consistency. Always return the full updated CV JSON and a short assistant message summarizing changes.',
            },
            {
                role: 'user',
                content: `Current CV JSON:\n${JSON.stringify(parsed.data.cvData)}\n\nInstruction:\n${parsed.data.instruction}`,
            },
        ]);

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || 'Failed to update resume with AI' }, { status: 500 });
    }
}
