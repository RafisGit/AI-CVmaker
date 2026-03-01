'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, CheckCircle2, CircleDashed, Eye, FileText, Loader2, Save, Send, Sparkles, X } from 'lucide-react';

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
type BuilderTab = (typeof tabs)[number];

const hasText = (value?: string) => Boolean(value?.trim());
const hasListValues = (items?: string[]) => (items ?? []).some((item) => Boolean(item?.trim()));

const normalizeTechnicalSkills = (technicalSkills: any): { title: string; skills: string[] }[] => {
    if (Array.isArray(technicalSkills)) {
        return technicalSkills
            .map((category) => ({
                title: typeof category?.title === 'string' ? category.title : '',
                skills: Array.isArray(category?.skills)
                    ? category.skills.map((skill: unknown) => String(skill).trim()).filter(Boolean)
                    : [],
            }))
            .filter((category) => category.title.trim() || category.skills.length > 0);
    }

    if (technicalSkills && typeof technicalSkills === 'object') {
        const legacyMap: Array<{ key: string; label: string }> = [
            { key: 'languages', label: 'Languages' },
            { key: 'frameworks', label: 'Frameworks/Libraries' },
            { key: 'tools', label: 'Tools' },
            { key: 'databases', label: 'Databases' },
        ];

        return legacyMap
            .map(({ key, label }) => {
                const values = Array.isArray((technicalSkills as Record<string, unknown>)[key])
                    ? ((technicalSkills as Record<string, unknown>)[key] as unknown[])
                          .map((skill) => String(skill).trim())
                          .filter(Boolean)
                    : [];

                return {
                    title: label,
                    skills: values,
                };
            })
            .filter((category) => category.skills.length > 0);
    }

    return [];
};

const normalizeCvDataForForm = (data: any): CVDataInput => ({
    ...createEmptyCV(),
    ...data,
    technical_skills: normalizeTechnicalSkills(data?.technical_skills),
});

