import express from "express";
import { ShoppingListController } from "./shopping.controller";
import { SecurityMiddleware } from "../security/security.middleware";

/* ShoppingListRouter
    * @class: ShoppingListRouter
    * @remarks: A class that contains the routes for the shopping module
    * 			  getRouter: a function that returns a router object
    */
export class ShoppingListRouter {
    private router: express.Router = express.Router();
    private controller: ShoppingListController = new ShoppingListController();

    // Creates the routes for this router and returns a populated router object
    /* getRouter(): express.Router
        @returns {express.Router}
        @remarks: creates the routes for this router
    */
    public getRouter(): express.Router {
        this.router.get("/", this.controller.getShoppingLists);
        this.router.get("/:id", this.controller.getShoppingList);
        this.router.post("/", this.controller.postAddShoppingList);
        this.router.put("/:id", this.controller.putUpdateShoppingList);
        this.router.delete("/:id", this.controller.deleteShoppingList);
        return this.router;
    }
}