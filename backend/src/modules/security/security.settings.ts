/*
    This file is used to define the security settings for the application. 
    The settings are used to configure the security module and can be accessed using the SecuritySettings class.
*/

/* SecuritySettings
    * @class: SecuritySettings
    * @remarks: A class that contains the security settings for the application
    * 			  database: a string that represents the database name
    * 			  collection: a string that represents the collection name
    * 			  defaultRoles: an array of strings that represents the default roles
    */
export class SecuritySettings {
    public database = "Development_Data";
    public collection = "users";
    public archiveCollection = "users_archive";
    public defaultRoles: string[] = ["user"];
    public defaultTheme: string = "default";
}