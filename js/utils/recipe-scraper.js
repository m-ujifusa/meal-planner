/**
 * Recipe URL Scraper
 * Extracts recipe data from URLs using various methods
 */

/**
 * Import recipe from URL
 * @param {string} url - Recipe URL
 * @returns {Promise<Object>} - Parsed recipe data
 */
export async function importRecipeFromUrl(url) {
    try {
        console.log('Fetching recipe from:', url);

        // Use CORS proxy to bypass browser restrictions
        // Using corsproxy.io as a free CORS proxy service
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

        console.log('Using proxy URL:', proxyUrl);

        const response = await fetch(proxyUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();

        console.log('HTML fetched, length:', html.length);

        // Try to extract recipe data
        const recipe = extractRecipeData(html, url);

        if (!recipe) {
            throw new Error('Could not extract recipe data from this URL');
        }

        console.log('Recipe extracted:', recipe.name);
        console.log('Found ingredients:', recipe.ingredients?.length || 0);

        return recipe;
    } catch (error) {
        console.error('Error fetching recipe:', error);
        throw new Error('Failed to import recipe. The site may be blocking access or the URL may be invalid.');
    }
}

/**
 * Extract recipe data from HTML
 * @param {string} html - Page HTML
 * @param {string} url - Original URL (for source)
 * @returns {Object} - Recipe data
 */
function extractRecipeData(html, url) {
    // Try JSON-LD (schema.org) first - most recipe sites use this
    const jsonLdRecipe = extractJsonLd(html);
    if (jsonLdRecipe) {
        return jsonLdRecipe;
    }

    // Fallback to parsing HTML directly
    return extractFromHtml(html, url);
}

/**
 * Extract recipe from JSON-LD schema.org markup
 * @param {string} html
 * @returns {Object|null}
 */
function extractJsonLd(html) {
    try {
        // Find all JSON-LD script tags
        const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

        if (!jsonLdMatches) {
            console.log('No JSON-LD found in HTML');
            return null;
        }

        console.log('Found', jsonLdMatches.length, 'JSON-LD blocks');

        // Look for Recipe schema
        for (const match of jsonLdMatches) {
            const jsonText = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
            const data = JSON.parse(jsonText);

            // Handle both single recipe and array of recipes
            const recipes = Array.isArray(data) ? data : [data];

            for (const item of recipes) {
                // Check if this is a Recipe or if it contains a Recipe in @graph
                let recipe = null;

                if (item['@type'] === 'Recipe') {
                    recipe = item;
                } else if (item['@graph']) {
                    recipe = item['@graph'].find(g => g['@type'] === 'Recipe');
                }

                if (recipe) {
                    console.log('Found Recipe schema, parsing...');
                    return parseJsonLdRecipe(recipe);
                }
            }
        }

        return null;
    } catch (error) {
        console.error('Error parsing JSON-LD:', error);
        return null;
    }
}

/**
 * Parse JSON-LD recipe object
 * @param {Object} recipe - JSON-LD recipe object
 * @returns {Object}
 */
function parseJsonLdRecipe(recipe) {
    // Extract name
    const name = recipe.name || 'Untitled Recipe';

    // Extract cook time (convert ISO 8601 duration to minutes)
    let cookTime = 0;
    const totalTime = recipe.totalTime || recipe.cookTime || recipe.prepTime;
    if (totalTime) {
        cookTime = parseDuration(totalTime);
    }

    // Extract servings
    let servings = 4; // default
    if (recipe.recipeYield) {
        const yieldMatch = String(recipe.recipeYield).match(/\d+/);
        if (yieldMatch) {
            servings = parseInt(yieldMatch[0]);
        }
    }

    // Extract instructions
    let instructions = '';
    if (recipe.recipeInstructions) {
        if (typeof recipe.recipeInstructions === 'string') {
            instructions = recipe.recipeInstructions;
        } else if (Array.isArray(recipe.recipeInstructions)) {
            instructions = recipe.recipeInstructions
                .map((step, index) => {
                    if (typeof step === 'string') {
                        return `${index + 1}. ${step}`;
                    } else if (step.text) {
                        return `${index + 1}. ${step.text}`;
                    }
                    return '';
                })
                .filter(s => s)
                .join('\n\n');
        }
    }

    // Extract ingredients
    const ingredients = [];
    if (recipe.recipeIngredient && Array.isArray(recipe.recipeIngredient)) {
        recipe.recipeIngredient.forEach(ing => {
            const parsed = parseIngredient(ing);
            if (parsed) {
                ingredients.push(parsed);
            }
        });
    }

    return {
        name,
        cook_time_mins: cookTime,
        servings,
        instructions,
        ingredients,
        source: recipe.author?.name || 'Imported from URL',
    };
}

/**
 * Parse ISO 8601 duration to minutes
 * @param {string} duration - e.g., "PT30M" or "PT1H30M"
 * @returns {number}
 */
function parseDuration(duration) {
    if (!duration) return 0;

    const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!matches) return 0;

    const hours = parseInt(matches[1] || 0);
    const minutes = parseInt(matches[2] || 0);

    return hours * 60 + minutes;
}

