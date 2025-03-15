import { ObjectId } from 'mongodb';

/* This file contains the models for the recipe module */
/* RecipeModel
    * @interface: RecipeModel
    * @remarks: A model for the recipe item
    * 			  _id: a string that represents the recipe ID
    * 			  _userId: an ObjectId that references the user who created the recipe
    * 			  name: a string that represents the name of the recipe
    * 			  source: a string that represents the source of the recipe (link or user input)
    * 			  description: a string that represents the description of the recipe
    * 			  instructions: an array of strings that represents the instructions for the recipe
    * 			  ingredients: an array of objects that represents the ingredients of the recipe
    * 			  tags: an array of integers that represents the IDs of tags attached to the recipe
    * 			  image: a string that represents the image path URL
    * 			  rating: an integer that represents the rating of the recipe
    * 			  comments: a string that represents user inputted comments
    * 			  _created: an integer that represents the creation date/time in milliseconds
    * 			  _updated: an integer that represents the last updated date/time in milliseconds
*/
export interface RecipeModel {
    _id?: string;
    _userId: ObjectId;
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
    tags: any[];
    image: string;
    rating: number;
    comments: string;
    _created?: Date;
    _updated: Date;
}