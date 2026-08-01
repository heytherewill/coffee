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
            recipeElement.innerHTML =
`
                <div class="recipeHeader">
                    <img src="https://placehold.co/60x60"/>
                    <div>
                    <h3>${recipe.name}</h3>
                        <h5>${recipe.grounds}gr . ${recipe.water}ml . ${recipe.timeInSeconds} seconds</h5>
                        <h4>Show instructions</h4>
                    </div>
                </div>
                <div class="instructions">
                    ${recipe.instructions}
                </div>`

            recipeList.appendChild(recipeElement);
        }
    }
})();