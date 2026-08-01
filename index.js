(async function main() {
    const response = await fetch("/recipes.json");
    const allRecipes = await response.json();
    var recipesInDisplay = allRecipes;
    renderRecipes();

    function renderRecipes() {
        const recipesContainer = document.querySelector("#recipes");
        // Clean everything inside the container.
        recipesContainer.innerHTML = '<ul id="recipeList"></ul>';
        const recipeList = recipesContainer.querySelector("#recipeList");
        for(const recipe of recipesInDisplay) {
            // TODO: Create actual render of each recipe.
            const recipeElement = document.createElement('li');
            recipeElement.innerHTML = `<h1>${recipe.name}</h1> <p>${recipe.instructions}</p>`;
            recipeList.appendChild(recipeElement);
        }
    }
})();