import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';

const cardData = [
    {
        id: 1,
        title: 'shadcn/ui',
        description: 'Beautifully designed components built with Radix UI and Tailwind CSS.',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop',
    },
    {
        id: 2,
        title: 'Next.js 14',
        description: 'The React framework for production. Built on top of React 18 with server components.',
    },
    {
        id: 3,
        title: 'Tailwind CSS',
        description:
            'A utility-first CSS framework packed with classes that can be composed to build any design, directly in your markup.',
        image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&h=200&fit=crop',
    },
    {
        id: 4,
        title: 'TypeScript',
        description: 'TypeScript is a strongly typed programming language that builds on JavaScript.',
    },
    {
        id: 5,
        title: 'Framer Motion',
        description: 'A production-ready motion library for React. Utilize the power behind Framer, the best prototyping tool for teams.',
        image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop',
    },
    {
        id: 6,
        title: 'React',
        description: 'A JavaScript library for building user interfaces.',
    },
    {
        id: 7,
        title: 'Vercel',
        description: 'Deploy web projects with the best frontend developer experience and highest end-user performance.',
        image: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&h=350&fit=crop',
    },
    {
        id: 8,
        title: 'Radix UI',
        description: 'Unstyled, accessible components for building high‑quality design systems and web apps in React.',
    },
    {
        id: 9,
        title: 'Prisma',
        description: 'Next-generation ORM for Node.js and TypeScript.',
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=280&fit=crop',
    },
    {
        id: 10,
        title: 'Zustand',
        description: 'A small, fast and scalable bearbones state-management solution.',
    },
    {
        id: 11,
        title: 'React Query',
        description: 'Powerful asynchronous state management for TS/JS, React, Solid, Vue and Svelte.',
    },
    {
        id: 12,
        title: 'Supabase',
        description: 'The open source Firebase alternative. Build in a weekend, scale to millions.',
        image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=320&fit=crop',
    },
];

interface SprintTasksModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SprintTasksModal({ open, onOpenChange }: SprintTasksModalProps) {
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <div className="h-[80vh]">
                    <DrawerHeader>
                        <DrawerTitle>Selecione suas tarefas</DrawerTitle>
                        <DrawerDescription>Selecione as tarefas que vão fazer parte da sprint</DrawerDescription>
                    </DrawerHeader>
                    <div className="min-h-screen w-full bg-slate-950 p-8">
                        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                            {cardData.map(card => (
                                <div key={card.id} className="break-inside-avoid mb-4">
                                    <div className="bg-black border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                                        {card.image && (
                                            <img
                                                src={card.image}
                                                alt={card.title}
                                                className="w-full h-auto object-cover"
                                            />
                                        )}
                                        <div className="p-4">
                                            <h3 className="font-bold text-base text-slate-100 mb-2">{card.title}</h3>
                                            <p className="text-sm text-slate-500 leading-relaxed">{card.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DrawerFooter>
                        <Button>Submit</Button>
                        <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

export default SprintTasksModal;
