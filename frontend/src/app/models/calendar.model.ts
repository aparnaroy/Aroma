import { ObjectId } from "mongodb";
import { RecipeModel } from "./recipes.model";

export interface CalendarModel {
    _id?: string;
    _userId: ObjectId;
    date: string;
    recipes: {
        recipeID: number;
        recipeName: string;
        recipe: RecipeModel;
    }[];
    _created?: Date;
    _updated: Date;
}