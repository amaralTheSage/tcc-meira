import FeedPostCard, { FeedPostInterface } from '@/components/community/feed-post-card';
import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Toaster } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Feed',
        href: route('community.index'),
    },
];

const testData: FeedPostInterface[] = [
    {
        img: 'https://picsum.photos/600/400?random=1',
        title: '5ª SAJIC',
        description:
            'Plataforma desenvolvida para a Semana Acadêmica de Jornalismo e Inovação Científica 2025. Sed tempus sagittis lacus eget blandit. Morbi ut hendrerit tellus. Aliquam eget posuere ipsum, a viverra lectus. Aliquam erat volutpat. Mauris luctus justo vel felis auctor faucibus. Ut sollicitudin massa eget interdum ornare. ',
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

export default function Feed() {
    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <Head title="Community" />

            <div className="mt-20 mb-8 space-y-4">
                <h2 className="font-cardo text-4xl font-medium tracking-tight">Community Projects</h2>
                <nav className="space-x-4">
                    <span className="text-2xl underline">Everyone</span>
                    <span className="text-2xl text-gray-400">Friends</span>
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
