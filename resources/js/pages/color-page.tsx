'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';

// Color data extracted from your CSS file
const colorData = {
    basic: [
        { name: 'background', light: 'oklch(1 0 0)', dark: 'oklch(0.145 0 0)' },
        { name: 'foreground', light: 'oklch(0.145 0 0)', dark: 'oklch(0.985 0 0)' },
        { name: 'card', light: 'oklch(1 0 0)', dark: 'oklch(0.145 0 0)' },
        { name: 'card-foreground', light: 'oklch(0.145 0 0)', dark: 'oklch(0.985 0 0)' },
        { name: 'popover', light: 'oklch(1 0 0)', dark: 'oklch(0.145 0 0)' },
        { name: 'popover-foreground', light: 'oklch(0.145 0 0)', dark: 'oklch(0.985 0 0)' },
        { name: 'primary', light: 'oklch(0.205 0 0)', dark: 'oklch(0.985 0 0)' },
        { name: 'primary-foreground', light: 'oklch(0.985 0 0)', dark: 'oklch(0.205 0 0)' },
        { name: 'secondary', light: 'oklch(0.97 0 0)', dark: 'oklch(0.269 0 0)' },
        { name: 'secondary-foreground', light: 'oklch(0.205 0 0)', dark: 'oklch(0.985 0 0)' },
        { name: 'muted', light: 'oklch(0.97 0 0)', dark: 'oklch(0.269 0 0)' },
        { name: 'muted-foreground', light: 'oklch(0.556 0 0)', dark: 'oklch(0.708 0 0)' },
        { name: 'accent', light: 'oklch(0.97 0 0)', dark: 'oklch(0.269 0 0)' },
        { name: 'accent-foreground', light: 'oklch(0.205 0 0)', dark: 'oklch(0.985 0 0)' },
        { name: 'destructive', light: 'oklch(0.577 0.245 27.325)', dark: 'oklch(0.396 0.141 25.723)' },
        { name: 'destructive-foreground', light: 'oklch(0.577 0.245 27.325)', dark: 'oklch(0.637 0.237 25.331)' },
        { name: 'border', light: 'oklch(0.922 0 0)', dark: 'oklch(0.269 0 0)' },
        { name: 'input', light: 'oklch(0.922 0 0)', dark: 'oklch(0.269 0 0)' },
        { name: 'ring', light: 'oklch(0.87 0 0)', dark: 'oklch(0.439 0 0)' },
    ],
    chart: [
        { name: 'chart-1', light: 'oklch(0.646 0.222 41.116)', dark: 'oklch(0.488 0.243 264.376)' },
        { name: 'chart-2', light: 'oklch(0.6 0.118 184.704)', dark: 'oklch(0.696 0.17 162.48)' },
        { name: 'chart-3', light: 'oklch(0.398 0.07 227.392)', dark: 'oklch(0.769 0.188 70.08)' },
        { name: 'chart-4', light: 'oklch(0.828 0.189 84.429)', dark: 'oklch(0.627 0.265 303.9)' },
        { name: 'chart-5', light: 'oklch(0.769 0.188 70.08)', dark: 'oklch(0.645 0.246 16.439)' },
    ],
    sidebar: [
        { name: 'sidebar', light: 'oklch(0.985 0 0)', dark: 'oklch(0.205 0 0)' },
        { name: 'sidebar-foreground', light: 'oklch(0.145 0 0)', dark: 'oklch(0.985 0 0)' },
        { name: 'sidebar-primary', light: 'oklch(0.205 0 0)', dark: 'oklch(0.985 0 0)' },
        { name: 'sidebar-primary-foreground', light: 'oklch(0.985 0 0)', dark: 'oklch(0.985 0 0)' },
        { name: 'sidebar-accent', light: 'oklch(0.97 0 0)', dark: 'oklch(0.269 0 0)' },
        { name: 'sidebar-accent-foreground', light: 'oklch(0.205 0 0)', dark: 'oklch(0.985 0 0)' },
        { name: 'sidebar-border', light: 'oklch(0.922 0 0)', dark: 'oklch(0.269 0 0)' },
        { name: 'sidebar-ring', light: 'oklch(0.87 0 0)', dark: 'oklch(0.439 0 0)' },
    ],
};

interface ColorSquareProps {
    name: string;
    lightColor: string;
    darkColor: string;
}

function ColorSquare({ name, lightColor, darkColor }: ColorSquareProps) {
    return (
        <div className="flex items-center gap-4 rounded-lg border p-3">
            <div className="flex gap-2">
                <div className="flex flex-col items-center gap-1">
                    <div className="h-12 w-12 rounded border-2 border-gray-300" style={{ backgroundColor: lightColor }} />
                    <Sun className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="flex flex-col items-center gap-1">
                    <div className="h-12 w-12 rounded border-2 border-gray-300" style={{ backgroundColor: darkColor }} />
                    <Moon className="h-4 w-4 text-blue-500" />
                </div>
            </div>
            <div className="flex-1">
                <div className="font-mono text-sm font-semibold">--{name}</div>
                <div className="mt-1 text-xs text-gray-600">
                    <div>Light: {lightColor}</div>
                    <div>Dark: {darkColor}</div>
                </div>
            </div>
        </div>
    );
}

export default function ColorPage() {
    const [activeTab, setActiveTab] = useState<'basic' | 'chart' | 'sidebar'>('basic');

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">CSS Color Variables Demonstration</CardTitle>
                    <p className="text-gray-600">
                        Your color system uses OKLCH color space with {colorData.basic.length + colorData.chart.length + colorData.sidebar.length}{' '}
                        total variables
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 flex gap-2">
                        <Button variant={activeTab === 'basic' ? 'default' : 'outline'} onClick={() => setActiveTab('basic')}>
                            Basic Colors ({colorData.basic.length})
                        </Button>
                        <Button variant={activeTab === 'chart' ? 'default' : 'outline'} onClick={() => setActiveTab('chart')}>
                            Chart Colors ({colorData.chart.length})
                        </Button>
                        <Button variant={activeTab === 'sidebar' ? 'default' : 'outline'} onClick={() => setActiveTab('sidebar')}>
                            Sidebar Colors ({colorData.sidebar.length})
                        </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                        {colorData[activeTab].map((color) => (
                            <ColorSquare key={color.name} name={color.name} lightColor={color.light} darkColor={color.dark} />
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Color System Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 text-sm md:grid-cols-3">
                        <div>
                            <h4 className="mb-2 font-semibold">Basic Colors</h4>
                            <p className="text-gray-600">Core semantic colors for backgrounds, text, buttons, and UI elements</p>
                        </div>
                        <div>
                            <h4 className="mb-2 font-semibold">Chart Colors</h4>
                            <p className="text-gray-600">Specialized colors for data visualization and charts</p>
                        </div>
                        <div>
                            <h4 className="mb-2 font-semibold">Sidebar Colors</h4>
                            <p className="text-gray-600">Dedicated colors for sidebar components and navigation</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
