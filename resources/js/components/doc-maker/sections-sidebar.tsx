import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Section } from '@/types';
import { List } from 'lucide-react';

interface SectionsSidebarProps {
    sections: Section[];
    onAddSection: () => void;
}

export function SectionsSidebar({ sections, onAddSection }: SectionsSidebarProps) {
    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(`section-${sectionId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <aside className="flex h-full w-56 flex-col pt-5">
            <nav className="flex-1 overflow-y-auto p-3">
                <p className="mb-2 flex items-center gap-2 p-1 px-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    <List className="h-4 w-4" />
                    Sections
                </p>
                <ul className="space-y-1">
                    {sections.map((section, index) => (
                        <li key={section.id}>
                            <button
                                onClick={() => scrollToSection(section.id)}
                                className={cn(
                                    'w-full truncate px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:cursor-pointer hover:text-white',
                                    index === 0 && 'border-l-8 border-sidebar-border pl-2 text-white',
                                )}
                            >
                                {section.name}
                            </button>
                        </li>
                    ))}
                </ul>
                <Button
                    variant="link"
                    size="sm"
                    onClick={onAddSection}
                    className="mt-4 w-full cursor-pointer text-muted-foreground hover:text-sidebar-foreground"
                >
                    + Add Section
                </Button>
            </nav>
        </aside>
    );
}
