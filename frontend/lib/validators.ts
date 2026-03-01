import { z } from "zod";

export const CVDataSchema = z.object({
    full_name: z.string().min(1, "Full name is required"),
    city: z.string().min(1, "City is required"),
    country: z.string().min(1, "Country is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(1, "Phone is required"),
    portfolio_url: z.string().url().optional().or(z.literal("")),
    linkedin_url: z.string().url().optional().or(z.literal("")),
    github_url: z.string().url().optional().or(z.literal("")),
    technical_skills: z.array(
        z.object({
            title: z.string(),
            skills: z.array(z.string()),
        })
    ),
    projects: z.array(z.object({
        title: z.string().min(1),
        start_month: z.string(),
        start_year: z.string(),
        end_month: z.string(),
        end_year: z.string(),
        github_url: z.string().url().optional().or(z.literal("")),
        live_url: z.string().url().optional().or(z.literal("")),
        tech_stack: z.array(z.string()),
        bullets: z.array(z.string()),
    })),
    work_experience: z.array(z.object({
        role: z.string().min(1),
        company: z.string().min(1),
        employment_type: z.string(),
        location: z.string(),
        start_month: z.string(),
        start_year: z.string(),
        end_month: z.string(),
        end_year: z.string(),
        bullets: z.array(z.string()),
    })),
    education: z.array(z.object({
        institution: z.string().min(1),
        degree: z.string().min(1),
        start_year: z.string(),
        end_year: z.string(),
        coursework: z.array(z.string()),
    })),
});

export type CVDataInput = z.infer<typeof CVDataSchema>;
