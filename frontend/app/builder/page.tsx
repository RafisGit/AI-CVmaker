'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CVDataSchema, CVDataInput } from '@/lib/validators';
import TechnicalTemplate from '@/components/cv/TechnicalTemplate';
import { motion, AnimatePresence } from 'framer-motion';

const BuilderPage = () => {
    const [activeTab, setActiveTab] = useState('personal');
    const [previewOpen, setPreviewOpen] = useState(true);

    const {
        register,
        control,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<CVDataInput>({
        resolver: zodResolver(CVDataSchema),
        defaultValues: {
            full_name: '',
            city: '',
            country: '',
            email: '',
            phone: '',
            technical_skills: {
                languages: [],
                frameworks: [],
                tools: [],
                databases: [],
            },
            projects: [],
            work_experience: [],
            education: [],
        },
    });

    const cvData = watch();

    const saveDraft = async (data: CVDataInput) => {
        try {
            const response = await fetch('http://localhost:8000/drafts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: 'draft-1', // Mock ID for now
                    template_id: 'technical-1',
                    data: data,
                }),
            });
            if (response.ok) alert('Draft saved successfully!');
        } catch (error) {
            console.error('Failed to save draft', error);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center no-print">
                <h1 className="text-xl font-bold text-gray-800">CV Architect</h1>
                <div className="flex gap-4">
                    <button
                        onClick={handleSubmit(saveDraft)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
                    >
                        Download PDF
                    </button>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden">
                {/* FORM SIDE */}
                <div className="w-1/2 overflow-y-auto p-8 bg-white border-r form-container no-print">
                    <nav className="flex gap-4 mb-8 border-b">
                        {['personal', 'skills', 'projects', 'experience', 'education'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-2 capitalize ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500'}`}
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
                                    <p className="text-sm text-gray-500 italic">Enter items separated by commas</p>
                                    <TextAreaField
                                        label="Languages"
                                        name="technical_skills.languages"
                                        register={register}
                                        transform={(v: string) => typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : v}
                                    />
                                    <TextAreaField
                                        label="Frameworks / Libraries"
                                        name="technical_skills.frameworks"
                                        register={register}
                                        transform={(v: string) => typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : v}
                                    />
                                    <TextAreaField
                                        label="Tools"
                                        name="technical_skills.tools"
                                        register={register}
                                        transform={(v: string) => typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : v}
                                    />
                                    <TextAreaField
                                        label="Databases"
                                        name="technical_skills.databases"
                                        register={register}
                                        transform={(v: string) => typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : v}
                                    />
                                </motion.div>
                            )}
                            {activeTab === 'projects' && (
                                <ProjectFormSection register={register} control={control} errors={errors} />
                            )}
                            {activeTab === 'experience' && (
                                <ExperienceFormSection register={register} control={control} errors={errors} />
                            )}
                            {activeTab === 'education' && (
                                <EducationFormSection register={register} control={control} errors={errors} />
                            )}
                        </AnimatePresence>
                    </form>
                </div>

                {/* PREVIEW SIDE */}
                <div className="w-1/2 bg-gray-200 overflow-y-auto p-12 flex justify-center preview-container">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="print:transform-none print:w-full print:h-full"
                    >
                        <TechnicalTemplate data={cvData as any} />
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

const ProjectFormSection = ({ register, control, errors }: any) => {
    const { fields, append, remove } = useFieldArray({ control, name: "projects" });
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Projects</h2>
                <button type="button" onClick={() => append({ title: '', start_month: '', start_year: '', end_month: '', end_year: '', tech_stack: [], bullets: [] })} className="text-blue-600 text-sm font-bold">+ Add Project</button>
            </div>
            {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md relative space-y-4">
                    <button type="button" onClick={() => remove(index)} className="absolute top-2 right-2 text-red-500">Remove</button>
                    <InputField label="Project Title" name={`projects.${index}.title`} register={register} />
                    <div className="grid grid-cols-4 gap-2">
                        <InputField label="Start Month" name={`projects.${index}.start_month`} register={register} />
                        <InputField label="Start Year" name={`projects.${index}.start_year`} register={register} />
                        <InputField label="End Month" name={`projects.${index}.end_month`} register={register} />
                        <InputField label="End Year" name={`projects.${index}.end_year`} register={register} />
                    </div>
                    <TextAreaField
                        label="Tech Stack (comma separated)"
                        name={`projects.${index}.tech_stack`}
                        register={register}
                        transform={(v: string) => typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : v}
                    />
                    <TextAreaField
                        label="Bullets (one per line)"
                        name={`projects.${index}.bullets`}
                        register={register}
                        transform={(v: string) => typeof v === 'string' ? v.split('\n').filter(Boolean) : v}
                    />
                </div>
            ))}
        </motion.div>
    );
};

const ExperienceFormSection = ({ register, control, errors }: any) => {
    const { fields, append, remove } = useFieldArray({ control, name: "work_experience" });
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Work Experience</h2>
                <button type="button" onClick={() => append({ role: '', company: '', employment_type: '', location: '', start_month: '', start_year: '', end_month: '', end_year: '', bullets: [] })} className="text-blue-600 text-sm font-bold">+ Add Role</button>
            </div>
            {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md relative space-y-4">
                    <button type="button" onClick={() => remove(index)} className="absolute top-2 right-2 text-red-500">Remove</button>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Role" name={`work_experience.${index}.role`} register={register} />
                        <InputField label="Company" name={`work_experience.${index}.company`} register={register} />
                        <InputField label="Type (e.g. Full-time)" name={`work_experience.${index}.employment_type`} register={register} />
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
                        transform={(v: string) => typeof v === 'string' ? v.split('\n').filter(Boolean) : v}
                    />
                </div>
            ))}
        </motion.div>
    );
};

const EducationFormSection = ({ register, control, errors }: any) => {
    const { fields, append, remove } = useFieldArray({ control, name: "education" });
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Education</h2>
                <button type="button" onClick={() => append({ institution: '', degree: '', start_year: '', end_year: '', coursework: [] })} className="text-blue-600 text-sm font-bold">+ Add Education</button>
            </div>
            {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md relative space-y-4">
                    <button type="button" onClick={() => remove(index)} className="absolute top-2 right-2 text-red-500">Remove</button>
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
                        transform={(v: string) => typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : v}
                    />
                </div>
            ))}
        </motion.div>
    );
};

const InputField = ({ label, name, register, error }: any) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            {...register(name)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
        {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
);

const TextAreaField = ({ label, name, register, error, transform }: any) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <textarea
            {...register(name, { setValueAs: transform })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-20"
        />
        {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
);

export default BuilderPage;