const BuilderPage = () => {
    const router = useRouter();
    const [draftId, setDraftId] = useState<string | null>(null);
    const [source, setSource] = useState<'manual' | 'ai'>('manual');

    const [activeTab, setActiveTab] = useState<BuilderTab>('personal');
    const [chatOpen, setChatOpen] = useState(source === 'ai');
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [mobilePane, setMobilePane] = useState<'form' | 'preview'>('form');
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
    const previousCompletionRef = useRef<Record<BuilderTab, boolean> | null>(null);

    const completionByTab = useMemo<Record<BuilderTab, boolean>>(() => {
        const personalComplete = hasText(cvData.full_name) && (hasText(cvData.email) || hasText(cvData.phone));
        const skillsComplete = (cvData.technical_skills ?? []).some(
            (category) => hasText(category.title) || hasListValues(category.skills)
        );
        const projectsComplete = (cvData.projects ?? []).some((project) =>
            hasText(project.title) || hasListValues(project.tech_stack) || hasListValues(project.bullets)
        );
        const experienceComplete = (cvData.work_experience ?? []).some((experience) =>
            hasText(experience.role) || hasText(experience.company) || hasListValues(experience.bullets)
        );
        const educationComplete = (cvData.education ?? []).some((education) =>
            hasText(education.institution) || hasText(education.degree) || hasListValues(education.coursework)
        );

        return {
            personal: personalComplete,
            skills: skillsComplete,
            projects: projectsComplete,
            experience: experienceComplete,
            education: educationComplete,
        };
    }, [cvData]);

    const completedSections = useMemo(
        () => tabs.filter((tab) => completionByTab[tab]).length,
        [completionByTab]
    );

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
            router.replace('/resumes');
            return;
        }
        const draft = getDraftById(draftId);
        if (!draft) {
            router.replace('/resumes');
            return;
        }
        reset(normalizeCvDataForForm(draft.data));
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

    useEffect(() => {
        const previousCompletion = previousCompletionRef.current;

        if (previousCompletion && !previousCompletion[activeTab] && completionByTab[activeTab]) {
            const currentIndex = tabs.indexOf(activeTab);
            const nextIncomplete = tabs.slice(currentIndex + 1).find((tab) => !completionByTab[tab]);

            if (nextIncomplete) {
                setActiveTab(nextIncomplete);
            }
        }

        previousCompletionRef.current = completionByTab;
    }, [activeTab, completionByTab]);

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
                reset(normalizeCvDataForForm(payload.data));
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
        <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_25%_8%,rgba(16,185,129,0.2),transparent_30%),linear-gradient(to_bottom,#020617,#020617)]" />
            <header className="no-print flex flex-col gap-4 border-b border-slate-800 bg-slate-950/90 px-4 py-4 backdrop-blur-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white">CV Architect</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{heading}</Badge>
                        <Badge variant="outline">Auto-saving to local storage</Badge>
                    </div>
                </div>

                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto lg:grid-cols-none lg:flex">
                    <Button variant="secondary" onClick={() => router.push('/resumes')} className="w-full lg:w-auto">Back to Resumes</Button>
                    <Button onClick={handleSubmit(saveDraft)} className="w-full gap-2 lg:w-auto">
                        <Save className="h-4 w-4" />
                        Save Draft
                    </Button>
                    <Button variant="secondary" onClick={() => window.print()} className="w-full lg:w-auto">Download PDF</Button>
                </div>
            </header>

            <main className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
                <div className="no-print border-b border-slate-800 px-4 py-3 lg:hidden">
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-900 p-1">
                        <button
                            onClick={() => setMobilePane('form')}
                            className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${mobilePane === 'form' ? 'bg-emerald-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
                        >
                            <FileText className="h-4 w-4" />
                            Form
                        </button>
                        <button
                            onClick={() => setMobilePane('preview')}
                            className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${mobilePane === 'preview' ? 'bg-emerald-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
                        >
                            <Eye className="h-4 w-4" />
                            Preview
                        </button>
                    </div>
                </div>

                <div className={`form-container no-print min-h-0 w-full overflow-y-auto border-b border-slate-800 bg-slate-950/75 p-4 sm:p-6 lg:w-1/2 lg:border-b-0 lg:border-r lg:p-8 ${mobilePane === 'form' ? 'block' : 'hidden lg:block'}`}>
                    <nav className="mb-6 border-b border-slate-800 pb-2 sm:mb-8">
                        <div className="mb-2 flex gap-4 overflow-x-auto whitespace-nowrap">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center gap-1 pb-2 capitalize transition ${activeTab === tab ? 'border-b-2 border-emerald-400 font-bold text-emerald-300' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                <span>{tab}</span>
                                {completionByTab[tab] ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                    <CircleDashed className="h-3.5 w-3.5 text-slate-400" />
                                )}
                            </button>
                        ))}
                        </div>
                        <Badge variant="outline" className="text-xs">
                            {completedSections}/{tabs.length} complete
                        </Badge>
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
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                            {activeTab === 'skills' && <SkillsFormSection register={register} control={control} />}

                            {activeTab === 'projects' && <ProjectFormSection register={register} control={control} />}
                            {activeTab === 'experience' && <ExperienceFormSection register={register} control={control} />}
                            {activeTab === 'education' && <EducationFormSection register={register} control={control} />}
                        </AnimatePresence>
                    </form>
                </div>

                <div className={`preview-container min-h-0 w-full justify-center overflow-x-auto overflow-y-auto bg-slate-900 p-4 sm:p-6 lg:flex lg:w-1/2 lg:p-12 ${mobilePane === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="print:transform-none print:h-full print:w-full"
                    >
                        <TechnicalTemplate data={cvData as any} />
                    </motion.div>
                </div>
            </main>

            <div className="no-print fixed bottom-4 right-4 z-30 sm:bottom-5 sm:right-5">
                <Button
                    onClick={() => setChatOpen((prev) => !prev)}
                    className="gap-2 rounded-full px-4 shadow-xl sm:px-5"
                    variant={chatOpen ? 'secondary' : 'default'}
                >
                    <Bot className="h-4 w-4" />
                    <span className="hidden sm:inline">{chatOpen ? 'Hide AI Assistant' : 'AI Assistant'}</span>
                </Button>
            </div>

            <AnimatePresence>
                {chatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        className="no-print fixed inset-x-2 bottom-16 z-30 max-h-[75vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl sm:bottom-20 sm:left-1/2 sm:inset-x-auto sm:w-[min(920px,92vw)] sm:-translate-x-1/2"
                    >
                        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                                <Sparkles className="h-4 w-4 text-emerald-300" />
                                Resume AI Copilot
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="hidden sm:flex">Edits your CV directly</Badge>
                                <Button size="icon" variant="ghost" onClick={() => setChatOpen(false)} className="h-8 w-8">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="max-h-[45vh] space-y-3 overflow-y-auto px-4 py-3 sm:max-h-56">
                            {messages.map((message, index) => (
                                <div
                                    key={`${message.role}-${index}`}
                                    className={`rounded-lg px-3 py-2 text-sm ${message.role === 'assistant' ? 'bg-slate-800 text-slate-100' : 'bg-emerald-400 text-slate-950'}`}
                                >
                                    {message.content}
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col items-stretch gap-2 border-t border-slate-800 bg-slate-900 p-3 sm:flex-row sm:items-center">
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
                            <Button onClick={onSendChat} disabled={chatLoading} className="w-full gap-2 sm:w-auto">
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

const SkillsFormSection = ({ register, control }: any) => {
    const { fields, append, remove } = useFieldArray({ control, name: 'technical_skills' });

    return (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} key="skills" className="space-y-6">
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <h2 className="text-lg font-bold">Technical Skills</h2>
                <button
                    type="button"
                    onClick={() => append({ title: '', skills: [] })}
                    className="text-sm font-bold text-blue-600"
                >
                    + Add Skill Set
                </button>
            </div>

            <p className="text-sm italic text-slate-500">
                Create your own categories. Examples: “Languages → JavaScript, TypeScript” or “Cloud → Azure, Docker”.
            </p>

            {fields.length === 0 && (
                <div className="rounded-md border border-dashed border-slate-700 bg-slate-900 p-4 text-sm text-slate-400">
                    No skill set added yet. Click + Add Skill Set.
                </div>
            )}

            {fields.map((field: any, index: number) => (
                <div key={field.id} className="relative space-y-4 rounded-md border border-slate-700 p-4">
                    <button type="button" onClick={() => remove(index)} className="absolute right-2 top-2 text-red-500">
                        Remove
                    </button>
                    <InputField
                        label="Skill Set Title"
                        name={`technical_skills.${index}.title`}
                        register={register}
                        placeholder="e.g. Languages"
                    />
                    <TextAreaField
                        label="Skills (comma separated)"
                        name={`technical_skills.${index}.skills`}
                        register={register}
                        transform={(v: string) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v)}
                        placeholder="e.g. JavaScript, TypeScript, Python"
                    />
                </div>
            ))}
        </motion.div>
    );
};

const ProjectFormSection = ({ register, control }: any) => {
    const { fields, append, remove } = useFieldArray({ control, name: 'projects' });
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
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
                <div key={field.id} className="relative space-y-4 rounded-md border border-slate-700 p-4">
                    <button type="button" onClick={() => remove(index)} className="absolute right-2 top-2 text-red-500">
                        Remove
                    </button>
                    <InputField label="Project Title" name={`projects.${index}.title`} register={register} />
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
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
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
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
                <div key={field.id} className="relative space-y-4 rounded-md border border-slate-700 p-4">
                    <button type="button" onClick={() => remove(index)} className="absolute right-2 top-2 text-red-500">
                        Remove
                    </button>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <InputField label="Role" name={`work_experience.${index}.role`} register={register} />
                        <InputField label="Company" name={`work_experience.${index}.company`} register={register} />
                        <InputField label="Type" name={`work_experience.${index}.employment_type`} register={register} />
                        <InputField label="Location" name={`work_experience.${index}.location`} register={register} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
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
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
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
                <div key={field.id} className="relative space-y-4 rounded-md border border-slate-700 p-4">
                    <button type="button" onClick={() => remove(index)} className="absolute right-2 top-2 text-red-500">
                        Remove
                    </button>
                    <InputField label="Institution" name={`education.${index}.institution`} register={register} />
                    <InputField label="Degree" name={`education.${index}.degree`} register={register} />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

const InputField = ({ label, name, register, error, placeholder }: any) => (
    <div>
        <label className="block text-sm font-medium text-slate-300">{label}</label>
        <Input {...register(name)} className="mt-1" placeholder={placeholder} />
        {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
);

const TextAreaField = ({ label, name, register, error, transform, placeholder }: any) => (
    <div>
        <label className="block text-sm font-medium text-slate-300">{label}</label>
        <Textarea {...register(name, { setValueAs: transform })} className="mt-1 h-24" placeholder={placeholder} />
        {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
);

export default BuilderPage;
