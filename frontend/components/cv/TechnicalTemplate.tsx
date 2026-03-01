import React from 'react';
import { CVData } from '@/types';

interface TechnicalTemplateProps {
    data: CVData;
}

const cleanText = (value?: string) => value?.trim() ?? '';

const cleanList = (items?: string[]) =>
    (items ?? []).map((item) => item.trim()).filter(Boolean);

const normalizeSkillRows = (technicalSkills: unknown): { label: string; values: string[] }[] => {
    if (Array.isArray(technicalSkills)) {
        return technicalSkills
            .map((category) => {
                const title = cleanText((category as { title?: string })?.title);
                const values = cleanList((category as { skills?: string[] })?.skills);
                return {
                    label: title,
                    values,
                };
            })
            .filter((row) => row.label || row.values.length > 0)
            .map((row) => ({
                label: row.label || 'Skills',
                values: row.values,
            }))
            .filter((row) => row.values.length > 0);
    }

    if (technicalSkills && typeof technicalSkills === 'object') {
        const legacySkills = technicalSkills as {
            languages?: string[];
            frameworks?: string[];
            tools?: string[];
            databases?: string[];
        };

        return [
            { label: 'Languages', values: cleanList(legacySkills.languages) },
            { label: 'Frameworks/Libraries', values: cleanList(legacySkills.frameworks) },
            { label: 'Tools', values: cleanList(legacySkills.tools) },
            { label: 'Databases', values: cleanList(legacySkills.databases) },
        ].filter((row) => row.values.length > 0);
    }

    return [];
};

const formatDateRange = (startMonth?: string, startYear?: string, endMonth?: string, endYear?: string) => {
    const start = [cleanText(startMonth), cleanText(startYear)].filter(Boolean).join(' ');
    const end = [cleanText(endMonth), cleanText(endYear)].filter(Boolean).join(' ');

    if (start && end) return `${start} – ${end}`;
    return start || end || '';
};

