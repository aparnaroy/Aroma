import { ObjectId } from 'mongodb';

/* This file contains the models for the shopping module */
/* ShoppingListModel
    * @interface: ShoppingListModel
    * @remarks: A model for the shopping item
    * 			  _id: a string that represents the shopping list ID
    * 			  _userId: an ObjectId that references the user who created the shopping list
    *             name: a string that represents the name of the shopping list
    *             items: an array of objects that represents the items in the shopping list
    *                 name: a string that represents the name of the ingredient
    *                 quantity: a number that represents the amount of the ingredient
    *                 unitOfMeasure: a string that represents the unit of measure for the ingredient
    *             _created: an integer that represents the creation date/time in milliseconds
    *             _updated: an integer that represents the last updated date/time in milliseconds
*/
export interface ShoppingListModel {
    _id?: string;
    _userId: string;
    name: string;
    items: {
        name: string;
        quantity: number;
        unitOfMeasure: string;
        bought: boolean;
    }[];
    _created?: Date;
    _updated: Date;
}
