import { CVData } from '@/types';

export const createEmptyCV = (): CVData => ({
    full_name: '',
    city: '',
    country: '',
    email: '',
    phone: '',
    portfolio_url: '',
    linkedin_url: '',
    github_url: '',
    technical_skills: [],
    projects: [],
    work_experience: [],
    education: [],
});
