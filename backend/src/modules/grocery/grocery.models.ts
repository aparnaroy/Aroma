import { ObjectId } from "mongodb";

/**
 * Model for an individual grocery item.
 */
export interface GroceryItemModel {
    _id?: string;
    name: string;
    checked: boolean; // Whether the item is checked off
}

/**
 * Model for a grocery list.
 */
export interface GroceryListModel {
    _id?: string;
    name: string;
    items: GroceryItemModel[];
    lastUpdated: Date;
}

/**
 * Model for the entire grocery structure.
 */
export interface GroceryPageModel {
    _id?: string;
    _userId: ObjectId;
    groceryLists: GroceryListModel[];
}
