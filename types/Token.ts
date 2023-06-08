export type Token = {
    secret: {
        name: string,
        value: string
    }, 
    refresh: {
        name: string,
        value: string
    }, 
    approver_email: string
};