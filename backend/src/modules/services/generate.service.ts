import { OpenAI } from "openai";

export class GenerateRecipeService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    // Generate a recipe 
    public async generateRecipe({
        ingredients,
        cuisine,
        mealType,
        cookTime,
        equipment,
        otherSpecifications
    }: {
        ingredients: string[];
        cuisine: string;
        mealType: string;
        cookTime: string;
        equipment: { [key: string]: boolean };
        otherSpecifications: string;
    }): Promise<any> {
        try {
            console.log("Generating recipe with the following specifications:", {
                ingredients,
                cuisine,
                mealType,
                cookTime,
                equipment,
                otherSpecifications,
            });

            const systemMessage = "You are a helpful assistant that generates recipes. Always format your response as a JSON object following the given schema.";

            // Filter out the equipment that is not available (those marked as false)
            const unavailableEquipment = Object.keys(equipment).filter(tool => !equipment[tool]);

            const prompt = `
                Generate a recipe using the following ingredients: ${ingredients.join(', ')}.
                It should be a recipe in the ${cuisine} cuisine that takes about ${cookTime} minutes to make. 
                Other specifications: ${otherSpecifications}.

                Please ensure the following:
                - The recipe should not include fractions for quantities. Use decimal numbers instead (e.g., use 0.5 instead of 1/2).
                - The meal should be suitable for ${mealType}.
                - The recipe should not require using any of the following equipment: ${unavailableEquipment.join(', ')}.

                Format your response as JSON strictly following this structure:

                {
                    "name": "string",
                    "description": "string",
                    "instructions": ["string"],
                    "ingredients": [
                        {
                            "name": "string",
                            "quantity": number,
                            "unitOfMeasure": "string"
                        }
                    ]
                }

                Instructions Guidance:
                - Write step-by-step instructions. Each step must be specific and describe only a single action or small set of related actions. 
                - Break complex actions into smaller, individual steps.
                - Make each step extremely detailed and specific enough for a beginner to understand and follow.
                - Include all preparation details (ex: "chop onions finely" instead of "prepare onions").
                - Describe cooking techniques.
                - Specify timings where appropriate.
                - Use clear language for each step (ex: describing how things should look or be done).
                - Include how to serve or garnish at the end.
                - Avoid generic steps like "cook until done." Be specific.
                - The more complex the dish, the more steps there should be in the recipe instructions.

                The description should be 2-3 sentences long and provide context about the dish (e.g., its flavor, how it complements the cuisine, or when it's best served).

                Make sure the quantity is always a number. If there is no quantity, assume a quantity of 1.
                Always include a unit of measure for each ingredient.
                Do not deviate from this format.
            `;

            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemMessage },
                    { role: "user", content: prompt },
                ],
                temperature: 0.7
            });

            let recipeJson = response.choices[0].message?.content?.trim();

            if (!recipeJson) {
                throw new Error("No response received from OpenAI.");
            }

            // Remove markdown code block formatting
            recipeJson = recipeJson.replace(/^```json\n/, "").replace(/\n```$/, "");
            // Clean up any excess whitespace and ensure valid JSON structure
            recipeJson = recipeJson.replace(/\s+/g, ' ').trim();
            // Remove trailing commas, if any
            recipeJson = recipeJson.replace(/,\s*}/g, "}").replace(/,\s*\]/g, "]");
            // Ensure there are no stray commas in objects or arrays
            recipeJson = recipeJson.replace(/,(\s*[\]}])/g, '$1');  // Remove comma before closing braces/parentheses
            // Handle escaping for any unescaped characters that may break JSON parsing
            recipeJson = recipeJson.replace(/\\([^\n])/g, '\\\\$1');  // Escape backslashes
            
            // Convert fraction quantities that aren't strings into decimals
            // Step 1: Convert mixed fractions to decimals
            recipeJson = recipeJson.replace(/\b(\d+)\s+(\d+)\s*\/\s*(\d+)\b/g, (_, wholeNumber, numerator, denominator) => {
                const fractionDecimal = parseInt(numerator) / parseInt(denominator);
                return (parseInt(wholeNumber) + fractionDecimal).toFixed(2); // Combine whole number and fraction
            });
            // Step 2: Convert regular fractions to decimals
            recipeJson = recipeJson.replace(/\b(\d+)\s*\/\s*(\d+)\b/g, (_, numerator, denominator) => {
                return (parseInt(numerator) / parseInt(denominator)).toFixed(2); // Convert the fraction to a decimal
            });

            // Check if the cleaned JSON still starts with a valid object/array
            if (!recipeJson.startsWith('{') && !recipeJson.startsWith('[')) {
                throw new Error("Invalid JSON structure: does not start with '{' or '['");
            }
            if (!recipeJson.endsWith('}') && !recipeJson.endsWith(']')) {
                throw new Error("Invalid JSON structure: must end with '}' or ']'");
            }
            
            console.log("Cleaned AI Response:", recipeJson);

            // Try parsing the JSON after cleanup
            const recipe = JSON.parse(recipeJson);

            // Generate an image for the recipe
            const imageUrl = await this.generateRecipeImage(recipe.name, recipe.description);
            recipe.imageUrl = imageUrl;

            console.log("Generated Recipe w/ Image:", recipe);

            // Validate and return the cleaned recipe
            return this.validateRecipeSchema(recipe);
        } catch (error) {
            console.error("Error generating recipe:", error);
            throw new Error("Failed to generate recipe");
        }
    }

    // Generate an image
    private async generateRecipeImage(recipeName: string, recipeDescription: string): Promise<string> {
        console.log("Generating image for recipe:", recipeName);
        try {
            const imageResponse = await this.openai.images.generate({
                prompt: `A delicious image of a dish named "${recipeName}". ${recipeDescription}`,
                n: 1,
                size: "512x512",
            });

            const imageUrl = imageResponse.data[0].url;
            console.log("Generated Image URL:", imageUrl);
            return imageUrl || "";
        } catch (error) {
            console.error("Error generating image:", error);
            throw new Error("Failed to generate recipe image");
        }
    }

    // Ensure the generated recipe matches the schema and remove extra fields
    private validateRecipeSchema(recipe: any): any {
        const schema: { [key: string]: string } = {
            name: "string",
            description: "string",
            instructions: "array",
            ingredients: "array",
            imageUrl: "string"
        };

        // Remove any extra fields that are not part of the schema
        for (const key in recipe) {
            if (!(key in schema)) {
                delete recipe[key]; // Remove unexpected field
            }
        }

        // Check for missing fields and validate the types
        for (const key in schema) {
            if (!(key in recipe)) {
                throw new Error(`Missing field: ${key}`);
            }

            const expectedType = schema[key];
            const actualType = Array.isArray(recipe[key]) ? "array" : typeof recipe[key];

            if (expectedType !== actualType) {
                throw new Error(`Invalid type for field ${key}: expected ${expectedType}, got ${actualType}`);
            }
        }

        // Validate instructions
        if (!recipe.instructions.every((instruction: any) => typeof instruction === "string")) {
            throw new Error(`Invalid instructions format: all instructions should be strings`);
        }

        // Validate ingredients and convert fractions to decimals
        recipe.ingredients = recipe.ingredients.map((ingredient: any, index: number) => {
            if (
                typeof ingredient.name !== "string" ||
                (typeof ingredient.quantity !== "number" && typeof ingredient.quantity !== "string") ||
                typeof ingredient.unitOfMeasure !== "string"
            ) {
                throw new Error(
                    `Invalid ingredient at index ${index}: must contain name (string), quantity (number or string), and unitOfMeasure (string)`
                );
            }

            // Convert all quantities to numbers
            if (typeof ingredient.quantity === "string") {
                ingredient.quantity = this.convertStringFractionsToDecimals(ingredient.quantity);
            }

            return ingredient;
        });

        // Return the cleaned recipe object
        console.log("Validated Recipe:", recipe);
        return recipe;
    }

    // Helper function to convert any string fractions to decimals
    private convertStringFractionsToDecimals(quantity: any): number {
        console.log("Converting Quantity:", quantity);
    
        if (typeof quantity === "number") {
            return parseFloat(quantity.toFixed(2)); // Already a number, no conversion needed
        }
    
        if (typeof quantity === "string") {
            if (quantity.includes("/")) {
                // Handle fractions
                const [numerator, denominator] = quantity.split("/").map(Number);
                if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
                    const result = numerator / denominator;
                    return parseFloat(result.toFixed(2));
                }
            } else if (!isNaN(parseFloat(quantity))) {
                // Handle valid decimal strings
                return parseFloat(quantity);
            }
        }
    
        throw new Error(`Invalid quantity format: ${quantity}`);
    }
}
