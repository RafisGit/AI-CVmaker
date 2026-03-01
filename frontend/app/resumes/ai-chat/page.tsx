'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, CircleDashed, Loader2, MessageSquarePlus, Send, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createDraft, upsertDraft } from '@/lib/drafts-storage';

const CHAT_STORAGE_KEY = 'ai-cv-maker:ai-chat-sessions:v1';

type ChatRole = 'assistant' | 'user';

interface ChatMessage {
    id: string;
    role: ChatRole;
    content: string;
    createdAt: string;
}

interface ChatSession {
    id: string;
    title: string;
    updatedAt: string;
    messages: ChatMessage[];
}

interface InfoCategory {
    key: string;
    label: string;
    hints: string;
    keywords: string[];
}

const categories: InfoCategory[] = [
    {
        key: 'identity',
        label: 'Name + contact details',
        hints: 'Full name, email, phone, city/country.',
        keywords: ['name', 'email', 'phone', 'city', 'country', '@'],
    },
    {
        key: 'role',
        label: 'Target role or summary',
        hints: 'Your target job title and short profile summary.',
        keywords: ['developer', 'engineer', 'designer', 'analyst', 'manager', 'summary', 'objective'],
    },
    {
        key: 'skills',
        label: 'Skills + tools',
        hints: 'Languages, frameworks, tools, cloud, database, etc.',
        keywords: ['skills', 'language', 'framework', 'tool', 'react', 'node', 'python', 'java', 'docker', 'sql'],
    },
    {
        key: 'projects',
        label: 'Projects',
        hints: 'Project names, tech stack, outcomes, links.',
        keywords: ['project', 'built', 'github', 'live', 'portfolio', 'feature'],
    },
    {
        key: 'experience',
        label: 'Work experience',
        hints: 'Role, company, duration, achievements, impact.',
        keywords: ['experience', 'company', 'worked', 'intern', 'role', 'achievement', 'impact'],
    },
    {
        key: 'education',
        label: 'Education',
        hints: 'Institution, degree, years.',
        keywords: ['education', 'university', 'college', 'degree', 'bachelor', 'master'],
    },
    {
        key: 'achievements',
        label: 'Results / metrics',
        hints: 'Numbers like %, revenue, users, performance gains.',
        keywords: ['%', 'improved', 'increased', 'reduced', 'users', 'revenue', 'performance'],
    },
    {
        key: 'links',
        label: 'Public links',
        hints: 'LinkedIn, GitHub, portfolio links.',
        keywords: ['linkedin', 'github', 'http://', 'https://', 'portfolio'],
    },
];

const createAssistantMessage = (content: string): ChatMessage => ({
    id: crypto.randomUUID(),
    role: 'assistant',
    content,
    createdAt: new Date().toISOString(),
});

const createUserMessage = (content: string): ChatMessage => ({
    id: crypto.randomUUID(),
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
});

const initialAssistantMessage = createAssistantMessage(
    'Hi! I will help you build your resume. Share your information in natural language (about you, skills, projects, experience, education, links). I’ll track coverage and tell you what is missing.'
);

const createNewSession = (): ChatSession => ({
    id: crypto.randomUUID(),
    title: 'New AI Resume Chat',
    updatedAt: new Date().toISOString(),
    messages: [initialAssistantMessage],
});

const getCoverage = (messages: ChatMessage[]) => {
    const userText = messages
        .filter((message) => message.role === 'user')
        .map((message) => message.content.toLowerCase())
        .join(' ');

    const covered = categories.map((category) => {
        const complete = category.keywords.some((keyword) => userText.includes(keyword.toLowerCase()));
        return {
            ...category,
            complete,
        };
    });

    const completeCount = covered.filter((category) => category.complete).length;
    const percentage = Math.round((completeCount / categories.length) * 100);

    return {
        covered,
        completeCount,
        percentage,
    };
};

