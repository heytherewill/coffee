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
        for (const recipe of recipesInDisplay) {
            // TODO: Create actual render of each recipe.
            const recipeElement = document.createElement('li');
            recipeElement.innerHTML = `
                <div class="recipeHeader">
                    <img src="https://placehold.co/70x70"/>
                    <div>
                    <h3>${recipe.name}</h3>
                        <h5>
                            <i class="fa-solid fa-weight-scale"></i>${recipe.grounds}gr
                            <i class="fa-solid fa-droplet"></i>${recipe.water}ml
                            <i class="fa-solid fa-clock"></i>${recipe.timeInSeconds} seconds</h5>
                        <h4></h4>
                    </div>
                </div>
                <div class="instructions">
                    ${recipe.instructions}
                </div>`
            
            const showInstructionsLink = document.createElement('a');
            showInstructionsLink.href = '#';
            showInstructionsLink.innerHTML = 'Show instructions';
            showInstructionsLink.onclick = function showInstructionsToggle() {
                const instructions = recipeElement.querySelector('.instructions');
                instructions.classList.toggle('visible');
                showInstructionsLink.innerHTML = instructions.classList.contains('visible') ? 'Hide instructions' : 'Show instructions';
            };
            const instructionsContainer = recipeElement.querySelector('h4');
            instructionsContainer.appendChild(showInstructionsLink);

            recipeList.appendChild(recipeElement);
        }
    }
})();