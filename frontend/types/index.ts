export interface SkillCategory {
    title: string;
    skills: string[];
}

export interface Project {
    title: string;
    start_month: string;
    start_year: string;
    end_month: string;
    end_year: string;
    github_url?: string;
    live_url?: string;
    tech_stack: string[];
    bullets: string[];
}

export interface WorkExperience {
    role: string;
    company: string;
    employment_type: string;
    location: string;
    start_month: string;
    start_year: string;
    end_month: string | "Present";
    end_year: string | "Present";
    bullets: string[];
}

export interface Education {
    institution: string;
    degree: string;
    start_year: string;
    end_year: string;
    coursework: string[];
}

export interface CVData {
    full_name: string;
    city: string;
    country: string;
    email: string;
    phone: string;
    portfolio_url?: string;
    linkedin_url?: string;
    github_url?: string;
    technical_skills: SkillCategory[];
    projects: Project[];
    work_experience: WorkExperience[];
    education: Education[];
}

export interface CVDraft {
    id: string;
    template_id: string;
    last_modified: string;
    data: CVData;
}
