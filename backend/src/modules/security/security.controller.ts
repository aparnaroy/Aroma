import express from "express";
import { UserLoginModel } from "./security.models";
import { MongoDBService, ObjectId } from "../database/mongodb.service";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SecuritySettings } from "./security.settings";

/* SecurityController
    * @class: SecurityController
    * @remarks: A class that contains the controller functions for the security module
    * 			  postLogin: a function that handles the login request
    * 			  postRegister: a function that handles the register request
    * 			  getTest: a function that handles the test request
    */
export class SecurityController {

    private mongoDBService: MongoDBService;

    constructor() {
        this.mongoDBService = new MongoDBService();
    }

    private settings: SecuritySettings = new SecuritySettings();

    /* makeToken(user: UserLoginModel): string
            @param {UserLoginModel}: The user to encode
            @returns {string}: The token
            @remarks: Creates a token from the user
        */
    private makeToken(user: UserLoginModel): string {
        const secret = process.env.SECRET_KEY;
        if (!secret) {
            throw new Error("JWT secret is not defined in env");
        }
        var token = jwt.sign(user, secret, { expiresIn: '24h' });
        console.log(token);
        return token;
    }

    /* encryptPassword(password: string): Promise<string>
        @param {string}: password - The password to encrypt
        @returns {Promise<string>}: The encrypted password
        @remarks: Encrypts the password
        @async
    */
    private encryptPassword(password: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const saltRounds = 10;
            bcrypt.genSalt(saltRounds, (err, salt) => {
                if (err) return reject(err);
                bcrypt.hash(password, salt, (err, hash) => {
                    if (err) return reject(err);
                    resolve(hash);
                });
            });
        });
    }

    /* authorize(req: express.Request, res: express.Response): void
        @param {express.Request} req: The request object
        @param {express.Response} res: The response object
        @returns {void}:
        @remarks: Handles the authorize request
    */
    public authorize = (req: express.Request, res: express.Response): void => {
        res.send({ token: this.makeToken(req.body.user) });
    }

    /* postLogin(req: express.Request, res: express.Response): Promise<void>
        @param {express.Request} req: The request object
                expects username and password in body of request
        @param {express.Response} res: The response object
        @returns {Promise<void>}:
        @remarks: Handles the login request
        @async
    */
    public postLogin = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const user: UserLoginModel = {
                username: req.body.username,
                password: req.body.password,
                roles: this.settings.defaultRoles,
                tags: [],
                theme: '',
                _created: new Date(),
                _updated: new Date()
            };
            if (user.username == null || user.password == null || user.username.trim().length == 0 || user.password.trim().length == 0) {
                res.status(400).send({ error: "Username and password are required" });
                return;
            }
            let result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            let dbUser: UserLoginModel | null = await this.mongoDBService.findOne(this.settings.database, this.settings.collection, { username: user.username });
            if (!dbUser) {
                res.status(404).send({ error: "User not found" });
                return;
            }
            bcrypt.compare(user.password, dbUser.password, (err, result) => {
                if (err) {
                    res.status(500).send({ error: "Password comparison failed" });
                    return;
                } else if (result) {
                    dbUser.password = "****";
                    if (dbUser._id) {
                        const userId = dbUser._id.toString();
                        res.send({ token: this.makeToken(dbUser), userId: userId });
                    } else {
                        res.status(500).send({ error: "User ID is undefined" });
                    }
                } else {
                    res.status(401).send({ error: "Password does not match" });
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).send({ error: "Internal server error" });
        } finally {
            this.mongoDBService.close();
        }
    }

    /* postRegister(req: express.Request, res: express.Response): Promise<void>
        @param {express.Request} req: The request object
            expects username and password in body of request
        @param {express.Response} res: The response object
        @returns {Promise<void>}:
        @remarks: Handles the register request on post
        @async
    */
    public postRegister = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const user: UserLoginModel = {
                username: req.body.username,
                password: req.body.password,
                roles: this.settings.defaultRoles,
                tags: [],
                theme: this.settings.defaultTheme,
                _created: new Date(),
                _updated: new Date()
            };
            if (user.username == null || user.password == null || user.username.trim().length == 0 || user.password.trim().length == 0) {
                res.status(400).send({ error: "Username and password are required" });
                return;
            }
            let result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            let dbUser: UserLoginModel | null = await this.mongoDBService.findOne(this.settings.database, this.settings.collection, { username: user.username });
            if (dbUser) {
                res.status(409).send({ error: "User already exists" });
                return;
            }
            user.password = await this.encryptPassword(user.password);
            result = await this.mongoDBService.insertOne(this.settings.database, this.settings.collection, user);
            if (!result) {
                res.status(500).send({ error: "Database insert failed" });
                return;
            }
            dbUser = await this.mongoDBService.findOne(this.settings.database, this.settings.collection, { username: user.username });
            if (!dbUser) {
                res.status(500).send({ error: "Database insert failed" });
                return;
            }
            dbUser.password = "****";
            res.send({ token: this.makeToken(dbUser), userId: dbUser._id });
        } catch (err) {
            console.error(err);
            res.status(500).send({ error: "Internal server error" });
        } finally {
            this.mongoDBService.close();
        }
    }

    /* getUser(req: express.Request, res: express.Response): Promise<void>
        @param {express.Request} req: The request object
            expects the id of the user to be in the params array of the request object as id
        @param {express.Response} res: The response object
        @returns {Promise<void>}:
        @remarks: Handles the get user request
        @async
    */
    public getUser = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            const userId = new ObjectId(req.body.user._id);
            const user = await this.mongoDBService.findOne<UserLoginModel>(this.settings.database, this.settings.collection, { _id: userId });
            if (!user) {
                res.status(404).send({ error: "User not found" });
                return;
            }
            user.password = "****";
            res.send(user);
        } catch (error) {
            console.error(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }

    /* putUser(req: express.Request, res: express.Response): Promise<void>
        @param {express.Request} req: The request object
        expects the id of the user to be in the params array of the request object as id
        @param {express.Response} res: The response object
        @returns {Promise<void>}:
        @remarks: Handles the update user request
        @async
    */
    public putUser = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            const userId = new ObjectId(req.params.id);

            // Retrieve the existing user document
            const existingUser = await this.mongoDBService.findOne<UserLoginModel>(this.settings.database, this.settings.collection, { _id: userId });
            if (!existingUser) {
                res.status(404).send({ error: "User not found" });
                return;
            }

            // Check if the new username already exists
            if (req.body.username && req.body.username !== existingUser.username) {
                const existingUsername = await this.mongoDBService.findOne<UserLoginModel>(this.settings.database, this.settings.collection, { username: req.body.username });
                if (existingUsername) {
                    res.status(409).send({ error: "Username already exists" });
                    return;
                }
            }

            // Merge the existing created field with the new data
            let updatedUser: Partial<UserLoginModel> = {
                username: req.body.username || existingUser.username,
                roles: req.body.roles || existingUser.roles,
                tags: req.body.tags || existingUser.tags,
                theme: req.body.theme || existingUser.theme,
                _created: existingUser._created, // Preserve the existing created field
                _updated: new Date()
            };

            // If a new password is provided, encrypt it
            if (req.body.password && req.body.password.trim().length > 0) {
                updatedUser.password = await this.encryptPassword(req.body.password);
            } else {
                updatedUser.password = existingUser.password;
            }

            let command = { $set: updatedUser };
            const success = await this.mongoDBService.updateOne(this.settings.database, this.settings.collection, { _id: userId }, command);
            if (success) {
                let dbUser: UserLoginModel | null = await this.mongoDBService.findOne(this.settings.database, this.settings.collection, { username: updatedUser.username });
                if (dbUser) {
                    dbUser.password = "****";
                    res.send({ token: this.makeToken(dbUser) });
                } else {
                    res.status(500).send({ error: "Failed to update user" });
                }
            } else {
                res.status(500).send({ error: "Failed to update user" });
            }

        } catch (error) {
            console.error(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }

    /* putUserPassword(req: express.Request, res: express.Response): Promise<void>
        @param {express.Request} req: The request object
            expects the current password of the user to be in the body of the request object as currentPassword
            expects the new password of the user to be in the body of the request object as newPassword
        @param {express.Response} res: The response object
        @returns {Promise<void>}:
        @remarks: Handles the update user password request
        @async
    */
    public putUserPassword = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            const userId = new ObjectId(req.body.user._id);
            const user = await this.mongoDBService.findOne<UserLoginModel>(this.settings.database, this.settings.collection, { _id: userId });
            if (!user) {
                res.status(404).send({ error: "User not found" });
                return;
            }
            bcrypt.compare(req.body.currentPassword, user.password, async (err, result) => {
                if (err) {
                    res.status(500).send({ error: "Password comparison failed" });
                    return;
                } else if (result) {
                    const updatedPassword = await this.encryptPassword(req.body.newPassword);
                    let command = { $set: { password: updatedPassword } };
                    const success = await this.mongoDBService.updateOne(this.settings.database, this.settings.collection, { _id: userId }, command);
                    if (success) {
                        user.password = "****";
                        res.send({ token: this.makeToken(user) });
                    } else {
                        res.status(500).send({ error: "Failed to update password" });
                    }
                } else {
                    res.status(401).send({ error: "Password does not match" });
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }

    /* deleteUser(req: express.Request, res: express.Response): Promise<void>
        @param {express.Request} req: The request object
            expects the id of the user to be in the params array of the request object as id
        @param {express.Response} res: The response object
        @returns {Promise<void>}:
        @remarks: Handles the delete user request
        @async
    */
    public deleteUser = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            const userId = new ObjectId(req.params.id);
            const user = await this.mongoDBService.findOne<UserLoginModel>(this.settings.database, this.settings.collection, { _id: userId });
            if (!user) {
                res.status(404).send({ error: "User not found" });
                return;
            }
            let success = await this.mongoDBService.insertOne(this.settings.database, this.settings.archiveCollection, user);
            if (success) {
                success = await this.mongoDBService.deleteOne(this.settings.database, this.settings.collection, { _id: userId });
                if (success) {
                    res.send({ success: true });
                } else {
                    res.status(500).send({ error: "Failed to delete user" });
                }
            } else {
                res.status(500).send({ error: "Failed to archive user" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }

    /* postTag(req: express.Request, res: express.Response): Promise<void>
        @param {express.Request} req: The request object
            expects the id of the user to be in the body of the request object as userId
            expects the name of the tag to be in the body of the request object as name
        @param {express.Response} res: The response object
        @returns {Promise<void>}:
        @remarks: Handles the post tag request
        @async
    */
    public postTag = async (req: express.Request, res: express.Response): Promise<{ success: boolean, tagId?: ObjectId, error?: any }> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                return { success: false, error: "Database connection failed" };
            }
            const userId = req.body.user._id;
            const tagName = req.body.tag.name; // Get tag name from request body

            const user = await this.mongoDBService.findOne<UserLoginModel>(this.settings.database, this.settings.collection, { _id: userId });
            if (!user) {
                return { success: false, error: "User not found" };
            }
            if (!user.tags) {
                user.tags = [];
            }

            // Check if the tag already exists
            const existingTag = user.tags.find(tag => tag.name === tagName);
            if (existingTag) {
                return { success: true, tagId: existingTag._id }; // Tag already exists, return success with existing tag ID
                // increment tag number
            }

            // Create a new tag object
            const tagId = new ObjectId(); // Generate new tag ID
            const newTag = { _id: tagId, name: tagName, number: 0 };
            if (newTag.name === 'null' || newTag.name === 'undefined' || newTag.name === '') {
                return { success: false, error: "Tag name cannot be null, undefined, or empty" };
            }
            user.tags.push(newTag);

            let command = { $set: { tags: user.tags } };
            const success = await this.mongoDBService.updateOne(this.settings.database, this.settings.collection, { _id: userId }, command);
            if (success) {
                return { success: true, tagId: tagId }; // Return success with new tag ID
            } else {
                return { success: false, error: "Failed to add tag" };
            }
        } catch (error) {
            console.error(error);
            return { success: false, error: "Internal server error" };
        }
    }

    /* putTag(req: express.Request, res: express.Response): Promise<void>
    @param {express.Request} req: The request object
        expects the id of the user to be in the body of the request object as userId
        expects the id of the tag to be in the params array of the request object as id
        expects the name of the tag to be in the body of the request object as name
    @param {express.Response} res: The response object
    @returns {Promise<void>}:
    @remarks: Handles the put tag request
    @async
*/
    public putTag = async (req: express.Request, res: express.Response): Promise<{ success: boolean, tagId?: ObjectId, error?: any }> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                return { success: false, error: "Database connection failed" };
            }
            const userId = req.body.user._id;
            const tagId = new ObjectId(req.params.id);
            const tagName = req.body.name;

            const user = await this.mongoDBService.findOne<UserLoginModel>(this.settings.database, this.settings.collection, { _id: userId });
            if (!user) {
                return { success: false, error: "User not found" };
            }
            if (!user.tags) {
                user.tags = [];
            }

            // Find the tag in the user's tag list
            const tagIndex = user.tags.findIndex(tag => tag._id.equals(tagId));
            if (tagIndex < 0) {
                return { success: false, error: "Tag not found" };
            }

            // Update the tag name
            user.tags[tagIndex].name = tagName || user.tags[tagIndex].name;
            if (user.tags[tagIndex].name === 'null' || user.tags[tagIndex].name === 'undefined' || user.tags[tagIndex].name === '') {
                return { success: false, error: "Tag name cannot be null, undefined, or empty" };
            }

            let command = { $set: { tags: user.tags } };
            const success = await this.mongoDBService.updateOne(this.settings.database, this.settings.collection, { _id: userId }, command);
            if (success) {
                return { success: true, tagId: tagId }; // Return success with updated tag ID
            } else {
                return { success: false, error: "Failed to update tag" };
            }
        } catch (error) {
            console.error(error);
            return { success: false, error: "Internal server error" };
        }
    }

    /* getTag(req: express.Request, res: express.Response): Promise<void>
        @param {express.Request} req: The request object
            expects the id of the user to be in the body of the request object as userId
            expects the id of the tag to be in the params array of the request object as tagId
        @param {express.Response} res: The response object
        @returns {Promise<void>}:
        @remarks: Handles the get tag request
        @async
    */
    public getTag = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }

            const userId = req.body.user._id;
            const tagId = new ObjectId(req.params.id);

            const user = await this.mongoDBService.findOne<UserLoginModel>(this.settings.database, this.settings.collection, { _id: userId });
            if (!user) {
                res.status(404).send({ error: "User not found" });
                return;
            }
            if (!user.tags) {
                res.status(404).send({ error: "User has no tags" });
                return;
            }

            const tag = user.tags.find(tag => tag._id.equals(tagId));
            if (!tag) {
                res.status(404).send({ error: "Tag not found" });
                return;
            }

            res.send(tag);

        } catch (error) {
            console.error(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }

    /* deleteTag(req: express.Request, res: express.Response): Promise<void>
        @param {express.Request} req: The request object
            expects the id of the user to be in the body of the request object as userId
            expects the id of the tag to be in the params array of the request object as tagId
        @param {express.Response} res: The response object
        @returns {Promise<void>}:
        @remarks: Handles the delete tag request and removes it from all recipes that have it
        @async
    */
    public deleteTag = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }

            const userId = req.body.user._id;
            const tagId = new ObjectId(req.params.id);

            // Find the user and check if the tag exists
            const user = await this.mongoDBService.findOne<UserLoginModel>(this.settings.database, this.settings.collection, { _id: userId });
            if (!user) {
                res.status(404).send({ error: "User not found" });
                return;
            }
            if (!user.tags) {
                res.status(404).send({ error: "User has no tags" });
                return;
            }

            // Remove the tag from the user's tags array
            const updatedTags = user.tags.filter(tag => !tag._id.equals(tagId));
            if (updatedTags.length === user.tags.length) {
                res.status(404).send({ error: "Tag not found" });
                return;
            }

            // Update user tags
            const command = { $set: { tags: updatedTags } };
            const updateUserSuccess = await this.mongoDBService.updateOne(this.settings.database, this.settings.collection, { _id: userId }, command);
            if (!updateUserSuccess) {
                res.status(500).send({ error: "Failed to remove tag from user" });
                return;
            }

            // Remove the tag from any recipes that contain it
            const recipeUpdateResult = await this.mongoDBService.updateMany(
                this.settings.database,
                'recipes',
                { _userId: userId, tags: tagId },  // Find recipes with this tag for the user
                { $pull: { tags: tagId } }  // Remove the tag from the tags array
            );

            if (recipeUpdateResult.matchedCount === 0) {
                res.send({ success: true, message: "Tag removed from user but no recipes contained this tag" });
            } else if (recipeUpdateResult.modifiedCount > 0) {
                res.send({ success: true, message: `Tag removed from user and ${recipeUpdateResult.modifiedCount} recipes` });
            } else {
                res.status(500).send({ error: "Failed to remove tag from recipes" });
            }

        } catch (error) {
            console.error(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }

    getTags = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }

            const userId = req.body.user._id;

            const user = await this.mongoDBService.findOne<UserLoginModel>(this.settings.database, this.settings.collection, { _id: userId });
            if (!user) {
                res.status(404).send({ error: "User not found" });
                return;
            }
            if (!user.tags) {
                res.status(404).send({ error: "User has no tags" });
                return;
            }

            res.send(user.tags);

        } catch (error) {
            console.error(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }
}