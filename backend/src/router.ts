import express from "express";
import { SecurityRouter } from "./modules/security/security.router";
import { RecipeRouter } from "./modules/recipe/recipe.router";
import { ShoppingListRouter } from "./modules/shopping/shopping.router";
import { SecurityMiddleware } from "./modules/security/security.middleware";
import { CalendarRouter } from "./modules/calendar/calendar.router";

export class ApiRouter {
    private router: express.Router = express.Router();

    // Creates the routes for this router and returns a populated router object
    public getRouter(): express.Router {
        this.router.use("/security", new SecurityRouter().getRouter());
        this.router.use("/recipes", [SecurityMiddleware.validateUser], new RecipeRouter().getRouter());
        this.router.use("/shopping", [SecurityMiddleware.validateUser], new ShoppingListRouter().getRouter());
        this.router.use("/calendars", [SecurityMiddleware.validateUser], new CalendarRouter().getRouter());
        return this.router;
    }
}