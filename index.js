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

            const formattedTime = formatTimeFromSeconds(recipe.timeInSeconds, 'short');
            const instructions = renderInstructions(recipe);

            const recipeElement = document.createElement('li');
            recipeElement.innerHTML = `
                <div class="recipeHeader">
                    <img src="/img/${recipe.method}.png"/>
                    <div>
                    <h3>${recipe.name}</h3>
                        <h5>
                            <i class="fa-solid fa-weight-scale"></i>${recipe.grounds}gr
                            <i class="fa-solid fa-droplet"></i>${recipe.water}ml
                            <i class="fa-solid fa-clock"></i>${formattedTime}</h5>
                        <h4></h4>
                    </div>
                </div>
                <div class="instructions">
                    <ol>
                        ${instructions}
                    </ol>
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

        function formatTimeFromSeconds(seconds, style) {
            const secondsInOneHour = 3600;
            const secondsInOneMinute = 60;

            const hours = Math.floor(seconds / secondsInOneHour);
            const remainingSecondsAfterHours = seconds - (hours * secondsInOneHour);
            const minutes = Math.floor(remainingSecondsAfterHours / secondsInOneMinute);
            const remainingSeconds = remainingSecondsAfterHours - (minutes * secondsInOneMinute);
            
            const duration = {
                hours: hours,
                minutes: minutes,
                seconds: remainingSeconds
            };

            const durationFormatter = new Intl.DurationFormat("en", { style: style });
            return durationFormatter.format(duration);
        }

        function renderInstructions(recipe) {
            const instructionList = document.createElement('ol');

            const grindSettingInstruction = document.createElement('li');
            grindSettingInstruction.innerHTML = `Grind the beans with the grinder set at ${recipe.grinderSetting} clicks.`;
            instructionList.appendChild(grindSettingInstruction);

            for (const instruction of recipe.instructions) {
                const instructionElement = document.createElement('li');
                instructionElement.innerHTML = replaceInstructionItems(instruction);
                instructionList.appendChild(instructionElement);
            }

            return instructionList.getHTML();

            function replaceInstructionItems(instruction) {
                return instruction
                    .replace("{{time}}", formatTimeFromSeconds(recipe.timeInSeconds, 'long'))
                    .replace("{{water}}", recipe.water);
            }
        }
    }
})();