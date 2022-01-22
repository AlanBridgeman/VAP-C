import { User as UserModel } from '@prisma/client'

export interface User extends Omit<UserModel, 'password' | 'salt'> {
    fname?: string,
    lname?: string
}