import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SettingsLayout from '@/layouts/settings/layout';

import AvatarPicker from '@/components/user-settings/avatar-picker';
import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import { Toaster } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

type ProfileForm = {
    avatar: File;
    name: string;
    email: string;
};

export default function Profile() {
    const { auth } = usePage<SharedData>().props;

    const { data, setData, patch, post, errors, processing, recentlySuccessful } = useForm<Required<ProfileForm>>({
        avatar: auth.user.avatar || null,
        name: auth.user.name,
        email: auth.user.email,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        router.post(
            route('profile.update'),
            {
                ...data,
                _method: 'PATCH',
            },
            {
                preserveScroll: true,
                forceFormData: true,
            },
        );
    };

    useEffect(() => {
        console.log(data);
    }, [data]);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Profile information" description="Update your avatar, name and email address" />

                    <form onSubmit={submit} className="mt-10 space-y-6">
                        <div className="grid gap-2">
                            <AvatarPicker setData={setData} />
                            <p className="mx-auto text-sm text-muted-foreground">Change your profile picture</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>

                            <Input
                                id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                autoComplete="name"
                                placeholder="Full name"
                            />

                            <InputError className="mt-2" message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>

                            <Input
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={data.email}
                                required
                                autoComplete="username"
                                disabled
                            />

                            <InputError className="mt-2" message={errors.email} />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Save</Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Saved</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                <DeleteUser />
            </SettingsLayout>
            <Toaster />
        </AppLayoutTemplate>
    );
}
