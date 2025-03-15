import express from "express";
import { MongoDBService, ObjectId } from "../database/mongodb.service";
import { RecipeSettings } from "./recipe.settings";
import { SecuritySettings } from "../security/security.settings";
import { RecipeModel } from "./recipe.models";
import { SecurityController } from "../security/security.controller";
import { UserLoginModel } from "../security/security.models";
import { ExtractRecipeService } from "../services/extract.service";
import { GenerateRecipeService } from "../services/generate.service";
import sharp from "sharp";
import axios from 'axios';


/* RecipeController
    * @class: RecipeController
    * @remarks: A class that contains the controller functions for the recipe module
    * 			  getRecipes: a function that handles the get recipes request
    * 			  getRecipe: a function that handles the get recipe request
    * 			  postAddRecipe: a function that handles the add recipe request
    * 			  putUpdateRecipe: a function that handles the update recipe request
    * 			  deleteRecipe: a function that handles the delete recipe request
    */
export class RecipeController {

    private mongoDBService: MongoDBService;
    private extractRecipeService: ExtractRecipeService;
    private generateRecipeService: GenerateRecipeService;
    private settings = new RecipeSettings();
    private securitySettings = new SecuritySettings();
    private securityController = new SecurityController();

    constructor() {
        this.mongoDBService = new MongoDBService();
        this.extractRecipeService = new ExtractRecipeService();
        this.generateRecipeService = new GenerateRecipeService();
        this.securityController = new SecurityController();
    }

