'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, FilePenLine, Plus, Sparkles, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createEmptyCV } from '@/lib/cv-defaults';
import { createDraft, deleteDraft, getDrafts, LocalDraft, upsertDraft } from '@/lib/drafts-storage';

export default function ResumesPage() {
    const router = useRouter();
    const [drafts, setDrafts] = useState<LocalDraft[]>([]);

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

    const onCreateWithAI = () => {
        router.push('/resumes/ai-chat');
    };

    const onDelete = (id: string) => {
        deleteDraft(id);
        setDrafts(getDrafts().sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)));
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_12%,rgba(16,185,129,0.25),transparent_40%),linear-gradient(to_bottom,#020617,#020617)]" />
            <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
                <div className="mb-8 flex flex-col items-start justify-between gap-5 md:flex-row md:items-start">
                    <div className="w-full md:w-auto">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <Button variant="ghost" className="h-auto gap-2 px-0 py-0 text-slate-300 hover:bg-transparent hover:text-white" onClick={() => router.push('/')}>
                                <ArrowLeft className="h-4 w-4" />
                                Back to Landing
                            </Button>
                            <Badge variant="secondary">Resumes Dashboard</Badge>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Resume Dashboard</h1>
                        <p className="mt-2 max-w-2xl text-slate-400">Create manually or use AI chat guidance to generate a polished resume.</p>
                    </div>

                    <CreateResumeMenu
                        buttonLabel="New Resume"
                        onCreateManual={onCreateManual}
                        onCreateWithAI={onCreateWithAI}
                        className="w-full md:mt-1 md:w-auto"
                    />
                </div>

                <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="border-slate-800">
                        <CardHeader className="pb-3">
                            <CardDescription>Total resumes</CardDescription>
                            <CardTitle className="text-2xl">{drafts.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-slate-800">
                        <CardHeader className="pb-3">
                            <CardDescription>Storage</CardDescription>
                            <CardTitle className="text-2xl">Local Auto-Save</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-slate-800 sm:col-span-2 lg:col-span-1">
                        <CardHeader className="pb-3">
                            <CardDescription>Quick action</CardDescription>
                            <div className="pt-1">
                                <CreateResumeMenu
                                    buttonLabel="Create New Resume"
                                    onCreateManual={onCreateManual}
                                    onCreateWithAI={onCreateWithAI}
                                    className="w-full"
                                    buttonClassName="w-full"
                                />
                            </div>
                        </CardHeader>
                    </Card>
                </div>

                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-white">Saved Resumes</h2>
                    {!emptyState && <span className="text-sm text-slate-400">Edit or delete your drafts</span>}
                </div>

                {emptyState ? (
                    <Card className="border-dashed border-slate-700">
                        <CardHeader>
                            <CardTitle>No resumes yet</CardTitle>
                            <CardDescription>Use New Resume to create manually or start with AI chat guidance.</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <CreateResumeMenu
                                buttonLabel="Create Resume"
                                onCreateManual={onCreateManual}
                                onCreateWithAI={onCreateWithAI}
                            />
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
                                <Card className="h-full border-slate-800">
                                    <CardHeader>
                                        <CardTitle className="line-clamp-1 text-xl">{draft.title}</CardTitle>
                                        <CardDescription>
                                            Last updated {new Date(draft.updatedAt).toLocaleString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="line-clamp-2 text-sm text-slate-400">
                                            {draft.data.email || 'No email yet'} · {draft.data.city || 'City'}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="justify-between gap-2">
                                        <Button variant="secondary" onClick={() => openBuilder(draft.id, 'manual')} className="gap-2">
                                            <FilePenLine className="h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button variant="ghost" onClick={() => onDelete(draft.id)} className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

const CreateResumeMenu = ({
    buttonLabel,
    onCreateManual,
    onCreateWithAI,
    className,
    buttonClassName,
}: {
    buttonLabel: string;
    onCreateManual: () => void;
    onCreateWithAI: () => void;
    className?: string;
    buttonClassName?: string;
}) => {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onOutsideClick = (event: MouseEvent) => {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', onOutsideClick);
        return () => document.removeEventListener('mousedown', onOutsideClick);
    }, []);

    return (
        <div className={`relative ${className ?? ''}`} ref={menuRef}>
            <Button onClick={() => setOpen((prev) => !prev)} className={`gap-2 ${buttonClassName ?? ''}`}>
                <Plus className="h-4 w-4" />
                {buttonLabel}
                <ChevronDown className="h-4 w-4" />
            </Button>

            {open && (
                <div className="absolute right-0 z-30 mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl md:w-64">
                    <button
                        onClick={() => {
                            setOpen(false);
                            onCreateManual();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                    >
                        <FilePenLine className="h-4 w-4" />
                        Create Manually
                    </button>
                    <button
                        onClick={() => {
                            setOpen(false);
                            onCreateWithAI();
                        }}
                        className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                    >
                        <Sparkles className="h-4 w-4 text-emerald-300" />
                        Create with AI Chat
                    </button>
                </div>
            )}
        </div>
    );
};
