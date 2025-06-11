import { formatDate } from '@/lib/utils';
import { Project } from '@/types/models';
import { Link } from '@inertiajs/react';

export default function IntersectionProjectCard({ project }: { project: Project }) {
    return (
        <li key={project.id} className="mb-2">
            <Link
                href={route('traceboard', { project: project.id })}
                className="flex w-full items-center justify-between rounded-md border border-[#e3e3e0] bg-white p-2 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
            >
                <div>
                    <h3>{project.title}</h3>
                    <p>última atualização: {formatDate(project.updated_at)}</p>
                </div>

                <img src={'/lorenzo.png'} alt={project.title} className="mt-2 h-12 w-12 rounded-md" />
            </Link>
        </li>
    );
}
