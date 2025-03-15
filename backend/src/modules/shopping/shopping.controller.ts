import express from "express";
import { MongoDBService, ObjectId } from "../database/mongodb.service";
import { ShoppingListModel } from "./shopping.models";
import { ShoppingListSettings } from "./shopping.settings";
import { SecuritySettings } from "../security/security.settings";
import { SecurityController } from "../security/security.controller";

/* ShoppingListController
    * @class: ShoppingListController
    * @remarks: A class that contains the controller functions for the shopping module
    * 			  getShoppingLists: a function that handles the get all shopping lists request
    * 			  getShoppingList: a function that handles the get shopping list request
    * 			  postAddShoppingList: a function that handles the add shopping list request
    * 			  putUpdateShoppingList: a function that handles the update shopping list request
    * 			  deleteShoppingList: a function that handles the delete shopping list request
    */
export class ShoppingListController {

    private mongoDBService: MongoDBService;
    private settings = new ShoppingListSettings();
    private securitySettings = new SecuritySettings();
    private securityController = new SecurityController();

    constructor() {
        this.mongoDBService = new MongoDBService();
        this.securityController = new SecurityController();

    }

    /* getShoppingLists(req: express.Request, res: express.Response): Promise<void>
            @param {express.Request} req: The request object
            @param {express.Response} res: The response object
            @returns {Promise<void>}:
            @remarks: Handles the get all shopping lists request
            @async
    */
    getShoppingLists = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            let result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            let shoppingLists = await this.mongoDBService.find<ShoppingListModel>(
                this.settings.database,
                this.settings.collection,
                { _userId: req.body.user._id } // only return shopping lists for the current user
            );
            res.send(shoppingLists);
        } catch (error) {
            res.status(500).send({ error: error });
        }
    }

    /* getShoppingList(req: express.Request, res: express.Response): Promise<void>
        @param {express.Request} req: The request object
            expects the id of the shopping list to be in the params array of the request object as id
        @param {express.Response} res: The response object
        @returns {Promise<void>}:
        @remarks: Handles the get shopping list request
        @async
    */
    getShoppingList = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            let result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            let shoppingList = await this.mongoDBService.findOne<ShoppingListModel>(this.settings.database, this.settings.collection, { _id: new ObjectId(req.params.id), _userId: req.body.user._id });
            if (!shoppingList) {
                res.status(404).send({ error: "Shopping list not found" });
                return;
            }
            res.send(shoppingList);
        } catch (error) {
            res.status(500).send({ error: error });
        }
    }

    /* postAddShoppingList(req: express.Request, res: express.Response): Promise<void>
        @param {express.Request} req: The request object
        @param {express.Response} res: The response object
        @returns {Promise<void>}:
        @remarks: Handles the add shopping list request
        @async
    */
    postAddShoppingList = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            let shoppingList: ShoppingListModel = {
                _userId: req.body.user._id,
                name: req.body.name || "Untitled",
                items: req.body.items,
                _created: new Date(),
                _updated: new Date(),
            };
            const success = await this.mongoDBService.insertOne(this.settings.database, this.settings.collection, shoppingList);
            if (success) {
                res.send({ success: true });
            } else {
                res.status(500).send({ error: "Failed to add shopping list" });
            }
        } catch (error) {
            res.status(500).send({ error: error });
        }
    }

    /* putUpdateShoppingList(req: express.Request, res: express.Response): Promise<void>
            @param {express.Request} req: The request object
            expects the id of the shopping list to be in the params array of the request object as id
            @param {express.Response} res: The response object
            @returns {Promise<void>}:
            @remarks: Handles the update shopping list request
            @async
    */
    putUpdateShoppingList = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            const shoppingListId = new ObjectId(req.params.id);
            let shoppingList: ShoppingListModel = {
                _userId: req.body.user._id,
                name: req.body.name || "Untitled",
                items: req.body.items,
                _updated: new Date(),
            };
            let command = { $set: shoppingList };
            const success = await this.mongoDBService.updateOne(this.settings.database, this.settings.collection, { _id: shoppingListId }, command);
            if (success) {
                res.send({ success: true });
            } else {
                res.status(500).send({ error: "Failed to update shopping list" });
            }
        } catch (error) {
            res.status(500).send({ error: error });
        }
    }

    /* deleteShoppingList(req: express.Request, res: express.Response): Promise<void>
            @param {express.Request} req: The request object
            expects the id of the shopping list to be in the params array of the request object as id
        @param {express.Response} res: The response object
        @returns {Promise<void>}:
        @remarks: Handles the delete shopping list request and archives the shopping list
        @async
    */
    deleteShoppingList = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            const shoppingListId = new ObjectId(req.params.id);
            const shoppingList = await this.mongoDBService.findOne<ShoppingListModel>(this.settings.database, this.settings.collection, { _id: shoppingListId });
            if (!shoppingList) {
                res.status(404).send({ error: "Shopping list not found" });
                return;
            }
            let success = await this.mongoDBService.insertOne(this.settings.database, this.settings.archiveCollection, shoppingList);
            if (!success) {
                res.status(500).send({ error: "Failed to archive shopping list" });
                return;
            }
            success = await this.mongoDBService.deleteOne(this.settings.database, this.settings.collection, { _id: shoppingListId });
            if (!success) {
                res.status(500).send({ error: "Failed to delete shopping list" });
                return;
            }
            res.send({ success: true });
        } catch (error) {
            res.status(500).send({ error: error });
        }
    }
}