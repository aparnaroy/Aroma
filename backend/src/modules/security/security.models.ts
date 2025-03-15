import { ObjectId } from "mongodb";

/* This file contains the models for the security module. */

/* UserLoginModel
    * @interface: UserLoginModel
    * @remarks: A model for the user login
    *             _id: a string that represents the user ID
    * 			  username: a string that represents the username
    * 			  password: a string that represents the password
    * 			  roles: an array of strings that represents the roles
    *             tags: an array of ObjectIds that represents the tags
    *             theme: a string that represents the theme
    *             _created: a date that represents the creation date
    *             _updated: a date that represents the last updated date
    */
export interface UserLoginModel {
    _id?: string;
    username: string;
    password: string;
    roles: string[];
    tags: {
        _id: ObjectId;
        name: string;
        number: number;
    }[];
    theme?: string;
    _created?: Date;
    _updated?: Date;
}
