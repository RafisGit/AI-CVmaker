'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Layers3, Sparkles, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.28),transparent_38%),radial-gradient(circle_at_78%_10%,rgba(52,211,153,0.25),transparent_35%),linear-gradient(to_bottom,#020617,#020617)]" />
            <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
                <header className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg border border-emerald-300/40 bg-emerald-300/10" />
                        <span className="text-xl font-semibold tracking-tight sm:text-2xl">CV Architect</span>
                    </div>
                    <Button onClick={() => router.push('/resumes')} className="w-full gap-2 sm:w-auto">
                        Open App
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </header>

                <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                    <div>
                        <Badge variant="default" className="mb-4">Modern AI Resume SaaS</Badge>
                        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                            Create job-winning resumes with a premium workflow
                        </h1>
                        <p className="mt-4 max-w-xl text-base text-slate-300 sm:mt-5 sm:text-lg">
                            Start with AI or manual mode, edit with live preview, and export to polished PDF in minutes.
                        </p>
                        <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                            <Button onClick={() => router.push('/resumes')} className="w-full gap-2 sm:w-auto">
                                Go to Resumes
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button variant="secondary" onClick={() => router.push('/resumes')} className="w-full sm:w-auto">
                                Explore Dashboard
                            </Button>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-emerald-300/20 bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.25),transparent_45%),#020617] p-4 shadow-[0_0_60px_rgba(16,185,129,0.15)] sm:p-5"
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card className="border-emerald-300/20">
                                <CardHeader>
                                    <Sparkles className="h-5 w-5 text-emerald-300" />
                                    <CardTitle>AI Generated Drafts</CardTitle>
                                    <CardDescription>Turn raw profile text into structured resumes instantly.</CardDescription>
                                </CardHeader>
                            </Card>
                            <Card className="border-emerald-300/20">
                                <CardHeader>
                                    <Layers3 className="h-5 w-5 text-emerald-300" />
                                    <CardTitle>Flexible Sections</CardTitle>
                                    <CardDescription>Create custom skill groups and only show filled content.</CardDescription>
                                </CardHeader>
                            </Card>
                            <Card className="border-emerald-300/20 md:col-span-2">
                                <CardHeader>
                                    <ShieldCheck className="h-5 w-5 text-emerald-300" />
                                    <CardTitle>Local First + Export Ready</CardTitle>
                                    <CardDescription>Auto-saves drafts in browser and supports clean print-to-PDF output.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0 text-sm text-slate-300">
                                    Landing → Resumes Dashboard → Builder
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                </section>
            </main>
        </div>
    );
}
