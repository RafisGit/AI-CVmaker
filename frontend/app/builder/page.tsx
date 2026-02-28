'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Loader2, Save, Send, Sparkles } from 'lucide-react';

import { CVDataInput, CVDataSchema } from '@/lib/validators';
import TechnicalTemplate from '@/components/cv/TechnicalTemplate';
import { createEmptyCV } from '@/lib/cv-defaults';
import { getDraftById, upsertDraft } from '@/lib/drafts-storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type ChatRole = 'assistant' | 'user';

interface ChatMessage {
    role: ChatRole;
    content: string;
}

const tabs = ['personal', 'skills', 'projects', 'experience', 'education'] as const;

const BuilderPage = () => {
    const router = useRouter();
    const [draftId, setDraftId] = useState<string | null>(null);
    const [source, setSource] = useState<'manual' | 'ai'>('manual');

    const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('personal');
    const [chatOpen, setChatOpen] = useState(source === 'ai');
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: 'Hi! I can improve your resume bullets, rewrite sections, or tailor this CV for a specific role. Tell me what to change.',
        },
    ]);

    const {
        register,
        control,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<CVDataInput>({
        resolver: zodResolver(CVDataSchema),
        defaultValues: createEmptyCV(),
    });

    const cvData = watch();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const src = params.get('source') === 'ai' ? 'ai' : 'manual';
        setDraftId(id);
        setSource(src);
    }, []);

    useEffect(() => {
        if (draftId === null) return;
        if (!draftId) {
            router.replace('/');
            return;
        }
        const draft = getDraftById(draftId);
        if (!draft) {
            router.replace('/');
            return;
        }
        reset(draft.data);
    }, [draftId, reset, router]);

    useEffect(() => {
        if (!draftId) return;
        const timeoutId = setTimeout(() => {
            upsertDraft({
                id: draftId,
                title: cvData.full_name?.trim() ? `${cvData.full_name} Resume` : 'Untitled Resume',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                data: cvData,
            });
        }, 350);

        return () => clearTimeout(timeoutId);
    }, [cvData, draftId]);

    const saveDraft = async (data: CVDataInput) => {
        if (!draftId) return;
        upsertDraft({
            id: draftId,
            title: data.full_name?.trim() ? `${data.full_name} Resume` : 'Untitled Resume',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data,
        });
        alert('Saved to local storage');
    };

    const onSendChat = async () => {
        if (!chatInput.trim() || chatLoading) return;

        const userMessage = chatInput.trim();
        setChatInput('');
        setChatLoading(true);
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instruction: userMessage, cvData }),
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || 'AI assistant request failed.');
            }

            if (payload?.data) {
                reset(payload.data);
            }

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: payload?.assistantMessage || 'Updated your resume successfully.',
                },
            ]);
        } catch (error: any) {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: error?.message || 'Something went wrong while applying AI changes.' },
            ]);
        } finally {
            setChatLoading(false);
        }
    };

    const heading = useMemo(() => (source === 'ai' ? 'AI Builder' : 'Manual Builder'), [source]);

    return (
        <div className="flex h-screen flex-col bg-slate-50">
            <header className="no-print flex items-center justify-between border-b bg-white px-6 py-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">CV Architect</h1>
                    <div className="mt-1 flex items-center gap-2">
                        <Badge variant="secondary">{heading}</Badge>
                        <Badge variant="outline">Auto-saving to local storage</Badge>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => router.push('/')}>Back to Home</Button>
                    <Button onClick={handleSubmit(saveDraft)} className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Draft
                    </Button>
                    <Button variant="secondary" onClick={() => window.print()}>Download PDF</Button>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden">
                <div className="form-container no-print w-1/2 overflow-y-auto border-r bg-white p-8">
                    <nav className="mb-8 flex gap-4 border-b">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-2 capitalize transition ${activeTab === tab ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-slate-500'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>

                    <form className="space-y-6">
                        <AnimatePresence mode="wait">
                            {activeTab === 'personal' && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    key="personal"
                                    className="space-y-4"
                                >
                                    <h2 className="text-lg font-bold">Personal Information</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Full Name" name="full_name" register={register} error={errors.full_name?.message} />
                                        <InputField label="Email" name="email" register={register} error={errors.email?.message} />
                                        <InputField label="Phone" name="phone" register={register} error={errors.phone?.message} />
                                        <InputField label="City" name="city" register={register} error={errors.city?.message} />
                                        <InputField label="Country" name="country" register={register} error={errors.country?.message} />
                                        <InputField label="Portfolio URL" name="portfolio_url" register={register} />
                                        <InputField label="LinkedIn URL" name="linkedin_url" register={register} />
                                        <InputField label="GitHub URL" name="github_url" register={register} />
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'skills' && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    key="skills"
                                    className="space-y-6"
                                >
                                    <h2 className="text-lg font-bold">Technical Skills</h2>
                                    <p className="text-sm italic text-slate-500">Enter items separated by commas</p>
                                    <TextAreaField
                                        label="Languages"
                                        name="technical_skills.languages"
                                        register={register}
                                        transform={(v: string) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v)}
                                    />
                                    <TextAreaField
                                        label="Frameworks / Libraries"
                                        name="technical_skills.frameworks"
                                        register={register}
                                        transform={(v: string) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v)}
                                    />
                                    <TextAreaField
                                        label="Tools"
                                        name="technical_skills.tools"
                                        register={register}
                                        transform={(v: string) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v)}
                                    />
                                    <TextAreaField
                                        label="Databases"
                                        name="technical_skills.databases"
                                        register={register}
                                        transform={(v: string) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v)}
                                    />
                                </motion.div>
                            )}

                            {activeTab === 'projects' && <ProjectFormSection register={register} control={control} />}
                            {activeTab === 'experience' && <ExperienceFormSection register={register} control={control} />}
                            {activeTab === 'education' && <EducationFormSection register={register} control={control} />}
                        </AnimatePresence>
                    </form>
                </div>

                <div className="preview-container flex w-1/2 justify-center overflow-y-auto bg-slate-200 p-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="print:transform-none print:h-full print:w-full"
                    >
                        <TechnicalTemplate data={cvData as any} />
                    </motion.div>
                </div>
            </main>

            <div className="no-print fixed bottom-5 right-5 z-30">
                <Button
                    onClick={() => setChatOpen((prev) => !prev)}
                    className="gap-2 rounded-full px-5 shadow-xl"
                    variant={chatOpen ? 'secondary' : 'default'}
                >
                    <Bot className="h-4 w-4" />
                    {chatOpen ? 'Hide AI Assistant' : 'AI Assistant'}
                </Button>
            </div>

            <AnimatePresence>
                {chatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        className="no-print fixed bottom-20 left-1/2 z-30 w-[min(920px,92vw)] -translate-x-1/2 rounded-xl border border-slate-200 bg-white shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <Sparkles className="h-4 w-4 text-blue-600" />
                                Resume AI Copilot
                            </div>
                            <Badge variant="outline">Edits your CV directly</Badge>
                        </div>

                        <div className="max-h-56 space-y-3 overflow-y-auto px-4 py-3">
                            {messages.map((message, index) => (
                                <div
                                    key={`${message.role}-${index}`}
                                    className={`rounded-lg px-3 py-2 text-sm ${message.role === 'assistant' ? 'bg-slate-100 text-slate-800' : 'bg-blue-600 text-white'}`}
                                >
                                    {message.content}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 border-t p-3">
                            <Input
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        onSendChat();
                                    }
                                }}
                                placeholder="Ask AI: improve project bullets for frontend role, tighten summary, add measurable impact..."
                            />
                            <Button onClick={onSendChat} disabled={chatLoading} className="gap-2">
                                {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Send
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ProjectFormSection = ({ register, control }: any) => {
    const { fields, append, remove } = useFieldArray({ control, name: 'projects' });
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Projects</h2>
                <button
                    type="button"
                    onClick={() =>
                        append({
                            title: '',
                            start_month: '',
                            start_year: '',
                            end_month: '',
                            end_year: '',
                            github_url: '',
                            live_url: '',
                            tech_stack: [],
                            bullets: [],
                        })
                    }
                    className="text-sm font-bold text-blue-600"
                >
                    + Add Project
                </button>
            </div>
            {fields.map((field: any, index: number) => (
                <div key={field.id} className="relative space-y-4 rounded-md border p-4">
                    <button type="button" onClick={() => remove(index)} className="absolute right-2 top-2 text-red-500">
                        Remove
                    </button>
                    <InputField label="Project Title" name={`projects.${index}.title`} register={register} />
                    <div className="grid grid-cols-4 gap-2">
                        <InputField label="Start Month" name={`projects.${index}.start_month`} register={register} />
                        <InputField label="Start Year" name={`projects.${index}.start_year`} register={register} />
                        <InputField label="End Month" name={`projects.${index}.end_month`} register={register} />
                        <InputField label="End Year" name={`projects.${index}.end_year`} register={register} />
                    </div>
                    <InputField label="GitHub URL" name={`projects.${index}.github_url`} register={register} />
                    <InputField label="Live URL" name={`projects.${index}.live_url`} register={register} />
                    <TextAreaField
                        label="Tech Stack (comma separated)"
                        name={`projects.${index}.tech_stack`}
                        register={register}
                        transform={(v: string) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v)}
                    />
                    <TextAreaField
                        label="Bullets (one per line)"
                        name={`projects.${index}.bullets`}
                        register={register}
                        transform={(v: string) => (typeof v === 'string' ? v.split('\n').map((s) => s.trim()).filter(Boolean) : v)}
                    />
                </div>
            ))}
        </motion.div>
    );
};

