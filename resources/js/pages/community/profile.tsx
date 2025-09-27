import FeedPostCard, { FeedPostInterface } from '@/components/community/feed-post-card';
import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import { BreadcrumbItem } from '@/types';
import { Project } from '@/types/models';
import { Head } from '@inertiajs/react';
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
];

export default function Profile({ projects }: { projects: Project }) {
    console.log(projects);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <Head title="Community" />

            <div className="mt-20 mb-8 space-y-4">
                <h2 className="font-cardo text-4xl font-medium tracking-tight">profile</h2>
                <nav className="space-x-4">
                    <span className="cursor-pointer text-2xl underline">Everyone</span>
                    <span className="text-gray-400m cursor-pointer text-2xl">Friends</span>
                </nav>
            </div>

            <ul className="grid grid-cols-4 gap-4">
                {testData.map((post) => {
                    return <FeedPostCard post={post} />;
                })}
            </ul>

            <Toaster />
        </AppLayoutTemplate>
    );
}
