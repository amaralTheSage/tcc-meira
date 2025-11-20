import { FeedPostInterface } from '@/components/community/feed-post-card';
import Gallery from '@/components/community/gallery';
import UserTemplateList from '@/components/community/user-templates-list';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import { capitalizeFirstLetter } from '@/lib/utils';
import { BreadcrumbItem, User } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Toaster } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Feed',
        href: route('community.feed'),
    },
];

const testData: FeedPostInterface[] = [
    {
        img: 'https://picsum.photos/600/400?random=1',
        title: '5ª SAJIC',
        description:
            'Dando continuidade ao trabalho iniciado em 2024, colaborei com colegas no desenvolvimento da nova plataforma da SAJIC 2025, com o objetivo de expandir significativamente as funcionalidades do site anterior e solucionar limitações críticas observadas na última edição. \n\nEm 2024, o sistema era puramente front-end, sem nenhuma estrutura interna de gerenciamento. Todas as tarefas organizacionais — como check-ins, controle de palestras e distribuição de salas — eram feitas manualmente, utilizando planilhas impressas. Sem um controle centralizado de salas ou horários, os organizadores precisavam ajustar constantemente a programação na tentativa de encaixar atividades em espaços e horários disponíveis. Ao fim do evento, a própria comissão organizadora (da qual participei e pude entender de perto as frustrações) relatou a ineficiência no processo. \n\nPara 2025, desenvolvemos uma solução completa e integrada. A nova plataforma conta com um painel administrativo para cadastro de palestrantes e palestras, controle de check-ins e emissão automática de certificados. Os alunos podem se inscrever e cancelar inscrições em palestras e gerar seus certificados diretamente pelo sistema. Além disso, há gerenciamento de salas e horários com verificação de conflitos, autenticação de usuários com confirmação por e-mail e envio automatizado de certificados.',
        size: 'L',
    },
    {
        img: 'https://picsum.photos/600/400?random=2',
        title: '4ª SAJIC',
        description:
            'Projeto colaborativo da edição anterior do evento, focado em inovação tecnológica e acadêmica. Sed tempus sagittis lacus eget blandit. Morbi ut hendrerit tellus. Aliquam eget posuere ipsum, a viverra lectus. Aliquam erat volutpat. Mauris luctus justo vel felis auctor faucibus. Ut sollicitudin massa eget interdum ornare. ',
        size: 'S',
    },
    {
        img: 'https://picsum.photos/600/400?random=3',
        title: 'Coisa Imóveis',
        description:
            'Plataforma de busca de imóveis criada para simular listagens de casas e apartamentos. Sed tempus sagittis lacus eget blandit. Morbi ut hendrerit tellus. Aliquam eget posuere ipsum, a viverra lectus. Aliquam erat volutpat. Mauris luctus justo vel felis auctor faucibus. Ut sollicitudin massa eget interdum ornare. ',
        size: 'S',
    },
    {
        img: 'https://picsum.photos/600/400?random=4',
        title: 'MEIRA',
        description:
            'Ferramenta de gerenciamento de projetos simplificada para equipes acadêmicas e startups. Sed tempus sagittis lacus eget blandit. Morbi ut hendrerit tellus. Aliquam eget posuere ipsum, a viverra lectus. Aliquam erat volutpat. Mauris luctus justo vel felis auctor faucibus. Ut sollicitudin massa eget interdum ornare. ',
        size: 'S',
    },
    {
        img: 'https://picsum.photos/600/400?random=5',
        title: 'Portfólio Acadêmico',
        description:
            'Aplicação criada para exibir projetos e colaborações realizados em 2025. Sed tempus sagittis lacus eget blandit. Morbi ut hendrerit tellus. Aliquam eget posuere ipsum, a viverra lectus. Aliquam erat volutpat. Mauris luctus justo vel felis auctor faucibus. Ut sollicitudin massa eget interdum ornare. ',
        size: 'L',
    },
    {
        img: 'https://picsum.photos/600/400?random=6',
        title: 'Demo Imobiliária',
        description:
            'Exemplo de listagem de propriedades com interface intuitiva e responsiva. Sed tempus sagittis lacus eget blandit. Morbi ut hendrerit tellus. Aliquam eget posuere ipsum, a viverra lectus. Aliquam erat volutpat. Mauris luctus justo vel felis auctor faucibus. Ut sollicitudin massa eget interdum ornare. ',
        size: 'S',
    },
    {
        img: 'https://picsum.photos/600/400?random=2',
        title: '4ª SAJIC',
        description:
            'Projeto colaborativo da edição anterior do evento, focado em inovação tecnológica e acadêmica. Sed tempus sagittis lacus eget blandit. Morbi ut hendrerit tellus. Aliquam eget posuere ipsum, a viverra lectus. Aliquam erat volutpat. Mauris luctus justo vel felis auctor faucibus. Ut sollicitudin massa eget interdum ornare. ',
        size: 'L',
    },
    {
        img: 'https://picsum.photos/600/400?random=10',
        title: 'Coisa Imóveis',
        description:
            'Plataforma de busca de imóveis criada para simular listagens de casas e apartamentos. Sed tempus sagittis lacus eget blandit. Morbi ut hendrerit tellus. Aliquam eget posuere ipsum, a viverra lectus. Aliquam erat volutpat. Mauris luctus justo vel felis auctor faucibus. Ut sollicitudin massa eget interdum ornare. ',
        size: 'S',
    },
    {
        img: 'https://picsum.photos/600/400?random=9',
        title: 'MEIRA',
        description:
            'Ferramenta de gerenciamento de projetos simplificada para equipes acadêmicas e startups. Sed tempus sagittis lacus eget blandit. Morbi ut hendrerit tellus. Aliquam eget posuere ipsum, a viverra lectus. Aliquam erat volutpat. Mauris luctus justo vel felis auctor faucibus. Ut sollicitudin massa eget interdum ornare. ',
        size: 'L',
    },
    {
        img: 'https://picsum.photos/600/400?random=7',
        title: 'MEIRA',
        description:
            'Ferramenta de gerenciamento de projetos simplificada para equipes acadêmicas e startups. Sed tempus sagittis lacus eget blandit. Morbi ut hendrerit tellus. Aliquam eget posuere ipsum, a viverra lectus. Aliquam erat volutpat. Mauris luctus justo vel felis auctor faucibus. Ut sollicitudin massa eget interdum ornare. ',
        size: 'L',
    },
];

