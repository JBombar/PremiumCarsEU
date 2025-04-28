// src/app/inventory/hooks/useMakesAndModels.ts
import { useState, useEffect } from 'react';
import type { CarMake, CarModel } from '../types';

interface UseMakesAndModelsReturn {
    makes: CarMake[];
    availableModels: CarModel[];
    makesLoading: boolean;
    modelsLoading: boolean;
}

export function useMakesAndModels(
    selectedMakeName: string // Pass the currently selected make NAME from UI filters
): UseMakesAndModelsReturn {
    const [makes, setMakes] = useState<CarMake[]>([]);
    const [availableModels, setAvailableModels] = useState<CarModel[]>([]);
    const [makesLoading, setMakesLoading] = useState(true); // Start true for initial make fetch
    const [modelsLoading, setModelsLoading] = useState(false);

    // Effect to fetch all makes once on mount
    useEffect(() => {
        let isMounted = true;
        setMakesLoading(true);
        console.log("useMakesAndModels: Fetching makes...");
        fetch('/api/car-makes')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch makes');
                return res.json();
            })
            .then((data: CarMake[]) => {
                if (isMounted) {
                    console.log("useMakesAndModels: Makes fetched successfully.");
                    setMakes(data);
                }
            })
            .catch(err => {
                console.error('useMakesAndModels: Error fetching makes:', err);
                if (isMounted) setMakes([]); // Set empty on error
            })
            .finally(() => {
                if (isMounted) setMakesLoading(false);
            });

        return () => { isMounted = false; }; // Cleanup
    }, []); // Empty dependency array - fetch makes only once

    // Effect to fetch models when selectedMakeName changes (and makes are loaded)
    useEffect(() => {
        // Don't fetch if make is "Any" or if makes haven't loaded yet
        if (selectedMakeName === "Any" || makes.length === 0) {
            setAvailableModels([]);
            setModelsLoading(false); // Ensure loading is false if we don't fetch
            return;
        }

        // Find the selected make's ID from the fetched makes list
        const selectedMake = makes.find(make => make.name === selectedMakeName);
        if (!selectedMake) {
            console.warn(`useMakesAndModels: Selected make "${selectedMakeName}" not found in makes list.`);
            setAvailableModels([]);
            setModelsLoading(false);
            return;
        }

        let isMounted = true;
        setModelsLoading(true);
        setAvailableModels([]); // Clear previous models
        console.log(`useMakesAndModels: Fetching models for make ID: ${selectedMake.id}`);

        fetch(`/api/car-models?make_id=${selectedMake.id}`)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to fetch models for make ${selectedMakeName}`);
                return res.json();
            })
            .then((data: CarModel[]) => {
                if (isMounted) {
                    console.log(`useMakesAndModels: Models for "${selectedMakeName}" fetched successfully.`);
                    setAvailableModels(data);
                }
            })
            .catch(err => {
                console.error('useMakesAndModels: Error fetching models:', err);
                if (isMounted) setAvailableModels([]);
            })
            .finally(() => {
                if (isMounted) setModelsLoading(false);
            });

        return () => { isMounted = false; }; // Cleanup

        // Depend on the selectedMakeName prop and the makes list itself
    }, [selectedMakeName, makes]);

    return { makes, availableModels, makesLoading, modelsLoading };
}