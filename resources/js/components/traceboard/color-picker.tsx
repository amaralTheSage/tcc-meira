import type React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Color from 'color';
import { PipetteIcon } from 'lucide-react';
import { type ComponentProps, createContext, type HTMLAttributes, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

interface ColorPickerContextValue {
    hue: number;
    saturation: number;
    lightness: number;
    alpha: number;
    setHue: (hue: number) => void;
    setSaturation: (saturation: number) => void;
    setLightness: (lightness: number) => void;
    setAlpha: (alpha: number) => void;
}

const ColorPickerContext = createContext<ColorPickerContextValue | undefined>(undefined);

export const useColorPicker = () => {
    const context = useContext(ColorPickerContext);
    if (!context) {
        throw new Error('useColorPicker must be used within a ColorPickerProvider');
    }
    return context;
};

export type ColorPickerProps = HTMLAttributes<HTMLDivElement> & {
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
};

export const ColorPicker = ({ value, defaultValue = '#000000', onChange, className, ...props }: ColorPickerProps) => {
    const selectedColor = value ? Color(value) : Color(defaultValue);
    const defaultColor = Color(defaultValue);

    const [hue, setHue] = useState(selectedColor.hue() || defaultColor.hue() || 0);
    const [saturation, setSaturation] = useState(selectedColor.saturationl() || defaultColor.saturationl() || 100);
    const [lightness, setLightness] = useState(selectedColor.lightness() || defaultColor.lightness() || 50);
    const [alpha, setAlpha] = useState(selectedColor.alpha() * 100 || defaultColor.alpha() * 100);

    // Update internal state when controlled value changes
    useEffect(() => {
        if (value) {
            try {
                const color = Color(value);
                setHue(color.hue() || 0);
                setSaturation(color.saturationl() || 100);
                setLightness(color.lightness() || 50);
                setAlpha(color.alpha() * 100);
            } catch (e) {
                // Invalid color, ignore
            }
        }
    }, [value]);

    // Notify parent of color changes
    useEffect(() => {
        const color = Color.hsl(hue, saturation, lightness).alpha(alpha / 100);
        onChange?.(color.hex());
    }, [hue, saturation, lightness, alpha, onChange]);

    const contextValue = useMemo(
        () => ({
            hue,
            saturation,
            lightness,
            alpha,
            setHue,
            setSaturation,
            setLightness,
            setAlpha,
        }),
        [hue, saturation, lightness, alpha],
    );

    return (
        <ColorPickerContext.Provider value={contextValue}>
            <div className={cn('flex flex-col gap-3', className)} {...props}>
                {props.children}
            </div>
        </ColorPickerContext.Provider>
    );
};

export const ColorPickerSelection = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
    const { hue, saturation, lightness, setSaturation, setLightness } = useColorPicker();
    const selectionRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const updateColor = useCallback(
        (e: React.MouseEvent | MouseEvent) => {
            if (!selectionRef.current) return;

            const rect = selectionRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

            const newSaturation = (x / rect.width) * 100;
            const newLightness = 100 - (y / rect.height) * 100;

            setSaturation(newSaturation);
            setLightness(newLightness);
        },
        [setSaturation, setLightness],
    );

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        updateColor(e);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                updateColor(e);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, updateColor]);

    return (
        <div
            ref={selectionRef}
            className={cn('relative h-40 w-full cursor-crosshair rounded-md', className)}
            style={{
                background: `linear-gradient(to top, #000, transparent),
                     linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`,
            }}
            onMouseDown={handleMouseDown}
            {...props}
        >
            <div
                className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
                style={{
                    left: `${saturation}%`,
                    top: `${100 - lightness}%`,
                    backgroundColor: Color.hsl(hue, saturation, lightness).hex(),
                }}
            />
        </div>
    );
};

export const ColorPickerHue = ({ className, ...props }: ComponentProps<'input'>) => {
    const { hue, setHue } = useColorPicker();

    return (
        <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
            className={cn(
                'h-3 w-full cursor-pointer appearance-none rounded-md',
                '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md',
                '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md',
                className,
            )}
            style={{
                background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
            }}
            {...props}
        />
    );
};

export const ColorPickerAlpha = ({ className, ...props }: ComponentProps<'input'>) => {
    const { hue, saturation, lightness, alpha, setAlpha } = useColorPicker();
    const color = Color.hsl(hue, saturation, lightness);

    return (
        <input
            type="range"
            min="0"
            max="100"
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
            className={cn(
                'h-3 w-full cursor-pointer appearance-none rounded-md',
                '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md',
                '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md',
                className,
            )}
            style={{
                background: `linear-gradient(to right, transparent, ${color.hex()})`,
                backgroundSize: '100% 100%',
                backgroundImage: `
          linear-gradient(to right, transparent, ${color.hex()}),
          linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc),
          linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)
        `,
                backgroundSize: '100% 100%, 10px 10px, 10px 10px',
                backgroundPosition: '0 0, 0 0, 5px 5px',
            }}
            {...props}
        />
    );
};

export const ColorPickerOutput = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
    const { hue, saturation, lightness, alpha } = useColorPicker();
    const color = Color.hsl(hue, saturation, lightness).alpha(alpha / 100);

    return <Input type="text" value={color.hex()} readOnly className={cn('font-mono text-sm', className)} {...props} />;
};

export const ColorPickerEyeDropper = ({ className, ...props }: ComponentProps<typeof Button>) => {
    const { setHue, setSaturation, setLightness, setAlpha } = useColorPicker();

    const handleEyeDropper = async () => {
        if (!('EyeDropper' in window)) {
            alert('EyeDropper API is not supported in your browser');
            return;
        }

        try {
            // @ts-ignore - EyeDropper API is not yet in TypeScript types
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();
            const color = Color(result.sRGBHex);

            setHue(color.hue() || 0);
            setSaturation(color.saturationl());
            setLightness(color.lightness());
            setAlpha(color.alpha() * 100);
        } catch (e) {
            // User cancelled
        }
    };

    return (
        <Button type="button" variant="outline" size="icon" onClick={handleEyeDropper} className={cn('shrink-0', className)} {...props}>
            <PipetteIcon className="h-4 w-4" />
        </Button>
    );
};
