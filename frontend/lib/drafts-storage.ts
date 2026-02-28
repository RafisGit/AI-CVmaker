import { CVData } from '@/types';

const STORAGE_KEY = 'ai-cv-maker:drafts:v1';

export interface LocalDraft {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    data: CVData;
}

const hasWindow = () => typeof window !== 'undefined';

export const getDrafts = (): LocalDraft[] => {
    if (!hasWindow()) return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as LocalDraft[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const saveDrafts = (drafts: LocalDraft[]) => {
    if (!hasWindow()) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
};

export const createDraft = (data: CVData, title?: string): LocalDraft => {
    const now = new Date().toISOString();
    return {
        id: crypto.randomUUID(),
        title: title?.trim() || data.full_name?.trim() || 'Untitled Resume',
        createdAt: now,
        updatedAt: now,
        data,
    };
};

export const upsertDraft = (draft: LocalDraft) => {
    const drafts = getDrafts();
    const existingIndex = drafts.findIndex((item) => item.id === draft.id);

    const normalized: LocalDraft = {
        ...draft,
        title: draft.title?.trim() || draft.data.full_name?.trim() || 'Untitled Resume',
        updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
        drafts[existingIndex] = normalized;
    } else {
        drafts.unshift(normalized);
    }

    saveDrafts(drafts);
    return normalized;
};

export const getDraftById = (id: string) => getDrafts().find((draft) => draft.id === id);

export const deleteDraft = (id: string) => {
    const drafts = getDrafts().filter((draft) => draft.id !== id);
    saveDrafts(drafts);
};
