import { Page } from '@/types';

const initialPages: Page[] = [
    {
        id: '1',
        name: 'Introdução',
        sections: [
            {
                id: '1-1',
                name: 'Sobre o Meira',
                blocks: [
                    {
                        id: 'b1',
                        type: 'text',
                        content:
                            'Meira é um sistema de gerenciamento de projetos simples, rápido e intuitivo, com uma interface visual baseada em nós.',
                    },
                    {
                        id: 'b2',
                        type: 'text',
                        content:
                            'Permite organização flexível do fluxo de trabalho através de ferramentas como Traceboard, Kanban, Pinboard, Chat e Sprint Planner.',
                    },
                ],
            },
            {
                id: '1-2',
                name: 'Links Importantes',
                blocks: [
                    {
                        id: 'b3',
                        type: 'text',
                        content: 'Design no Figma: https://www.figma.com/design/3WPWZ4vg8Jhko8WShunbC2/Meira',
                    },
                    {
                        id: 'b4',
                        type: 'text',
                        content: 'Documentação: https://docs.google.com/document/d/1QwLDafesZ4E4QJrc8esA5vFtrIBKsohrbqQj0nNE',
                    },
                    {
                        id: 'b5',
                        type: 'text',
                        content: 'Diagrama Casos de Uso e Diagrama ER disponíveis no GitLab.',
                    },
                ],
            },
        ],
    },

    {
        id: '2',
        name: 'Funcionalidades',
        sections: [
            {
                id: '2-1',
                name: 'Principais Features',
                blocks: [
                    {
                        id: 'b6',
                        type: 'text',
                        content: 'Home e Landing Page, Colaboração em Tempo Real (Reverb), Sistema de Notificações e Perfis/Comunidade.',
                    },
                ],
            },
            {
                id: '2-2',
                name: 'Ferramentas de Projeto',
                blocks: [
                    {
                        id: 'b7',
                        type: 'text',
                        content:
                            'Traceboard: canvas infinito para árvores de tarefas. Kanban: colunas tradicionais. Pinboard: fixar links/anotações.',
                    },
                    {
                        id: 'b8',
                        type: 'text',
                        content: 'Chat de equipe integrado e Sprint Planner para planejamento de sprints.',
                    },
                ],
            },
        ],
    },

    {
        id: '3',
        name: 'Stack Tecnológica',
        sections: [
            {
                id: '3-1',
                name: 'Backend',
                blocks: [{ id: 'b9', type: 'text', content: 'Laravel 12, Laravel Reverb, WorkOS e Laravel Octane com FrankenPHP.' }],
            },
            {
                id: '3-2',
                name: 'Frontend',
                blocks: [
                    {
                        id: 'b10',
                        type: 'text',
                        content: 'Inertia.js + React, Tailwind CSS, shadcn/ui e o sistema de nós com @xyflow/react.',
                    },
                ],
            },
            {
                id: '3-3',
                name: 'Infra',
                blocks: [{ id: 'b11', type: 'text', content: 'Banco Neon PostgreSQL e deploy via Fly.io.' }],
            },
        ],
    },

    {
        id: '4',
        name: 'Instalação',
        sections: [
            {
                id: '4-1',
                name: 'Pré-requisitos',
                blocks: [
                    {
                        id: 'b12',
                        type: 'text',
                        content: 'PHP 8.4+, Composer, Node.js 24+, NPM e um banco (SQLite por padrão).',
                    },
                ],
            },
            {
                id: '4-2',
                name: 'Instalação',
                blocks: [
                    {
                        id: 'b13',
                        type: 'code',
                        language: 'bash',
                        content: `git clone https://gitlab.com/senac-projetos-de-desenvolvimento/2025-marcelo-oscaberry-dos-santos/meira
cd meira
composer install
npm install
cp .env.example .env
php artisan key:generate`,
                    },
                ],
            },
            {
                id: '4-3',
                name: 'Configuração do .env',
                blocks: [
                    {
                        id: 'b14',
                        type: 'text',
                        content: 'Configurar DB_*, WorkOS e Reverb conforme README.',
                    },
                ],
            },
        ],
    },

    {
        id: '5',
        name: 'Ambiente de Dev',
        sections: [
            {
                id: '5-1',
                name: 'Rodando tudo',
                blocks: [
                    {
                        id: 'b15',
                        type: 'code',
                        language: 'bash',
                        content: 'composer run dev:all',
                    },
                ],
            },
            {
                id: '5-2',
                name: 'Serviços Separados',
                blocks: [
                    {
                        id: 'b16',
                        type: 'code',
                        language: 'bash',
                        content: `php artisan reverb:start
php artisan serve
npm run dev
php artisan queue:listen --tries=1`,
                    },
                ],
            },
        ],
    },

    {
        id: '6',
        name: 'Motivação',
        sections: [
            {
                id: '6-1',
                name: 'Por que o Meira existe',
                blocks: [
                    {
                        id: 'b17',
                        type: 'text',
                        content:
                            'Faltam ferramentas simples e práticas para pequenos times e ambientes acadêmicos. Meira busca ser rápido, direto e acessível.',
                    },
                    {
                        id: 'b18',
                        type: 'text',
                        content: 'Outras ferramentas têm UIs confusas, falta de instruções e desempenho ruim — o Meira surgiu para resolver isso.',
                    },
                ],
            },
        ],
    },
];
export default initialPages;
