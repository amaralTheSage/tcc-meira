type InertiaPageModule = { default: unknown };
type InertiaPageModuleLoader = () => Promise<InertiaPageModule>;

export type InertiaPageModules = Record<string, InertiaPageModuleLoader>;

export const inertiaPageModules: InertiaPageModules = import.meta.glob<InertiaPageModule>(['./pages/**/*.tsx', '!./pages/**/*.test.tsx']);
