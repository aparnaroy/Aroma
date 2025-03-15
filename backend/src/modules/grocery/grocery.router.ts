import express from "express";
import { GroceryController } from "./grocery.controller";

export class GroceryRouter {
    private router: express.Router = express.Router();
    private controller: GroceryController = new GroceryController();

    public getRouter(): express.Router {
        this.router.get("/", this.controller.getGroceryPage);
        this.router.post("/", this.controller.addGroceryList);
        this.router.post("/list/:listId/item", this.controller.addGroceryItem);
        this.router.delete("/list/:listId", this.controller.deleteGroceryList);
        this.router.delete("/list/:listId/item/:itemId", this.controller.deleteGroceryItem);
        return this.router;
    }
}
