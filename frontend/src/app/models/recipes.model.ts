/* This file contains the models for the recipe module */
/* RecipeModel
    * @interface: RecipeModel
    * @remarks: A model for the recipe
    * 			  _userId: a string that represents the user ID
    * 			  name: a string that represents the name of the recipe
    * 			  source: a string that represents the source of the recipe
    * 			  favorite: a boolean that indicates if the recipe is a favorite
    * 			  description: a string that represents the description of the recipe
    * 			  instructions: a string that represents the instructions for the recipe
    * 			  ingredients: an array of strings that represents the ingredients of the recipe
    * 			  tags: tags object that represents the tags of the recipe
    * 			  image: a string that represents the image URL of the recipe
    * 			  rating: a number that represents the rating of the recipe
    * 			  comments: an array of strings that represents the comments on the recipe
    * 			  _created: a Date object that represents the creation date of the recipe
    * 			  _updated: a Date object that represents the last update date of the recipe
    * 			  _id: a string that represents the id of the recipe
*/
export interface RecipeModel {
    _id?: string;
    _userId?: string;
    name: string;
    source: string;
    favorite: boolean;
    description: string;
    instructions: string[];
    ingredients: {
        name: string;
        quantity: number;
        unitOfMeasure: string;
    }[];
    tags: {
        _id: string;
        name: string;
    }[];
    image: string;
    rating: number;
    comments: string;
    _created?: Date;
    _updated?: Date;
}