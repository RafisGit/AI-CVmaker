'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, FilePenLine, Trash2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { createEmptyCV } from '@/lib/cv-defaults';
import { createDraft, deleteDraft, getDrafts, LocalDraft, upsertDraft } from '@/lib/drafts-storage';

export default function HomePage() {
    const router = useRouter();
    const [drafts, setDrafts] = useState<LocalDraft[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [mode, setMode] = useState<'manual' | 'ai'>('manual');
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setDrafts(getDrafts().sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)));
    }, []);

    const emptyState = useMemo(() => drafts.length === 0, [drafts]);

    const openBuilder = (draftId: string, source: 'manual' | 'ai') => {
        router.push(`/builder?id=${draftId}&source=${source}`);
    };

    const onCreateManual = () => {
        const draft = upsertDraft(createDraft(createEmptyCV(), 'Untitled Resume'));
        openBuilder(draft.id, 'manual');
    };

    const onCreateWithAI = async () => {
        if (!aiPrompt.trim()) {
            setError('Please share some information so AI can craft your resume.');
            return;
        }
        setError(null);
        setIsGenerating(true);
        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || 'Failed to generate AI resume');
            }

            const generatedData = payload?.data;
            const draftTitle = generatedData?.full_name ? `${generatedData.full_name} Resume` : 'AI Generated Resume';
            const draft = upsertDraft(createDraft(generatedData, draftTitle));
            openBuilder(draft.id, 'ai');
        } catch (requestError: any) {
            setError(requestError?.message || 'AI generation failed. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const onDelete = (id: string) => {
        deleteDraft(id);
        setDrafts(getDrafts().sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)));
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-slate-100">
            <main className="mx-auto max-w-6xl px-6 py-10">
                <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <Badge variant="secondary" className="mb-2">AI CV Maker</Badge>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Build beautiful resumes fast</h1>
                        <p className="mt-2 text-slate-600">Create manually or let AI draft a polished resume that you can fully edit.</p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Resume
                    </Button>
                </div>

                {emptyState ? (
                    <Card className="border-dashed">
                        <CardHeader>
                            <CardTitle>No resumes yet</CardTitle>
                            <CardDescription>Start your first resume with AI or manual mode.</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create Resume
                            </Button>
                        </CardFooter>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {drafts.map((draft) => (
                            <motion.div
                                key={draft.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="h-full">
                                    <CardHeader>
                                        <CardTitle className="line-clamp-1">{draft.title}</CardTitle>
                                        <CardDescription>
                                            Last updated {new Date(draft.updatedAt).toLocaleString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="line-clamp-2 text-sm text-slate-600">
                                            {draft.data.email || 'No email yet'} · {draft.data.city || 'City'}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="justify-between gap-2">
                                        <Button variant="secondary" onClick={() => openBuilder(draft.id, 'manual')} className="gap-2">
                                            <FilePenLine className="h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button variant="ghost" onClick={() => onDelete(draft.id)} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">Create New Resume</h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-sm text-slate-500 hover:text-slate-900">Close</button>
                            </div>

                            <div className="mb-5 flex gap-2 rounded-lg bg-slate-100 p-1">
                                <button
                                    onClick={() => setMode('manual')}
                                    className={`w-full rounded-md px-4 py-2 text-sm font-medium transition ${mode === 'manual' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'}`}
                                >
                                    Manual
                                </button>
                                <button
                                    onClick={() => setMode('ai')}
                                    className={`w-full rounded-md px-4 py-2 text-sm font-medium transition ${mode === 'ai' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'}`}
                                >
                                    AI Assisted
                                </button>
                            </div>

                            {mode === 'manual' ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-600">Start with a clean resume and fill each section yourself.</p>
                                    <Button onClick={onCreateManual} className="w-full">Start Manual Resume</Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                                        <div className="mb-2 flex items-center gap-2 text-blue-700">
                                            <Sparkles className="h-4 w-4" />
                                            <span className="text-sm font-semibold">Tell AI about your profile</span>
                                        </div>
                                        <p className="text-sm text-blue-700/90">
                                            Include: who you are, skills, tools, projects, achievements, work history, education, and links.
                                        </p>
                                    </div>
                                    <Textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="I am a frontend developer with 3 years experience..."
                                        className="min-h-40"
                                    />
                                    {error && <p className="text-sm text-red-600">{error}</p>}
                                    <Button onClick={onCreateWithAI} disabled={isGenerating} className="w-full gap-2">
                                        {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Generate Resume with AI
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
