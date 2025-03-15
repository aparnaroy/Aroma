export interface UserLoginModel {
    _id: string;
    username: string;
    password: string;
    roles: string[];
    tags: {
        _id: string;
        name: string;
        number?: number;
    }[];
    theme?: string;
    _created?: Date;
    _updated?: Date;
}