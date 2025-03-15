import { ObjectId } from "mongodb";
import { RecipeModel } from "../recipe/recipe.models";

export interface CalendarModel {
    _id?: string;
    _userId: ObjectId;
    date: number;
    recipes: {
        recipeID: number;
        recipeName: string;
        recipe: RecipeModel;
    }[];
    _created?: Date;
    _updated: Date;
}