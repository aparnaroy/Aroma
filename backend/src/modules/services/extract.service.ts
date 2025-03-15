import { OpenAI } from "openai";
import puppeteer from "puppeteer";

export class ExtractRecipeService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    // Function to scrape recipe data from a webpage using Puppeteer
    private async scrapeRecipeData(url: string): Promise<any> {
        const cookedUrl = `https://cooked.wiki/${url}`;
        
        const browser = await puppeteer.launch({
            headless: true, // Run in headless mode for better performance
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Avoid extra overhead
        });
        
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Block unnecessary resources to speed up page load
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const url = req.url();
            if (url.endsWith('.css') || url.endsWith('.js')) {
                req.abort(); // Block CSS, and JS to reduce load time
            } else {
                req.continue();
            }
        });

        try {
            console.log('Opening Cooked.Wiki:', cookedUrl);
            await page.goto(cookedUrl, { waitUntil: 'networkidle2', timeout: 15000 }); // Reduce timeout to 10s
            console.log('Scraping Cooked.Wiki:', cookedUrl);

            const recipeData = await page.evaluate(() => {
                const name = document.querySelector('div.title')?.textContent?.trim() || '';
                const image = document.querySelector('input[name="image-url"]')?.getAttribute('value') || '';
                const descriptionText = (document.querySelector('input[name="description"]') as HTMLInputElement)?.value || '';
                const descriptionLines = descriptionText.split('\n');
                const ingredientLines = descriptionLines.filter(line => line.startsWith('- ')).map(line => line.trim());
                const instructions = descriptionLines
                    .filter(line => /^[0-9]+\./.test(line))
                    .map(line => line.replace(/^[0-9]+\.\s*/, '').trim());

                return {
                    name: name,
                    image: image,
                    rawIngredients: ingredientLines,
                    instructions: instructions
                };
            });

            await browser.close();
            console.log('Scraped Recipe Data:', recipeData);
            return recipeData;
        } catch (error) {
            console.error('Error scraping Cooked.Wiki:', error);
            await browser.close();
            return null;
        }
    }

    // Function to extract recipe data from a webpage using AI
    public async extractRecipeWithAI(url: string, scrapedData: any) {
        const systemMessage = `
        You are a recipe assistant. Your job is to extract and structure recipe data into strict JSON format.
    
        Rules:
        1. Output only JSON. Do not include any additional text, explanations, or comments.
        2. The JSON should include the following keys:
            - "name" (string): The recipe name.
            - "description" (string): A 1-3 sentence description of the recipe food.
            - "image" (string): URL of the main recipe image from the webpage.
            - "ingredients" (array of objects): Each object contains:
                - "name" (string): Ingredient name.
                - "quantity" (number): Quantity of the ingredient (ensure this is not 0).
                - "unitOfMeasure" (string): Unit of measurement (if not provided, infer it).
            - "instructions" (array of strings): Step-by-step instructions.
    
        Example:
        {
            "name": "Chocolate Cake",
            "description": "...",
            "image": "https://example.com/image.jpg",
            "ingredients": [
                { "name": "flour", "quantity": 2, "unitOfMeasure": "cups" },
                { "name": "sugar", "quantity": 1.5, "unitOfMeasure": "cups" }
            ],
            "instructions": [
                "Mix all dry ingredients.",
                "Add wet ingredients and mix well.",
                "Bake at 350°F for 30 minutes."
            ]
        }
    
        If the quantity or unit of measure is missing, make an inference based on common knowledge of recipe ingredients. If the quantity is 0 or missing, assume a quantity of 1. 
        Do not deviate from this format.
        `;
    
        const userMessage = `
        Extract the following information for the recipe at ${url}:
        - Name: ${scrapedData.name}
        - Description: [Provide a description based on the page content at the URL.]
        - Image URL: ${scrapedData.image}
        - Raw Ingredients: ${JSON.stringify(scrapedData.rawIngredients)} (MAKE SURE THE QUANTITY IS A DECIMAL WITH NO '/', CONVERT FRACTIONS INTO DECIMALS IF NECESSARY)
        - Instructions: ${JSON.stringify(scrapedData.instructions)}
    
        Return the data in strict JSON format as described. Do not include any additional text or comments.
        `;
        
        console.log('Extracting recipe data using AI:', url);
        
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: userMessage },
                ],
            });
        
            let aiData = response.choices[0].message?.content;

            console.log('Raw AI Response BEFORE CLEANING:', aiData);

            // Clean up the AI response
            aiData = (aiData || '').replace(/```json|```/g, '').trim();
            // Remove markdown code block formatting
            aiData = aiData.replace(/^```json\n/, "").replace(/\n```$/, "");
            // Clean up any excess whitespace and ensure valid JSON structure
            aiData = aiData.replace(/\s+/g, ' ').trim();
            // Remove trailing commas, if any
            aiData = aiData.replace(/,\s*}/g, "}").replace(/,\s*\]/g, "]");
            // Ensure there are no stray commas in objects or arrays
            aiData = aiData.replace(/,(\s*[\]}])/g, '$1');  // Remove comma before closing braces/parentheses

            // Convert fraction quantities that aren't strings into decimals
            // Step 1: Convert mixed fractions to decimals
            aiData = aiData.replace(/\b(\d+)\s+(\d+)\s*\/\s*(\d+)\b/g, (_, wholeNumber, numerator, denominator) => {
                const fractionDecimal = parseInt(numerator) / parseInt(denominator);
                return (parseInt(wholeNumber) + fractionDecimal).toFixed(2); // Combine whole number and fraction
            });
            // Step 2: Convert regular fractions to decimals
            aiData = aiData.replace(/\b(\d+)\s*\/\s*(\d+)\b/g, (_, numerator, denominator) => {
                return (parseInt(numerator) / parseInt(denominator)).toFixed(2); // Convert the fraction to a decimal
            });

            // Check if the cleaned JSON still starts with a valid object/array
            if (!aiData.startsWith('{') && !aiData.startsWith('[')) {
                throw new Error("Invalid JSON structure: does not start with '{' or '['");
            }
            if (!aiData.endsWith('}') && !aiData.endsWith(']')) {
                throw new Error("Invalid JSON structure: must end with '}' or ']'");
            }
        
            console.log('Raw AI Response:', aiData);
        
            try {
                const aiJson = JSON.parse(aiData || '{}');
                
                // Process ingredients to ensure quantity and unit are valid
                const processedIngredients = aiJson.ingredients.map((ingredient: any) => {
                    // Make sure quanitity is a number and not 0
                    let quantity: number;
                    if (typeof ingredient.quantity === 'string') {
                        // Handle fraction format (e.g., "1/2" or "3 1/2")
                        const fractionMatch = ingredient.quantity.match(/^(\d+)\s+(\d+)\/(\d+)$/); // Mixed number (e.g., "3 1/2")
                        const simpleFractionMatch = ingredient.quantity.match(/^(\d+)\/(\d+)$/); // Simple fraction (e.g., "1/2")
                
                        if (fractionMatch) {
                            const wholeNumber = parseInt(fractionMatch[1], 10);
                            const numerator = parseInt(fractionMatch[2], 10);
                            const denominator = parseInt(fractionMatch[3], 10);
                            quantity = wholeNumber + numerator / denominator;
                        } else if (simpleFractionMatch) {
                            const numerator = parseInt(simpleFractionMatch[1], 10);
                            const denominator = parseInt(simpleFractionMatch[2], 10);
                            quantity = numerator / denominator;
                        } else {
                            quantity = parseFloat(ingredient.quantity) || 1;
                        }
                    } else {
                        quantity = Number(ingredient.quantity) || 1; // Handle numbers or invalid values
                    }
                    
                    // If unitOfMeasure is missing, take OpenAI's guess about what it is or use 'unit' as a fallback
                    let unitOfMeasure = ingredient.unitOfMeasure || 'unit';  // Use 'unit' as a fallback if needed
    
                    return {
                        ...ingredient,
                        quantity,
                        unitOfMeasure
                    };
                });

                console.log('WORK:', scrapedData.image, 'then', aiJson.image);
    
                // Return structured data
                return {
                    name: scrapedData.name || aiJson.name || '',
                    description: aiJson.description || '',
                    image: scrapedData.image || '',
                    ingredients: processedIngredients,
                    instructions: scrapedData.instructions.length > 0 ? scrapedData.instructions : aiJson.instructions || []
                };
            } catch (err) {
                console.error('Error parsing AI response:', err, aiData);
        
                // Return scraped data as a fallback if AI fails
                return {
                    name: scrapedData.name || '',
                    description: '',
                    image: scrapedData.image || '',
                    ingredients: [],
                    instructions: scrapedData.instructions || []
                };
            }
        } catch (error) {
            console.error('Error with OpenAI API request:', error);
            throw new Error('Error extracting recipe with OpenAI');
        }
    }
    
    
    // Main Function
    public async extractRecipe(url: string) {
        // Step 1: Scrape Cooked.Wiki
        let scrapedData = null;
        try {
            scrapedData = await this.scrapeRecipeData(url);
        } catch (error) {
            console.error('Error scraping recipe:', error);
        }

        // If scraping fails, we will use AI to generate the recipe data
        if (!scrapedData) {
            console.log('Scraping failed, using AI to generate recipe data.');
            
            // Use AI to extract the recipe
            const aiData = await this.extractRecipeWithAI(url, { name: '', image: '', rawIngredients: [], instructions: [] });
            
            return aiData;
        }

        // Step 2: Use OpenAI to fill in missing data + enhance it
        const recipeData = await this.extractRecipeWithAI(url, scrapedData);
        return recipeData;
    }
}
