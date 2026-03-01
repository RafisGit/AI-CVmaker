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

const extractJson = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        return trimmed;
    }

    const fenceMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fenceMatch?.[1]) {
        return fenceMatch[1].trim();
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
        return trimmed.slice(firstBrace, lastBrace + 1);
    }

    return trimmed;
};

const contentToText = (content: unknown) => {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content
            .map((chunk) => {
                if (typeof chunk === 'string') return chunk;
                if (chunk && typeof chunk === 'object' && 'text' in chunk) {
                    const text = (chunk as { text?: unknown }).text;
                    return typeof text === 'string' ? text : '';
                }
                return '';
            })
            .join('\n');
    }
    return JSON.stringify(content ?? '');
};

const maybeParseJson = (text: string): any => {
    const jsonText = extractJson(text);
    const parsed = JSON.parse(jsonText);

    if (parsed && typeof parsed === 'object' && parsed.name === 'json' && parsed.arguments) {
        if (typeof parsed.arguments === 'string') {
            return JSON.parse(parsed.arguments);
        }
        return parsed.arguments;
    }

    return parsed;
};

const asString = (value: unknown, fallback = '') => {
    if (typeof value === 'number' || typeof value === 'boolean') {
        const normalized = String(value).trim();
        return normalized || fallback;
    }
    if (typeof value === 'string') {
        const normalized = value.trim();
        return normalized || fallback;
    }
    return fallback;
};

const safeEmail = (value: unknown) => {
    const candidate = asString(value, 'candidate@example.com');
    const emailCheck = z.string().email().safeParse(candidate);
    return emailCheck.success ? candidate : 'candidate@example.com';
};

const asStringArray = (value: unknown) => {
    if (!Array.isArray(value)) return [];
    return value.map((item) => asString(item)).filter(Boolean);
};

const safeUrl = (value: unknown) => {
    const candidate = asString(value);
    if (!candidate) return '';
    try {
        new URL(candidate);
        return candidate;
    } catch {
        return '';
    }
};

const normalizeTechnicalSkills = (technicalSkills: unknown) => {
    if (Array.isArray(technicalSkills)) {
        return technicalSkills
            .map((category) => ({
                title: asString((category as { title?: unknown })?.title),
                skills: asStringArray((category as { skills?: unknown })?.skills),
            }))
            .filter((category) => category.title || category.skills.length > 0);
    }

    if (technicalSkills && typeof technicalSkills === 'object') {
        const legacySkills = technicalSkills as {
            languages?: unknown;
            frameworks?: unknown;
            tools?: unknown;
            databases?: unknown;
        };

        return [
            { title: 'Languages', skills: asStringArray(legacySkills.languages) },
            { title: 'Frameworks/Libraries', skills: asStringArray(legacySkills.frameworks) },
            { title: 'Tools', skills: asStringArray(legacySkills.tools) },
            { title: 'Databases', skills: asStringArray(legacySkills.databases) },
        ].filter((category) => category.skills.length > 0);
    }

    return [];
};

const normalizeCVData = (raw: any) => ({
    full_name: asString(raw?.full_name, 'Candidate Name'),
    city: asString(raw?.city, 'Dhaka'),
    country: asString(raw?.country, 'Bangladesh'),
    email: safeEmail(raw?.email),
    phone: asString(raw?.phone, 'N/A'),
    portfolio_url: safeUrl(raw?.portfolio_url),
    linkedin_url: safeUrl(raw?.linkedin_url),
    github_url: safeUrl(raw?.github_url),
    technical_skills: normalizeTechnicalSkills(raw?.technical_skills),
    projects: Array.isArray(raw?.projects)
        ? raw.projects.map((project: any) => ({
              title: asString(project?.title, 'Project'),
              start_month: asString(project?.start_month),
              start_year: asString(project?.start_year),
              end_month: asString(project?.end_month),
              end_year: asString(project?.end_year),
              github_url: safeUrl(project?.github_url),
              live_url: safeUrl(project?.live_url),
              tech_stack: asStringArray(project?.tech_stack),
              bullets: asStringArray(project?.bullets),
          }))
        : [],
    work_experience: Array.isArray(raw?.work_experience)
        ? raw.work_experience.map((experience: any) => ({
              role: asString(experience?.role, 'Role'),
              company: asString(experience?.company, 'Company'),
              employment_type: asString(experience?.employment_type),
              location: asString(experience?.location),
              start_month: asString(experience?.start_month),
              start_year: asString(experience?.start_year),
              end_month: asString(experience?.end_month),
              end_year: asString(experience?.end_year),
              bullets: asStringArray(experience?.bullets),
          }))
        : [],
    education: Array.isArray(raw?.education)
        ? raw.education.map((education: any) => ({
              institution: asString(education?.institution, 'Institution'),
              degree: asString(education?.degree, 'Degree'),
              start_year: asString(education?.start_year),
              end_year: asString(education?.end_year),
              coursework: asStringArray(education?.coursework),
          }))
        : [],
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = RequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten().formErrors[0] || 'Invalid request' }, { status: 400 });
        }

        const model = getModel();

        const result = await model.invoke([
            {
                role: 'system',
                content:
                    'You are a resume copilot assistant. Return only valid JSON with keys assistantMessage and data. data must follow the exact resume schema and include all required fields. technical_skills must be an array of objects with keys title and skills (string array). No markdown or code fences.',
            },
            {
                role: 'user',
                content: `Current CV JSON:\n${JSON.stringify(parsed.data.cvData)}\n\nInstruction:\n${parsed.data.instruction}`,
            },
        ]);

        const rawText = contentToText(result.content);
        const parsedJson = maybeParseJson(rawText);
        const normalized = {
            assistantMessage: asString(parsedJson?.assistantMessage, 'Updated your resume based on your request.'),
            data: normalizeCVData(parsedJson?.data ?? parsedJson),
        };
        const parsedResponse = ResponseSchema.safeParse(normalized);

        if (!parsedResponse.success) {
            return NextResponse.json({ error: 'Model returned invalid assistant JSON shape.' }, { status: 500 });
        }

        return NextResponse.json(parsedResponse.data);
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || 'Failed to update resume with AI' }, { status: 500 });
    }
}
