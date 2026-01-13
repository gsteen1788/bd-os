import { useState, useEffect, useCallback } from 'react';
import {
    organizationRepository,
    contactRepository,
    opportunityRepository,
    meetingRepository
} from '../../infrastructure/repositories';
import { Organization, Contact, Opportunity, Meeting } from '../../domain/entities';

export interface GlobalSearchResults {
    organizations: Organization[];
    contacts: Contact[];
    opportunities: Opportunity[];
    meetings: Meeting[];
}

const EMPTY_RESULTS: GlobalSearchResults = {
    organizations: [],
    contacts: [],
    opportunities: [],
    meetings: []
};

export function useGlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GlobalSearchResults>(EMPTY_RESULTS);
    const [isSearching, setIsSearching] = useState(false);

    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults(EMPTY_RESULTS);
            return;
        }

        setIsSearching(true);
        try {
            const [orgs, contacts, opps, meetings] = await Promise.all([
                organizationRepository.search(searchQuery),
                contactRepository.search(searchQuery),
                opportunityRepository.search(searchQuery),
                meetingRepository.search(searchQuery)
            ]);

            setResults({
                organizations: orgs,
                contacts: contacts,
                opportunities: opps,
                meetings: meetings
            });
        } catch (error) {
            console.error("Global search failed:", error);
            // Optionally handle error state
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(query);
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [query, performSearch]);

    return {
        query,
        setQuery,
        results,
        isSearching
    };
}