    /* getRecipesCount(req: express.Request, res: express.Response): Promise<void>
            @param {express.Request} req: The request object
            @param {express.Response} res: The response object
            @returns {Promise<void>}:
            @remarks: Handles the get recipes count request
            @async
    */
    getRecipesCount = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            console.log("Getting recipes count");
            let result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }

            // Retrieve the user's tags
            const userId = req.body.user._id;
            const user = await this.mongoDBService.findOne<UserLoginModel>(this.securitySettings.database, this.securitySettings.collection, { _id: userId });
            if (!user) {
                res.status(404).send({ error: "User not found" });
                return;
            }

            // Build the search query
            let searchQuery: any = { _userId: req.body.user._id };
            if (req.query.search) {
                const search = req.query.search as string;
                // checks to see if search starts wtih tags: and if so, searches for tags
                if (search.startsWith("tags:")) {
                    const tagSearch = search.replace("tags:", "").trim();
                    const tagTerms = tagSearch.split(',').map(term => term.trim().toLowerCase());
                    if (tagTerms[0] === "favorite") {
                        searchQuery = {
                            ...searchQuery,
                            favorite: true
                        };
                        tagTerms.shift();
                    }
                    if (tagTerms.length !== 0) {
                        const tagIds = user.tags.filter(tag => tagTerms.includes(tag.name.toLowerCase())).map(tag => tag._id);
                        searchQuery = {
                            ...searchQuery,
                            tags: { $all: tagIds }
                        };
                    }
                } else {
                    const searchTerms = search.split(',').map(term => term.trim().toLowerCase());
                    const variations = (term: string) => [term, term.replace(/-/g, ' '), term.replace(/ /g, '-')];

                    searchQuery = {
                        ...searchQuery,
                        $or: searchTerms.flatMap(term => variations(term).map(variation => ({
                            $or: [
                                { name: { $regex: variation, $options: "i" } },
                                { "ingredients.name": { $regex: variation, $options: "i" } },
                                { tags: { $in: user.tags.filter(tag => tag.name.toLowerCase().includes(variation.toLowerCase())).map(tag => tag._id) } },
                                { description: { $regex: variation, $options: "i" } },
                                { comments: { $regex: variation, $options: "i" } },
                                { _created: { $regex: variation, $options: "i" } },
                                { _updated: { $regex: variation, $options: "i" } }
                            ]
                        })))
                    };
                }
            }

            let count = await this.mongoDBService.count(this.settings.database, this.settings.collection, searchQuery);
            res.send({ count: count });
        } catch (error) {
            console.log("Error getting recipes count:", error);
            res.status(500).send({ error: error });
        }
    }

    /* getRecipes(req: express.Request, res: express.Response): Promise<void>
            @param {express.Request} req: The request object
            @param {express.Response} res: The response object
            @returns {Promise<void>}:
            @remarks: Handles the get recipes request
            @async
    */
    getRecipes = async (req: express.Request, res: express.Response): Promise<void> => {
        let recipes: RecipeModel[] = [];
        try {
            let result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }

            // Retrieve the user's tags
            const userId = req.body.user._id;
            const user = await this.mongoDBService.findOne<UserLoginModel>(this.securitySettings.database, this.securitySettings.collection, { _id: userId });
            if (!user) {
                res.status(404).send({ error: "User not found" });
                return;
            }
            if (!user.tags) {
                res.status(404).send({ error: "User has no tags" });
                return;
            }

            // Build the search query
            let searchQuery: any = { _userId: req.body.user._id };
            if (req.query.search) {
                const search = req.query.search as string;
                // checks to see if search starts wtih tags: and if so, searches for tags
                if (search.startsWith("tags:")) {
                    const tagSearch = search.replace("tags:", "").trim();
                    const tagTerms = tagSearch.split(',').map(term => term.trim().toLowerCase());
                    if (tagTerms[0] === "favorite") {
                        searchQuery = {
                            ...searchQuery,
                            favorite: true
                        };
                        tagTerms.shift();
                    }
                    if (tagTerms.length !== 0) {
                        const tagIds = user.tags.filter(tag => tagTerms.includes(tag.name.toLowerCase())).map(tag => tag._id);
                        searchQuery = {
                            ...searchQuery,
                            tags: { $all: tagIds }
                        };
                    }
                } else {
                    const searchTerms = search.split(',').map(term => term.trim().toLowerCase());
                    const variations = (term: string) => [term, term.replace(/-/g, ' '), term.replace(/ /g, '-')];

                    searchQuery = {
                        ...searchQuery,
                        $or: searchTerms.flatMap(term => variations(term).map(variation => ({
                            $or: [
                                { name: { $regex: variation, $options: "i" } },
                                { "ingredients.name": { $regex: variation, $options: "i" } },
                                { tags: { $in: user.tags.filter(tag => tag.name.toLowerCase().includes(variation.toLowerCase())).map(tag => tag._id) } },
                                { description: { $regex: variation, $options: "i" } },
                                { comments: { $regex: variation, $options: "i" } },
                                { _created: { $regex: variation, $options: "i" } },
                                { _updated: { $regex: variation, $options: "i" } }
                            ]
                        })))
                    };
                }
            }

            // Retrieve the recipes using the search function
            if (req.query.start && req.query.end) {
                let start = parseInt(req.query.start as string);
                let end = parseInt(req.query.end as string);
                recipes = await this.mongoDBService.search<RecipeModel>(this.settings.database, this.settings.collection, searchQuery, start, end);
            } else {
                recipes = await this.mongoDBService.search<RecipeModel>(this.settings.database, this.settings.collection, searchQuery);
            }

            // Map the tag IDs in each recipe to their corresponding names
            const updatedRecipes = recipes.map(recipe => {
                const tags = recipe.tags.map((tagId: ObjectId) => {
                    const tag = user.tags.find((userTag: any) => userTag._id.equals(tagId));
                    return tag ? { _id: tag._id.toString(), name: tag.name } : { _id: tagId.toString(), name: "" };
                });
                return {
                    ...recipe,
                    tags: tags
                };
            });

            res.send(updatedRecipes);
        } catch (error) {
            res.status(500).send({ error: error });
        }
    }

    /* getRecipe(req: express.Request, res: express.Response): Promise<void>
         @param {express.Request} req: The request object
             expects the id of the recipe to be in the params array of the request object as id
         @param {express.Response} res: The response object
         @returns {Promise<void>}:
         @remarks: Handles the get recipe request
         @async
     */
    getRecipe = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }

            // Retrieve the recipe
            const recipe = await this.mongoDBService.findOne<RecipeModel>(this.settings.database, this.settings.collection, { _id: new ObjectId(req.params.id), _userId: req.body.user._id });
            if (!recipe) {
                res.status(404).send({ error: "Recipe not found" });
                return;
            }

            // Retrieve the user's tags
            const userId = req.body.user._id;
            const user = await this.mongoDBService.findOne<UserLoginModel>(this.securitySettings.database, this.securitySettings.collection, { _id: userId });
            if (!user) {
                res.status(404).send({ error: "User not found" });
                return;
            }

            // Map the tag IDs in recipe.tags to their corresponding names
            const tags = recipe.tags.map((tagId: ObjectId) => {
                const tag = user.tags ? user.tags.find((userTag: any) => userTag._id.equals(tagId)) : null;
                return tag ? { _id: tag._id.toString(), name: tag.name } : { _id: tagId.toString(), name: "" };
            });

            // Send the updated recipe model with the tags in the desired format
            res.send({
                ...recipe,
                tags: tags
            });
        } catch (error) {
            res.status(500).send({ error: error });
        }
    }

    /* postAddRecipe(req: express.Request, res: express.Response): Promise<void>
        @param {express.Request} req: The request object
        @param {express.Response} res: The response object
        @returns {Promise<void>}:
        @remarks: Handles the add recipe request
        @async
    */
    postAddRecipe = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }

            // takes req.body.tags and creates new tags
            let tags = req.body.tags;
            let tagIds: ObjectId[] = [];
            for (let tag of tags) {
                const tagReq = {
                    body: {
                        user: req.body.user,
                        tag: tag
                    }
                } as express.Request;

                const tagResult = await this.securityController.postTag(tagReq, res);
                if (!tagResult.success) {
                    res.status(500).send({ error: tagResult.error });
                    return;
                }
                if (tagResult.tagId) {
                    tagIds.push(tagResult.tagId); // Collect the tag IDs
                    await this.updateTagCount(req.body.user._id, tagResult.tagId, true); // Increment tag count
                } else {
                    res.status(500).send({ error: "Failed to create tag" });
                    return;
                }
            }

            let recipe: RecipeModel = {
                _userId: req.body.user._id,
                name: req.body.name,
                source: req.body.source,
                favorite: req.body.favorite,
                description: req.body.description,
                instructions: req.body.instructions,
                ingredients: req.body.ingredients.map((ingredient: any) => ({
                    name: ingredient.name,
                    quantity: ingredient.quantity,
                    unitOfMeasure: ingredient.unitOfMeasure
                })),
                tags: tagIds, // Set the collected tag IDs
                image: req.body.image ? await this.processImage(req.body.image) : "",
                rating: req.body.rating,
                comments: req.body.comments,
                _created: new Date(),
                _updated: new Date()
            };
            const insertedRecipe = await this.mongoDBService.insertOne(this.settings.database, this.settings.collection, recipe);
            if (insertedRecipe)
                res.status(201).send({ success: true, _id: insertedRecipe._id });
            else
                res.status(500).send({ error: "Failed to add recipe" });

        } catch (error) {
            res.status(500).send({ error: error });
        }
    }

    /* putUpdateRecipe(req: express.Request, res: express.Response): Promise<void>
        @param {express.Request} req: The request object
        expects the id of the recipe to be in the params array of the request object as id
        @param {express.Response} res: The response object
        @returns {Promise<void>}:
        @remarks: Handles the update recipe request
        @async
    */
    putUpdateRecipe = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            const existingRecipe = await this.mongoDBService.findOne<RecipeModel>(this.settings.database, this.settings.collection, { _id: new ObjectId(req.params.id) });
            if (!existingRecipe) {
                res.status(404).send({ error: "Recipe not found" });
                return;
            }

            let tagIds: ObjectId[] = [];
            if (req.body.tags && req.body.tags.length > 0) {
                // Process tags if they are provided
                let tags = req.body.tags;
                for (let tag of tags) {
                    const tagReq = {
                        body: {
                            user: req.body.user,
                            tag: tag
                        }
                    } as express.Request;

                    const tagResult = await this.securityController.postTag(tagReq, res);
                    if (!tagResult.success) {
                        res.status(500).send({ error: tagResult.error });
                        return;
                    }
                    if (tagResult.tagId) {
                        tagIds.push(tagResult.tagId); // Collect the tag IDs
                        await this.updateTagCount(req.body.user._id, tagResult.tagId, true); // Increment tag count
                    } else {
                        res.status(500).send({ error: "Failed to create tag" });
                        return;
                    }
                }

                // Decrement the count for the tags that are being removed
                for (let tagId of existingRecipe.tags) {
                    if (!tagIds.includes(tagId)) {
                        await this.updateTagCount(req.body.user._id, tagId, false); // Decrement tag count
                    }
                }
            } else {
                // If no tags are provided, set tags to an empty array and decrement the count for all existing tags
                for (let tagId of existingRecipe.tags) {
                    await this.updateTagCount(req.body.user._id, tagId, false); // Decrement tag count
                }
                tagIds = [];
            }

            const recipeId = new ObjectId(req.params.id);
            let recipe: RecipeModel = {
                _userId: req.body.user._id || existingRecipe._userId,
                name: req.body.name || existingRecipe.name,
                source: req.body.source || existingRecipe.source,
                favorite: req.body.favorite !== undefined ? req.body.favorite : existingRecipe.favorite,
                description: req.body.description || existingRecipe.description,
                instructions: req.body.instructions || existingRecipe.instructions,
                ingredients: req.body.ingredients ? req.body.ingredients.map((ingredient: any) => ({
                    name: ingredient.name,
                    quantity: ingredient.quantity,
                    unitOfMeasure: ingredient.unitOfMeasure
                })) : existingRecipe.ingredients,
                tags: tagIds, // Set the collected tag IDs or keep existing tags
                image: req.body.image ? await this.processImage(req.body.image) : existingRecipe.image,
                rating: req.body.rating || existingRecipe.rating,
                comments: req.body.comments || existingRecipe.comments,
                _updated: new Date()
            };
            let command = { $set: recipe };
            const success = await this.mongoDBService.updateOne(this.settings.database, this.settings.collection, { _id: recipeId }, command);
            if (success)
                res.send({ success: true });
            else
                res.status(500).send({ error: "Failed to update recipe" });

        } catch (error) {
            res.status(500).send({ error: error });
        }
    }

    /* deleteRecipe(req: express.Request, res: express.Response): Promise<void>
            @param {express.Request} req: The request object
            expects the id of the recipe to be in the params array of the request object as id
        @param {express.Response} res: The response object
        @returns {Promise<void>}:
        @remarks: Handles the delete recipe request and archives the recipe
        @async
    */
    deleteRecipe = async (req: express.Request, res: express.Response): Promise<void> => {
        try {
            const result = await this.mongoDBService.connect();
            if (!result) {
                res.status(500).send({ error: "Database connection failed" });
                return;
            }
            const recipeId = new ObjectId(req.params.id);
            const recipe = await this.mongoDBService.findOne<RecipeModel>(this.settings.database, this.settings.collection, { _id: recipeId });
            if (!recipe) {
                res.status(404).send({ error: "Recipe not found" });
                return;
            }
            let success = await this.mongoDBService.insertOne(this.settings.database, this.settings.archiveCollection, recipe);
            if (!success) {
                console.log("Failed to archive recipe");
                return;
            }
            success = await this.mongoDBService.deleteOne(this.settings.database, this.settings.collection, { _id: recipeId });
            if (!success) {
                res.status(500).send({ error: "Failed to delete recipe" });
                return;
            }

            // Decrement the count for the tags in the deleted recipe
            for (let tagId of recipe.tags) {
                await this.updateTagCount(recipe._userId, tagId, false); // Decrement tag count
            }

        } catch (error) {
            res.status(500).send({ error: error });
        }
        res.send({ success: true });
    }

    private async processImage(image: string): Promise<string> {
        try {
            let imgBuffer: Buffer;

            // Check if the input is a Base64 string or a URL
            if (image.startsWith("data:image/")) {
                // If Base64, extract the Base64 data
                const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
                imgBuffer = Buffer.from(base64Data, "base64");
            } else {
                // If URL, download the image
                const response = await axios.get(image, { responseType: "arraybuffer" });
                imgBuffer = Buffer.from(response.data);
            }

            // Use sharp to resize the image and compress it
            const processedImageBuffer = await sharp(imgBuffer)
                .resize(500, 500, {
                    fit: sharp.fit.cover,
                    position: sharp.strategy.entropy
                })
                .jpeg({ quality: 80 }) // Adjust the quality as needed
                .toBuffer();

            // Convert the processed image buffer back to a Base64 string
            const processedImageBase64 = processedImageBuffer.toString("base64");

            // Return the processed image as a data URL
            return `data:image/jpeg;base64,${processedImageBase64}`;
        } catch (error) {
            console.error("Error processing image:", error);
            throw new Error("Failed to process image");
        }
    }

    private async updateTagCount(userId: ObjectId, tagId: ObjectId, increment: boolean): Promise<void> {
        const user = await this.mongoDBService.findOne<UserLoginModel>(this.securitySettings.database, this.securitySettings.collection, { _id: userId });
        if (!user) {
            throw new Error("User not found");
        }
        const tagIndex = user.tags.findIndex(tag => tag._id.equals(tagId));
        if (tagIndex < 0) {
            throw new Error("Tag not found");
        }
        user.tags[tagIndex].number += increment ? 1 : -1;
        if (user.tags[tagIndex].number <= 0) {
            user.tags.splice(tagIndex, 1); // Remove the tag if the count is 0 or less
        }
        await this.mongoDBService.updateOne(this.securitySettings.database, this.securitySettings.collection, { _id: userId }, { $set: { tags: user.tags } });
    }

    /* Get a recipe's data from a URL and add it to the database */
    extractRecipeFromURL = async (req: express.Request, res: express.Response): Promise<void> => {
        let { url } = req.body;

        if (!url) {
            res.status(400).send({ error: "URL is required" });
            return;
        }

        // Remove trailing slash if it exists
        url = url.replace(/\/$/, "");

        try {
            const recipeData = await this.extractRecipeService.extractRecipe(url);

            // Convert the extracted data to the structure needed for postAddRecipe()
            const newReq = {
                body: {
                    user: req.body.user, // Ensure the user is passed from the original request
                    name: recipeData.name,
                    source: url, // Use the URL as the source
                    favorite: false, // Default value for favorite
                    description: recipeData.description,
                    instructions: recipeData.instructions,
                    ingredients: recipeData.ingredients,
                    tags: [], // Tags can be added as needed
                    image: recipeData.image,
                    rating: null, // Default value
                    comments: [] // Default value
                }
            } as express.Request;

            // Use postAddRecipe to create the recipe in the database
            await this.postAddRecipe(newReq, res);

        } catch (error) {
            res.status(500).send({ error: "Failed to extract recipe data (from controller)" });
        }
    };

    /* Generate a recipe based on provided user input */
    generateRecipe = async (req: express.Request, res: express.Response): Promise<void> => {
        const { ingredients, cuisine, mealType, cookTime, equipment, otherSpecifications } = req.body;

        // Validate the ingredients input
        if (!ingredients || !Array.isArray(ingredients)) {
            res.status(400).send({ error: "Ingredients must be an array" });
            return;
        }

        // Validate the equipment input (ensure it is an object)
        if (equipment && typeof equipment !== 'object') {
            res.status(400).send({ error: "Equipment must be an object" });
            return;
        }

        try {
            // Call service to generate a recipe
            const recipeData = await this.generateRecipeService.generateRecipe({
                ingredients: ingredients || ['any'],
                cuisine: cuisine || 'any',
                mealType: mealType || 'any',
                cookTime: cookTime || 'any',
                equipment: equipment || {},
                otherSpecifications: otherSpecifications || 'None',
            });

            // Format the generated recipe for postAddRecipe
            const newReq = {
                body: {
                    user: req.body.user, // Pass the user from the original request
                    name: recipeData.name,
                    source: "AI Generated",
                    favorite: false,
                    description: recipeData.description,
                    instructions: recipeData.instructions,
                    ingredients: recipeData.ingredients,
                    tags: [],
                    image: recipeData.imageUrl || "",
                    rating: null,
                    comments: []
                }
            } as express.Request;

            // Add it to the user's recipes
            await this.postAddRecipe(newReq, res);

        } catch (error) {
            res.status(500).send({ error: "Failed to generate recipe (from controller)" });
        }
    };
}