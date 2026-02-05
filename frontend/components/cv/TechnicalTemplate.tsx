import React from 'react';
import { CVData } from '@/types';

interface TechnicalTemplateProps {
    data: CVData;
}

const TechnicalTemplate: React.FC<TechnicalTemplateProps> = ({ data }) => {
    return (
        <div className="bg-white p-[0.75in] w-[8.27in] min-h-[11.69in] print:min-h-0 print:h-full print:w-full mx-auto text-[10pt] font-sans leading-tight text-gray-900 shadow-lg print:shadow-none overflow-hidden">
            {/* HEADER */}
            <header className="text-center mb-4">
                <h1 className="text-3xl font-bold uppercase tracking-tight">{data.full_name}</h1>
                <div className="flex justify-center flex-wrap items-center gap-2 mt-1 text-[9pt]">
                    <span>{data.city}, {data.country}</span>
                    <span className="text-gray-400">|</span>
                    <a href={`mailto:${data.email}`} className="hover:underline">{data.email}</a>
                    <span className="text-gray-400">|</span>
                    <span>{data.phone}</span>
                    {data.portfolio_url && (
                        <>
                            <span className="text-gray-400">|</span>
                            <a href={data.portfolio_url} target="_blank" className="hover:underline">Portfolio</a>
                        </>
                    )}
                    {data.linkedin_url && (
                        <>
                            <span className="text-gray-400">|</span>
                            <a href={data.linkedin_url} target="_blank" className="hover:underline">LinkedIn</a>
                        </>
                    )}
                    {data.github_url && (
                        <>
                            <span className="text-gray-400">|</span>
                            <a href={data.github_url} target="_blank" className="hover:underline">GitHub</a>
                        </>
                    )}
                </div>
                <hr className="border-t border-gray-900 mt-2" />
            </header>

            {/* TECHNICAL SKILLS */}
            <section className="mb-4">
                <h2 className="text-[11pt] font-bold uppercase border-b border-gray-300 mb-2">Technical Skill</h2>
                <div className="space-y-1">
                    <div>
                        <span className="font-bold">Languages:</span> {data.technical_skills.languages.join(', ')}
                    </div>
                    <div>
                        <span className="font-bold">Frameworks/Libraries:</span> {data.technical_skills.frameworks.join(', ')}
                    </div>
                    <div>
                        <span className="font-bold">Tools:</span> {data.technical_skills.tools.join(', ')}
                    </div>
                    <div>
                        <span className="font-bold">Databases:</span> {data.technical_skills.databases.join(', ')}
                    </div>
                </div>
            </section>

            {/* PROJECTS */}
            <section className="mb-4">
                <h2 className="text-[11pt] font-bold uppercase border-b border-gray-300 mb-2">Projects</h2>
                <div className="space-y-4">
                    {data.projects.map((project, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between items-baseline">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">{project.title}</span>
                                    {(project.github_url || project.live_url) && (
                                        <span className="text-[8pt] text-gray-600">
                                            (
                                            {project.github_url && <a href={project.github_url} className="hover:underline mx-1">GitHub</a>}
                                            {project.github_url && project.live_url && "|"}
                                            {project.live_url && <a href={project.live_url} className="hover:underline mx-1">Live</a>}
                                            )
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm font-medium">
                                    {project.start_month} {project.start_year} – {project.end_month} {project.end_year}
                                </span>
                            </div>
                            <div className="italic text-gray-700 text-[9pt] mb-1">
                                {project.tech_stack.join(', ')}
                            </div>
                            <ul className="list-none space-y-0.5 ml-1">
                                {project.bullets.map((bullet, bIdx) => (
                                    <li key={bIdx} className="flex gap-2">
                                        <span className="text-gray-800">✓</span>
                                        <span className="flex-1">{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* WORK EXPERIENCE */}
            <section className="mb-4">
                <h2 className="text-[11pt] font-bold uppercase border-b border-gray-300 mb-2">Work Experience</h2>
                <div className="space-y-4">
                    {data.work_experience.map((exp, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between items-baseline">
                                <div>
                                    <span className="font-bold">{exp.role}</span>
                                    <span className="mx-1">|</span>
                                    <span>{exp.company}</span>
                                </div>
                                <span className="text-sm font-medium">
                                    {exp.start_month} {exp.start_year} – {exp.end_month !== 'Present' ? `${exp.end_month} ${exp.end_year}` : 'Present'}
                                </span>
                            </div>
                            <div className="text-[9pt] text-gray-600 mb-1">
                                {exp.location} ({exp.employment_type})
                            </div>
                            <ul className="list-none space-y-0.5 ml-1">
                                {exp.bullets.map((bullet, bIdx) => (
                                    <li key={bIdx} className="flex gap-2">
                                        <span className="text-gray-800">✓</span>
                                        <span className="flex-1">{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* EDUCATION */}
            <section className="mb-4">
                <h2 className="text-[11pt] font-bold uppercase border-b border-gray-300 mb-2">Education</h2>
                <div className="space-y-3">
                    {data.education.map((edu, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between items-baseline">
                                <div>
                                    <span className="font-bold">{edu.institution}</span>
                                    <span className="mx-1">|</span>
                                    <span>{edu.degree}</span>
                                </div>
                                <span className="text-sm font-medium">
                                    {edu.start_year} – {edu.end_year}
                                </span>
                            </div>
                            <div className="mt-1">
                                <span className="font-bold">Relevant Coursework:</span> {edu.coursework.join(', ')}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default TechnicalTemplate;