const ExperienceFormSection = ({ register, control }: any) => {
    const { fields, append, remove } = useFieldArray({ control, name: 'work_experience' });
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Work Experience</h2>
                <button
                    type="button"
                    onClick={() =>
                        append({
                            role: '',
                            company: '',
                            employment_type: '',
                            location: '',
                            start_month: '',
                            start_year: '',
                            end_month: '',
                            end_year: '',
                            bullets: [],
                        })
                    }
                    className="text-sm font-bold text-blue-600"
                >
                    + Add Role
                </button>
            </div>
            {fields.map((field: any, index: number) => (
                <div key={field.id} className="relative space-y-4 rounded-md border p-4">
                    <button type="button" onClick={() => remove(index)} className="absolute right-2 top-2 text-red-500">
                        Remove
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Role" name={`work_experience.${index}.role`} register={register} />
                        <InputField label="Company" name={`work_experience.${index}.company`} register={register} />
                        <InputField label="Type" name={`work_experience.${index}.employment_type`} register={register} />
                        <InputField label="Location" name={`work_experience.${index}.location`} register={register} />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        <InputField label="Start Month" name={`work_experience.${index}.start_month`} register={register} />
                        <InputField label="Start Year" name={`work_experience.${index}.start_year`} register={register} />
                        <InputField label="End Month" name={`work_experience.${index}.end_month`} register={register} />
                        <InputField label="End Year" name={`work_experience.${index}.end_year`} register={register} />
                    </div>
                    <TextAreaField
                        label="Bullets (one per line)"
                        name={`work_experience.${index}.bullets`}
                        register={register}
                        transform={(v: string) => (typeof v === 'string' ? v.split('\n').map((s) => s.trim()).filter(Boolean) : v)}
                    />
                </div>
            ))}
        </motion.div>
    );
};

