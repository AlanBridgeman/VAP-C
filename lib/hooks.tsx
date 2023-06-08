/*
 *************************************************************
 * Name: hooks.ts (Custom React Hooks)
 * Description: In general this file provides React hooks for 
 *              loading particular data using the 
 *              Stale-While-Revalidate (SWR) strategy
 * 
 * See Also: https://swr.vercel.app/
 * 
 * Author: Alan Bridgeman
 * Created: January, 29th 2022
 *************************************************************
 */

import useSWR, { BareFetcher, KeyedMutator } from 'swr';

import { BlobItem } from '@azure/storage-blob';

import { User } from '../types/User';
import { Service } from '../types/Service';
import { ServiceCategory } from '../types/ServiceCategory';
import { Cart } from '../types/Cart';
import { Token } from '../types/Token';

const userFetcher: BareFetcher<{user: User}> = (url: string): Promise<{user: User}> => fetch(url).then((r) => r.json());
const servicesFetcher: BareFetcher<{services: Array<Service>}> = (url: string): Promise<{services: Array<Service>}> => fetch(url).then((r) => r.json());
const categoriesFetcher: BareFetcher<{categories: Array<ServiceCategory>}> = (url: string): Promise<{categories: Array<ServiceCategory>}> => fetch(url).then((r) => r.json());
const cartFetcher: BareFetcher<{cart: Cart}> = (url: string): Promise<{cart: Cart}> => fetch(url).then((r) => r.json());
const videoListFetcher: BareFetcher<{blobs: BlobItem[]}> = (url: string): Promise<{blobs: BlobItem[]}> => fetch(url).then((r) => r.json());
const tokenFetcher: BareFetcher<{tokens: Token[]}> = (url: string): Promise<{tokens: Token[]}> => fetch(url).then((r) => r.json());

/**
 * Hook for getting the User (using SWR)
 * 
 * @returns 
 */
export function useUser(): [User, {mutate: KeyedMutator<any>, loading: boolean}] {
    const { data, mutate } = useSWR<{user: User}, any, string>('/api/user', userFetcher);
    
    // if data is not defined, the query has not completed
    const loading: boolean = !data;
    
    const user: User = data?.user;
    
    return [user, { mutate, loading }];
}

/**
 * Hook for getting the services (using SWR)
 * 
 * @returns 
 */
export function useServices(): [Array<Service>, {mutate: KeyedMutator<any>, loading: boolean}] {
    const { data, mutate } = useSWR<{services: Array<Service>}, any, string>('/api/services/list', servicesFetcher);
    
    // if data is not defined, the query has not completed
    const loading: boolean = !data;
    
    const services: Array<Service> = data?.services;

    return [services, { mutate, loading}];
}

/**
 * Hook for getting the categories of services (using SWR)
 * 
 * @returns 
 */
 export function useCategories(): [Array<ServiceCategory>, {mutate: KeyedMutator<any>, loading: boolean}] {
    const { data, mutate } = useSWR<{categories: Array<ServiceCategory>}, any, string>('/api/services/list_categories', categoriesFetcher);
    
    // if data is not defined, the query has not completed
    const loading: boolean = !data;
    
    const categories: Array<ServiceCategory> = data?.categories;

    return [categories, { mutate, loading}];
}

/**
 * Hook for getting the Cart (using SWR)
 * 
 * @returns 
 */
export function useCart(): [Cart, {mutate: KeyedMutator<any>, loading: boolean}] {
    const { data, mutate } = useSWR<{cart: Cart}, any, string>('/api/cart', cartFetcher);
    
    // if data is not defined, the query has not completed
    const loading: boolean = !data;
    
    const cart: Cart = data?.cart;
    
    return [cart, { mutate, loading }];
}

/**
 * Hook for getting the Video List (using SWR)
 * 
 * @returns 
 */
 export function useVideoList(): [BlobItem[], {mutate: KeyedMutator<any>, loading: boolean}] {
    const { data, mutate } = useSWR<{blobs: BlobItem[]}, any, string>('/api/services/video_editing/video_list', videoListFetcher);
    
    // if data is not defined, the query has not completed
    const loading: boolean = !data;
    
    const blobs: BlobItem[] = data?.blobs;
    
    return [blobs, { mutate, loading }];
}

/**
 * Hook for getting tokens (using SWR)
 * 
 * @returns 
 */
export function useTokens(): [Token[], {mutate: KeyedMutator<any>, loading: boolean}] {
    const { data, mutate } = useSWR<{tokens: Token[]}, any, string>('/api/tokens', tokenFetcher);
    
    // If data is not defined, the query has not completed
    const loading: boolean = !data;

    const tokens: Token[] = data?.tokens;

    return [tokens, { mutate, loading }];
}