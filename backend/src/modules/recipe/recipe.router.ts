import express from "express";import { RecipeController } from "./recipe.controller";
import { SecurityMiddleware } from "../security/security.middleware";

/* RecipeRouter
    * @class: RecipeRouter
    * @remarks: A class that contains the routes for the recipe module
    * 			  getRouter: a function that returns a router object
    */
export class RecipeRouter {
    private router: express.Router = express.Router();
    private controller: RecipeController = new RecipeController();

    // Creates the routes for this router and returns a populated router object
    /* getRouter(): express.Router
        @returns {express.Router}
        @remarks: creates the routes for this router
    */
    public getRouter(): express.Router {
        this.router.get("/", this.controller.getRecipes);
        this.router.get("/count", this.controller.getRecipesCount);
        this.router.get("/:id", this.controller.getRecipe);
        this.router.post("/", this.controller.postAddRecipe);
        this.router.put("/:id", this.controller.putUpdateRecipe);
        this.router.delete("/:id", this.controller.deleteRecipe);
        this.router.post("/extract", this.controller.extractRecipeFromURL);
        this.router.post("/generate", this.controller.generateRecipe);
        return this.router;
    }
}