/**
 * Parse ingredient string into components
 * @param {string} ingredientStr - e.g., "2 cups flour"
 * @returns {Object|null}
 */
function parseIngredient(ingredientStr) {
    // Simple regex to extract quantity, unit, and item
    // Matches patterns like: "2 cups flour", "1/2 teaspoon salt", "3 eggs"
    const pattern = /^([\d\/\.\s]+)?\s*([a-zA-Z]+)?\s+(.+)$/;
    const match = ingredientStr.trim().match(pattern);

    if (!match) {
        // If no match, treat entire string as item name
        return {
            item: ingredientStr.trim().toLowerCase(),
            quantity: '',
            unit: '',
            category: 'other',
        };
    }

    const quantity = match[1]?.trim() || '1';
    const unit = match[2]?.trim() || '';
    const item = match[3]?.trim().toLowerCase() || ingredientStr.toLowerCase();

    // Try to guess category based on item name
    const category = guessCategory(item);

    return {
        item,
        quantity,
        unit,
        category,
    };
}

/**
 * Guess ingredient category based on item name
 * @param {string} item
 * @returns {string}
 */
function guessCategory(item) {
    const lowerItem = item.toLowerCase();

    // Produce
    if (/vegetable|lettuce|tomato|onion|garlic|potato|carrot|celery|pepper|spinach|kale|cucumber|zucchini|squash|broccoli|cauliflower|cabbage|mushroom|corn|peas|beans|fruit|apple|banana|orange|lemon|lime|berry|melon/.test(lowerItem)) {
        return 'produce';
    }

    // Protein
    if (/chicken|beef|pork|turkey|fish|salmon|tuna|shrimp|meat|steak|bacon|sausage|ham|egg/.test(lowerItem)) {
        return 'protein';
    }

    // Dairy
    if (/milk|cream|cheese|butter|yogurt|sour cream/.test(lowerItem)) {
        return 'dairy';
    }

    // Frozen
    if (/frozen/.test(lowerItem)) {
        return 'frozen';
    }

    // Bakery
    if (/bread|bun|roll|tortilla|pita/.test(lowerItem)) {
        return 'bakery';
    }

    // Default to pantry
    return 'pantry';
}

/**
 * Extract recipe from HTML (fallback method)
 * @param {string} html
 * @param {string} url
 * @returns {Object}
 */
function extractFromHtml(html, url) {
    // This is a basic fallback - it won't work well for all sites
    // But it's better than nothing

    // Try to find title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const name = titleMatch ? titleMatch[1].replace(/\s*[-|]\s*.+$/, '').trim() : 'Imported Recipe';

    return {
        name,
        cook_time_mins: 30,
        servings: 4,
        instructions: 'Please manually enter instructions from the source website.',
        ingredients: [],
        source: url,
    };
}
