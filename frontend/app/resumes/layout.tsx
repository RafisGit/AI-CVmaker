import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Resume Dashboard',
};

export default function ResumesLayout({ children }: { children: React.ReactNode }) {
    return children;
}
