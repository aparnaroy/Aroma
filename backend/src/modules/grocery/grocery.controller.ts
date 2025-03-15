import { Request, Response } from "express";
import { MongoDBService, ObjectId } from "../database/mongodb.service";
import { GroceryPageModel, GroceryListModel, GroceryItemModel } from "./grocery.models";
import { GrocerySettings } from "./grocery.settings";

import express from "express";
import { SecuritySettings } from "../security/security.settings";
import { SecurityController } from "../security/security.controller";
import { UserLoginModel } from "../security/security.models";
import sharp from "sharp";
import axios from 'axios';

export class GroceryController {

    private mongoDBService: MongoDBService;
    private settings = new GrocerySettings();
    private securitySettings = new SecuritySettings();
    private securityController = new SecurityController();

    constructor() {
        this.mongoDBService = new MongoDBService();
        this.securityController = new SecurityController();
    }

    // Get the grocery page for the logged-in user
    public async getGroceryPage(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.body.user._id;
            const groceryPage = await this.mongoDBService.findOne<GroceryPageModel>(
                this.settings.database,
                this.settings.collection,
                { _userId: userId }
            );
            res.status(200).json(groceryPage);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch grocery page" });
        }
    }

    // Add a new grocery list
    public async addGroceryList(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.body.user._id;
            const newList: GroceryListModel = {
                _id: userId,
                name: req.body.name,
                items: [],
                lastUpdated: new Date(),
            };
            const result = await this.mongoDBService.updateOne(
                this.settings.database,
                this.settings.collection,
                { _userId: userId },
                { $push: { groceryLists: newList }, $setOnInsert: { _userId: userId } }
            );
            res.status(201).json({ success: true, listId: newList._id });
        } catch (error) {
            res.status(500).json({ error: "Failed to add grocery list" });
        }
    }

    // Add an item to a grocery list
    public async addGroceryItem(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.body.user._id;
            const listId = new ObjectId(req.params.listId);
            const newItem: GroceryItemModel = {
                _id: userId,
                name: req.body.name,
                checked: false,
            };
            const result = await this.mongoDBService.updateOne(
                this.settings.database,
                this.settings.collection,
                { _userId: userId, "groceryLists._id": listId },
                { $push: { "groceryLists.$.items": newItem }, $set: { "groceryLists.$.lastUpdated": new Date() } }
            );
            res.status(201).json({ success: true, itemId: newItem._id });
        } catch (error) {
            res.status(500).json({ error: "Failed to add grocery item" });
        }
    }

    // Delete a grocery list
    public async deleteGroceryList(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.body.user._id;
            const listId = new ObjectId(req.params.listId);
            const result = await this.mongoDBService.updateOne(
                this.settings.database,
                this.settings.collection,
                { _userId: userId },
                { $pull: { groceryLists: { _id: listId } } }
            );
            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed to delete grocery list" });
        }
    }

    // Delete an item from a grocery list
    public async deleteGroceryItem(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.body.user._id;
            const listId = new ObjectId(req.params.listId);
            const itemId = new ObjectId(req.params.itemId);
            const result = await this.mongoDBService.updateOne(
                this.settings.database,
                this.settings.collection,
                { _userId: userId, "groceryLists._id": listId },
                { $pull: { "groceryLists.$.items": { _id: itemId } } }
            );
            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed to delete grocery item" });
        }
    }
}