const EducationFormSection = ({ register, control }: any) => {
    const { fields, append, remove } = useFieldArray({ control, name: 'education' });
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Education</h2>
                <button
                    type="button"
                    onClick={() => append({ institution: '', degree: '', start_year: '', end_year: '', coursework: [] })}
                    className="text-sm font-bold text-blue-600"
                >
                    + Add Education
                </button>
            </div>
            {fields.map((field: any, index: number) => (
                <div key={field.id} className="relative space-y-4 rounded-md border p-4">
                    <button type="button" onClick={() => remove(index)} className="absolute right-2 top-2 text-red-500">
                        Remove
                    </button>
                    <InputField label="Institution" name={`education.${index}.institution`} register={register} />
                    <InputField label="Degree" name={`education.${index}.degree`} register={register} />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Start Year" name={`education.${index}.start_year`} register={register} />
                        <InputField label="End Year" name={`education.${index}.end_year`} register={register} />
                    </div>
                    <TextAreaField
                        label="Relevant Coursework (comma separated)"
                        name={`education.${index}.coursework`}
                        register={register}
                        transform={(v: string) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v)}
                    />
                </div>
            ))}
        </motion.div>
    );
};

const InputField = ({ label, name, register, error }: any) => (
    <div>
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        <Input {...register(name)} className="mt-1" />
        {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
);

const TextAreaField = ({ label, name, register, error, transform }: any) => (
    <div>
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        <Textarea {...register(name, { setValueAs: transform })} className="mt-1 h-24" />
        {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
);

export default BuilderPage;
