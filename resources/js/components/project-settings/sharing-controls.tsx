import InputError from '@/components/input-error';
import ImageSelector from '@/components/publish/image-selector';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { CommunityPostImage, Project, ProjectVisibility } from '@/types/models';
import { useForm } from '@inertiajs/react';
import { ExternalLink, Eye } from 'lucide-react';
import { useCallback, type FormEvent } from 'react';
import { toast } from 'sonner';

export interface ProjectSharingSettingsProject extends Project {
    community_post?: {
        description?: string | null;
        images?: CommunityPostImage[];
        title?: string | null;
    } | null;
}

type SharingFormData = {
    title: string;
    description: string;
    visibility: ProjectVisibility;
    images: File[];
    create_template: boolean;
};

export default function SharingControls({ project }: { project: ProjectSharingSettingsProject }) {
    const shareUrl = project.share_token ? route('shared.show', project.share_token) : null;
    const { data, setData, post, errors, processing } = useForm<SharingFormData>(initialSharingData(project));
    const hasSharedVisibility = data.visibility !== 'private';
    const setSharingImages = useCallback(
        (field: 'images', images: File[]) => {
            setData(field, images);
        },
        [setData],
    );

    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        post(route('project.publish', { project: project.id }), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Project visibility updated successfully.'),
            onError: () => toast.error('Error updating project visibility.'),
        });
    }

    return (
        <section className="space-y-6">
            <SharingHeader project={project} shareUrl={shareUrl} />
            <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <Label htmlFor="visibility" className="text-base">
                    Visibility
                </Label>
                <div className="lg:col-span-4">
                    <Select value={data.visibility} onValueChange={(value) => setData('visibility', value as ProjectVisibility)}>
                        <SelectTrigger id="visibility">
                            <SelectValue placeholder="Choose visibility" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="link_only">Link-only</SelectItem>
                            <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError className="mt-2" message={errors.visibility} />
                </div>

                {hasSharedVisibility && (
                    <SharedMetadataFields data={data} setData={setData} setImages={setSharingImages} errors={errors} project={project} />
                )}

                <div className="lg:col-start-5">
                    <Button variant="destructive" className="w-full font-bold" type="submit" disabled={processing}>
                        Save Visibility
                    </Button>
                </div>
            </form>
        </section>
    );
}

function SharingHeader({ project, shareUrl }: { project: ProjectSharingSettingsProject; shareUrl: string | null }) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
                <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                    Sharing <Eye size={20} />
                </h2>
                <p className="text-xs text-muted-foreground">
                    Current state: <span className="font-semibold">{visibilityLabel(project.visibility ?? 'private')}</span>
                </p>
                {shareUrl && <p className="mt-2 max-w-xl truncate text-xs text-muted-foreground">{shareUrl}</p>}
            </div>

            {shareUrl && (
                <Button asChild variant="outline" type="button">
                    <a href={shareUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-4" />
                        Open Shared View
                    </a>
                </Button>
            )}
        </div>
    );
}

function SharedMetadataFields({
    data,
    setData,
    setImages,
    errors,
    project,
}: {
    data: SharingFormData;
    setData: (field: keyof SharingFormData, value: SharingFormData[keyof SharingFormData]) => void;
    setImages: (field: 'images', images: File[]) => void;
    errors: Partial<Record<keyof SharingFormData | `images.${number}`, string>>;
    project: ProjectSharingSettingsProject;
}) {
    return (
        <>
            <Label htmlFor="sharing-title" className="text-base">
                Community Title
            </Label>
            <div className="lg:col-span-4">
                <Input id="sharing-title" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                <InputError className="mt-2" message={errors.title} />
            </div>

            <Label htmlFor="sharing-images" className="text-base">
                Community Images
            </Label>
            <div className="lg:col-span-4">
                <ImageSelector setData={setImages} />
                <ExistingImages images={project.community_post?.images ?? []} />
                <InputError className="mt-2" message={errors.images ?? errors['images.0']} />
            </div>

            <Label htmlFor="sharing-description" className="text-base">
                Community Description
            </Label>
            <div className="lg:col-span-4">
                <Textarea
                    id="sharing-description"
                    className="min-h-40"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                />
                <InputError className="mt-2" message={errors.description} />
            </div>

            <Label htmlFor="create-template" className="text-base">
                Reusable Template
            </Label>
            <div className="flex items-center gap-3 lg:col-span-4">
                <Checkbox
                    id="create-template"
                    checked={data.create_template}
                    onCheckedChange={(checked) => setData('create_template', checked === true)}
                />
                <Label htmlFor="create-template" className="text-sm text-muted-foreground">
                    Create template from this project
                </Label>
                <InputError className="mt-2" message={errors.create_template} />
            </div>
        </>
    );
}

function ExistingImages({ images }: { images: CommunityPostImage[] }) {
    if (images.length === 0) {
        return null;
    }

    return (
        <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-6">
            {images.map((image) => (
                <img key={image.id ?? image.url} src={image.url} alt="" className="aspect-square rounded-md border border-border object-cover" />
            ))}
        </div>
    );
}

function initialSharingData(project: ProjectSharingSettingsProject): SharingFormData {
    return {
        title: project.community_post?.title ?? project.title,
        description: project.community_post?.description ?? '',
        visibility: project.visibility ?? 'private',
        images: [],
        create_template: false,
    };
}

function visibilityLabel(visibility: ProjectVisibility): string {
    return visibility === 'link_only' ? 'Link-only' : visibility.charAt(0).toUpperCase() + visibility.slice(1);
}