export default function Profile({ user }: { user: User }) {
    const getInitials = useInitials();

    const templates = [
        {
            id: 1,
            name: 'Projeto de Desenvolvimento 1',
            user: user,
        },
        {
            id: 2,
            name: 'Projeto de Desenvolvimento 2',
            user: user,
        },
        {
            id: 3,
            name: 'Software de Agendamento de Quadras de Padel',
            user: user,
        },
    ];

    const [section, setSection] = useState<'gallery' | 'templates'>('gallery');

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <Head title="Community" />

            <ul className="grid grid-cols-4 gap-4 px-4">
                <div className="col-span-3 mt-24 mb-8 space-y-6">
                    <h2 className="font-cardo text-4xl font-medium">{capitalizeFirstLetter(section)}</h2>
                    <hr className="mt-3 border-[1.5px] border-muted-foreground" />

                    <div className="flex gap-4 text-muted-foreground underline-offset-4">
                        <li
                            onClick={() => setSection('gallery')}
                            className={` ${section === 'gallery' ? 'text-white' : 'hover:cursor-pointer hover:text-gray-200 hover:underline'}`}
                        >
                            Gallery
                        </li>

                        <li
                            onClick={() => setSection('templates')}
                            className={` ${section === 'templates' ? 'text-white' : 'hover:cursor-pointer hover:text-gray-200 hover:underline'}`}
                        >
                            Templates
                        </li>
                    </div>
                </div>

                <div className="row-span-2 flex flex-col items-center justify-center space-y-2">
                    <Avatar className="h-28 w-28 overflow-hidden rounded-full">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="rounded-lg bg-neutral-200 text-5xl text-black dark:bg-neutral-700 dark:text-white">
                            {getInitials(user.name)}
                        </AvatarFallback>
                    </Avatar>

                    <h3 className="font-cardo mt-4 text-3xl font-semibold">{user.name}</h3>
                    <p>2 friends</p>

                    <Button variant={'secondary'} size={'lg'} className="mt-7 w-4/5">
                        <Plus />
                        Add Friend
                    </Button>
                </div>

                {section === 'gallery' ? <Gallery projects={testData} /> : <UserTemplateList templates={templates} />}
            </ul>

            <Toaster />
        </AppLayoutTemplate>
    );
}