export default function AIResumeChatPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string>('');
    const [input, setInput] = useState('');
    const [launchingEditor, setLaunchingEditor] = useState(false);
    const [launchError, setLaunchError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
            if (!raw) {
                const first = createNewSession();
                setSessions([first]);
                setActiveSessionId(first.id);
                return;
            }

            const parsed = JSON.parse(raw) as ChatSession[];
            if (!Array.isArray(parsed) || parsed.length === 0) {
                const first = createNewSession();
                setSessions([first]);
                setActiveSessionId(first.id);
                return;
            }

            setSessions(parsed);
            setActiveSessionId(parsed[0].id);
        } catch {
            const first = createNewSession();
            setSessions([first]);
            setActiveSessionId(first.id);
        }
    }, []);

    useEffect(() => {
        if (sessions.length === 0) return;
        window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions));
    }, [sessions]);

    const activeSession = useMemo(
        () => sessions.find((session) => session.id === activeSessionId) ?? sessions[0],
        [sessions, activeSessionId]
    );

    const coverage = useMemo(
        () => getCoverage(activeSession?.messages ?? []),
        [activeSession]
    );

    const missingCategories = useMemo(
        () => coverage.covered.filter((category) => !category.complete),
        [coverage]
    );

    const startNewChat = () => {
        const next = createNewSession();
        setSessions((prev) => [next, ...prev]);
        setActiveSessionId(next.id);
        setInput('');
        setLaunchError(null);
    };

    const updateActiveSession = (updater: (session: ChatSession) => ChatSession) => {
        setSessions((prev) =>
            prev.map((session) => (session.id === activeSessionId ? updater(session) : session))
        );
    };

    const sendMessage = () => {
        if (!activeSession || !input.trim()) return;

        const userMessage = createUserMessage(input.trim());
        const userDraftText = input.trim();
        setInput('');

        updateActiveSession((session) => {
            const messages = [...session.messages, userMessage];
            const liveCoverage = getCoverage(messages);
            const missing = liveCoverage.covered.filter((item) => !item.complete).slice(0, 3);

            const guidance =
                missing.length > 0
                    ? `Great. Next, please share: ${missing.map((item) => item.label).join(', ')}.`
                    : 'Excellent coverage. You can now generate your resume and open it in the editor.';

            const assistantMessage = createAssistantMessage(
                `Received. Your profile coverage is now ${liveCoverage.percentage}%. ${guidance}`
            );

            const title =
                session.title === 'New AI Resume Chat'
                    ? userDraftText.split(' ').slice(0, 6).join(' ') || 'AI Resume Chat'
                    : session.title;

            return {
                ...session,
                title,
                updatedAt: new Date().toISOString(),
                messages: [...messages, assistantMessage],
            };
        });
    };

    const openInEditor = async () => {
        if (!activeSession) return;

        const prompt = activeSession.messages
            .filter((message) => message.role === 'user')
            .map((message) => message.content)
            .join('\n\n');

        if (!prompt.trim()) return;

        setLaunchError(null);
        setLaunchingEditor(true);

        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || 'Failed to generate resume from chat details.');
            }

            const generatedData = payload?.data;
            const draftTitle = generatedData?.full_name ? `${generatedData.full_name} Resume` : 'AI Generated Resume';
            const draft = upsertDraft(createDraft(generatedData, draftTitle));
            router.push(`/builder?id=${draft.id}&source=ai`);
        } catch (error: any) {
            setLaunchError(error?.message || 'Unable to open editor right now. Please try again.');
        } finally {
            setLaunchingEditor(false);
        }
    };

    if (!activeSession) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_12%,rgba(16,185,129,0.22),transparent_40%),linear-gradient(to_bottom,#020617,#020617)]" />
            <main className="mx-auto h-screen w-full max-w-[1700px] overflow-hidden px-3 py-3 sm:px-6 sm:py-6 xl:px-8">
                <div className="grid h-full gap-4 xl:gap-6 lg:grid-cols-[320px_1fr]">
                    <aside className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <Button variant="ghost" className="h-auto gap-2 px-0 py-0 text-slate-300 hover:bg-transparent hover:text-white" onClick={() => router.push('/resumes')}>
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                            <Badge variant="secondary">AI Chat</Badge>
                        </div>

                        <Button onClick={startNewChat} className="mb-3 w-full gap-2">
                            <MessageSquarePlus className="h-4 w-4" />
                            New Chat
                        </Button>

                        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">History</div>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                            {sessions.map((session) => (
                                <button
                                    key={session.id}
                                    onClick={() => setActiveSessionId(session.id)}
                                    className={`w-full rounded-lg border px-3 py-2 text-left transition ${session.id === activeSession.id ? 'border-emerald-300/40 bg-emerald-400/10 text-slate-100' : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                                >
                                    <div className="line-clamp-1 text-sm font-medium">{session.title}</div>
                                    <div className="mt-1 text-xs text-slate-500">{new Date(session.updatedAt).toLocaleString()}</div>
                                </button>
                            ))}
                        </div>
                    </aside>

                    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/80">
                        <div className="border-b border-slate-800 p-4 sm:p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h1 className="text-xl font-semibold text-white sm:text-2xl">AI Resume Intake Chat</h1>
                                    <p className="text-sm text-slate-400">Share your details naturally. I’ll track progress and guide what to add next.</p>
                                </div>
                                <Badge variant="outline">Coverage {coverage.percentage}%</Badge>
                            </div>
                            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                <div className="h-full bg-emerald-400 transition-all" style={{ width: `${coverage.percentage}%` }} />
                            </div>
                        </div>

                        <div className="grid min-h-0 flex-1 gap-4 p-4 sm:p-5 xl:gap-6 xl:p-6 lg:grid-cols-[minmax(0,1.35fr)_360px] 2xl:grid-cols-[minmax(0,1.5fr)_390px]">
                            <div className="flex min-h-0 flex-col rounded-xl border border-slate-800 bg-slate-950/60">
                                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                                    {activeSession.messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`rounded-lg px-3 py-2 text-sm ${message.role === 'assistant' ? 'bg-slate-800 text-slate-100' : 'bg-emerald-400 text-slate-950'}`}
                                        >
                                            {message.content}
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-slate-800 p-4">
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <Input
                                            value={input}
                                            onChange={(event) => setInput(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' && !event.shiftKey) {
                                                    event.preventDefault();
                                                    sendMessage();
                                                }
                                            }}
                                            placeholder="Type your info: about you, skills, projects, experience, education..."
                                        />
                                        <Button onClick={sendMessage} className="w-full gap-2 sm:w-auto">
                                            <Send className="h-4 w-4" />
                                            Send
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <Card className="h-full min-h-0 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-base">Important info checklist</CardTitle>
                                    <CardDescription>Try covering all items for a stronger first draft.</CardDescription>
                                </CardHeader>
                                <CardContent className="min-h-0 space-y-3 overflow-y-auto">
                                    {coverage.covered.map((item) => (
                                        <div key={item.key} className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                                            <div className="flex items-start gap-2">
                                                {item.complete ? (
                                                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                                                ) : (
                                                    <CircleDashed className="mt-0.5 h-4 w-4 text-slate-500" />
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-slate-100">{item.label}</div>
                                                    {!item.complete && <div className="text-xs text-slate-400">{item.hints}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                </div>
            </main>

            <AnimatePresence>
                {coverage.percentage >= 80 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        className="fixed bottom-4 right-4 z-40 w-[min(420px,calc(100vw-2rem))] rounded-xl border border-emerald-300/30 bg-slate-900 p-4 shadow-2xl"
                    >
                        <div className="flex items-start gap-2">
                            <Sparkles className="mt-0.5 h-5 w-5 text-emerald-300" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-white">Great! Your profile details are {coverage.percentage}% complete.</p>
                                <p className="mt-1 text-xs text-slate-400">
                                    {missingCategories.length > 0
                                        ? `Optional improvements: ${missingCategories.slice(0, 2).map((item) => item.label).join(', ')}.`
                                        : 'You provided all key information.'}
                                </p>
                            </div>
                        </div>

                        {launchError && <p className="mt-2 text-xs text-red-400">{launchError}</p>}

                        <Button onClick={openInEditor} disabled={launchingEditor} className="mt-3 w-full gap-2">
                            {launchingEditor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            Open in Editor + Preview
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