const TechnicalTemplate: React.FC<TechnicalTemplateProps> = ({ data }) => {
    const fullName = cleanText(data.full_name);
    const location = [cleanText(data.city), cleanText(data.country)].filter(Boolean).join(', ');
    const email = cleanText(data.email);
    const phone = cleanText(data.phone);
    const portfolioUrl = cleanText(data.portfolio_url);
    const linkedinUrl = cleanText(data.linkedin_url);
    const githubUrl = cleanText(data.github_url);

    const skillRows = normalizeSkillRows(data.technical_skills);

    const projects = data.projects
        .map((project) => {
            const title = cleanText(project.title);
            const github = cleanText(project.github_url);
            const live = cleanText(project.live_url);
            const dateRange = formatDateRange(project.start_month, project.start_year, project.end_month, project.end_year);
            const techStack = cleanList(project.tech_stack);
            const bullets = cleanList(project.bullets);

            return {
                title,
                github,
                live,
                dateRange,
                techStack,
                bullets,
                hasContent: Boolean(title || github || live || dateRange || techStack.length || bullets.length),
            };
        })
        .filter((project) => project.hasContent);

    const experiences = data.work_experience
        .map((experience) => {
            const role = cleanText(experience.role);
            const company = cleanText(experience.company);
            const employmentType = cleanText(experience.employment_type);
            const locationText = cleanText(experience.location);
            const start = [cleanText(experience.start_month), cleanText(experience.start_year)].filter(Boolean).join(' ');
            const isPresent = cleanText(experience.end_month).toLowerCase() === 'present';
            const end = isPresent
                ? 'Present'
                : [cleanText(experience.end_month), cleanText(experience.end_year)].filter(Boolean).join(' ');
            const dateRange = start && end ? `${start} – ${end}` : start || end || '';
            const bullets = cleanList(experience.bullets);

            return {
                role,
                company,
                employmentType,
                locationText,
                dateRange,
                bullets,
                hasContent: Boolean(role || company || employmentType || locationText || dateRange || bullets.length),
            };
        })
        .filter((experience) => experience.hasContent);

    const educationEntries = data.education
        .map((education) => {
            const institution = cleanText(education.institution);
            const degree = cleanText(education.degree);
            const dateRange = [cleanText(education.start_year), cleanText(education.end_year)].filter(Boolean).join(' – ');
            const coursework = cleanList(education.coursework);

            return {
                institution,
                degree,
                dateRange,
                coursework,
                hasContent: Boolean(institution || degree || dateRange || coursework.length),
            };
        })
        .filter((education) => education.hasContent);

    const headerItems = [
        location,
        email,
        phone,
        portfolioUrl ? 'Portfolio' : '',
        linkedinUrl ? 'LinkedIn' : '',
        githubUrl ? 'GitHub' : '',
    ].filter(Boolean);

    const hasHeader = Boolean(fullName || headerItems.length > 0);

    return (
        <div className="mx-auto min-h-[11.69in] w-[8.27in] shrink-0 bg-white p-[0.75in] text-[10pt] font-sans leading-tight text-gray-900 shadow-lg overflow-hidden print:min-h-0 print:h-full print:w-full print:shadow-none">
            {hasHeader && (
                <header className="mb-4 text-center">
                    {fullName && <h1 className="text-3xl font-bold uppercase tracking-tight">{fullName}</h1>}

                    {headerItems.length > 0 && (
                        <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-[9pt]">
                            {location && <span>{location}</span>}
                            {email && (
                                <>
                                    {(location || phone || portfolioUrl || linkedinUrl || githubUrl) && <span className="text-gray-400">|</span>}
                                    <a href={`mailto:${email}`} className="hover:underline">{email}</a>
                                </>
                            )}
                            {phone && (
                                <>
                                    {(location || email) && <span className="text-gray-400">|</span>}
                                    <span>{phone}</span>
                                </>
                            )}
                            {portfolioUrl && (
                                <>
                                    {(location || email || phone) && <span className="text-gray-400">|</span>}
                                    <a href={portfolioUrl} target="_blank" rel="noreferrer" className="hover:underline">Portfolio</a>
                                </>
                            )}
                            {linkedinUrl && (
                                <>
                                    {(location || email || phone || portfolioUrl) && <span className="text-gray-400">|</span>}
                                    <a href={linkedinUrl} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a>
                                </>
                            )}
                            {githubUrl && (
                                <>
                                    {(location || email || phone || portfolioUrl || linkedinUrl) && <span className="text-gray-400">|</span>}
                                    <a href={githubUrl} target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>
                                </>
                            )}
                        </div>
                    )}

                    <hr className="mt-2 border-t border-gray-900" />
                </header>
            )}

            {skillRows.length > 0 && (
                <section className="mb-4">
                    <h2 className="mb-2 border-b border-gray-300 text-[11pt] font-bold uppercase">Technical Skill</h2>
                    <div className="space-y-1">
                        {skillRows.map((row) => (
                            <div key={row.label}>
                                <span className="font-bold">{row.label}:</span> {row.values.join(', ')}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {projects.length > 0 && (
                <section className="mb-4">
                    <h2 className="mb-2 border-b border-gray-300 text-[11pt] font-bold uppercase">Projects</h2>
                    <div className="space-y-4">
                        {projects.map((project, idx) => (
                            <div key={idx}>
                                {(project.title || project.github || project.live || project.dateRange) && (
                                    <div className="flex items-baseline justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            {project.title && <span className="font-bold">{project.title}</span>}
                                            {(project.github || project.live) && (
                                                <span className="text-[8pt] text-gray-600">
                                                    (
                                                    {project.github && (
                                                        <a href={project.github} className="mx-1 hover:underline" target="_blank" rel="noreferrer">GitHub</a>
                                                    )}
                                                    {project.github && project.live && '|'}
                                                    {project.live && (
                                                        <a href={project.live} className="mx-1 hover:underline" target="_blank" rel="noreferrer">Live</a>
                                                    )}
                                                    )
                                                </span>
                                            )}
                                        </div>
                                        {project.dateRange && <span className="text-sm font-medium">{project.dateRange}</span>}
                                    </div>
                                )}

                                {project.techStack.length > 0 && (
                                    <div className="mb-1 text-[9pt] italic text-gray-700">{project.techStack.join(', ')}</div>
                                )}

                                {project.bullets.length > 0 && (
                                    <ul className="ml-1 list-none space-y-0.5">
                                        {project.bullets.map((bullet, bulletIndex) => (
                                            <li key={bulletIndex} className="flex gap-2">
                                                <span className="text-gray-800">✓</span>
                                                <span className="flex-1">{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {experiences.length > 0 && (
                <section className="mb-4">
                    <h2 className="mb-2 border-b border-gray-300 text-[11pt] font-bold uppercase">Work Experience</h2>
                    <div className="space-y-4">
                        {experiences.map((experience, idx) => (
                            <div key={idx}>
                                {(experience.role || experience.company || experience.dateRange) && (
                                    <div className="flex items-baseline justify-between gap-3">
                                        <div>
                                            {experience.role && <span className="font-bold">{experience.role}</span>}
                                            {experience.role && experience.company && <span className="mx-1">|</span>}
                                            {experience.company && <span>{experience.company}</span>}
                                        </div>
                                        {experience.dateRange && <span className="text-sm font-medium">{experience.dateRange}</span>}
                                    </div>
                                )}

                                {(experience.locationText || experience.employmentType) && (
                                    <div className="mb-1 text-[9pt] text-gray-600">
                                        {experience.locationText}
                                        {experience.locationText && experience.employmentType && ' '}
                                        {experience.employmentType && `(${experience.employmentType})`}
                                    </div>
                                )}

                                {experience.bullets.length > 0 && (
                                    <ul className="ml-1 list-none space-y-0.5">
                                        {experience.bullets.map((bullet, bulletIndex) => (
                                            <li key={bulletIndex} className="flex gap-2">
                                                <span className="text-gray-800">✓</span>
                                                <span className="flex-1">{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {educationEntries.length > 0 && (
                <section className="mb-4">
                    <h2 className="mb-2 border-b border-gray-300 text-[11pt] font-bold uppercase">Education</h2>
                    <div className="space-y-3">
                        {educationEntries.map((education, idx) => (
                            <div key={idx}>
                                {(education.institution || education.degree || education.dateRange) && (
                                    <div className="flex items-baseline justify-between gap-3">
                                        <div>
                                            {education.institution && <span className="font-bold">{education.institution}</span>}
                                            {education.institution && education.degree && <span className="mx-1">|</span>}
                                            {education.degree && <span>{education.degree}</span>}
                                        </div>
                                        {education.dateRange && <span className="text-sm font-medium">{education.dateRange}</span>}
                                    </div>
                                )}

                                {education.coursework.length > 0 && (
                                    <div className="mt-1">
                                        <span className="font-bold">Relevant Coursework:</span> {education.coursework.join(', ')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default TechnicalTemplate;
