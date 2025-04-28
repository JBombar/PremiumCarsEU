// src/app/inventory/components/AiSearchForm.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Search, Sparkles } from "lucide-react";

interface AiSearchFormProps {
    input: string;
    setInput: (value: string) => void;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    loading: boolean;
    error: string | null;
    t: (key: string, values?: Record<string, any>) => string;
}

export function AiSearchForm({
    input,
    setInput,
    onSubmit,
    loading,
    error,
    t
}: AiSearchFormProps) {
    return (
        <div className="py-6 mb-6">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-medium mb-4 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-primary" /> {t('aiSearch.title')}
                </h2>
                <form onSubmit={onSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t('aiSearch.placeholder')}
                            className="pl-10 w-full"
                            disabled={loading}
                        />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? t('aiSearch.buttonLoading') : t('aiSearch.buttonIdle')}
                    </Button>
                </form>
                {error && (
                    <div className="mt-2 text-sm text-red-500 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" /> {error}
                    </div>
                )}
            </div>
        </div>
    );
}