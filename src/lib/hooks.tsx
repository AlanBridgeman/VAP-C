import useSWR, { BareFetcher, KeyedMutator } from 'swr'
import { User } from '../types/User';

export const fetcher: BareFetcher<{user: User}> = (url: string): Promise<{user: User}> => fetch(url).then((r) => r.json())

export function useUser(): [User, {mutate: KeyedMutator<any>, loading: boolean}] {
    const { data, mutate } = useSWR<{user: User}, any, string>('/api/user', fetcher)
    // if data is not defined, the query has not completed
    const loading: boolean = !data
    const user: User = data?.user
    return [user, { mutate, loading }]
}
