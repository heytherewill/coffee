(async function main() {
  const recipesContainer = document.querySelector("#recipes");
  const recipeCount = document.querySelector("#recipe-count");

  try {
    const response = await fetch("recipes.json");
    if (!response.ok) throw new Error("Could not load recipes");
    const recipes = await response.json();
    recipeCount.textContent = `${recipes.length} recipes`;
    renderRecipes(recipes);
  } catch (error) {
    recipesContainer.textContent = "The menu is taking a coffee break. Please try again shortly.";
  }

  function renderRecipes(recipes) {
    const list = document.createElement("ul");
    list.className = "recipe-list";

    recipes.forEach((recipe, index) => {
      const item = document.createElement("li");
      item.className = "recipe";
      const instructionsId = `instructions-${index}`;
      const toggleId = `toggle-${index}`;
      item.innerHTML = `
        <div class="recipe__summary">
          <img class="recipe__image" src="img/${recipe.method}.png" alt="${recipe.method} coffee brewer">
          <div>
            <h3 class="recipe__name">${recipe.name}</h3>
            <p class="recipe__details">
              <span class="recipe__detail"><i class="fa-solid fa-weight-scale" aria-hidden="true"></i>${recipe.grounds} g coffee</span>
              <span class="recipe__detail"><i class="fa-solid fa-droplet" aria-hidden="true"></i>${recipe.water} ml water</span>
              <span class="recipe__detail"><i class="fa-solid fa-clock" aria-hidden="true"></i>${formatTime(recipe.timeInSeconds)}</span>
            </p>
          </div>
          <button class="recipe__toggle" id="${toggleId}" type="button" aria-expanded="false" aria-controls="${instructionsId}">View recipe</button>
        </div>
        <div class="instructions" id="${instructionsId}" role="region" aria-labelledby="${toggleId}">
          <h4>Method</h4>
          <ol>${instructionItems(recipe)}</ol>
        </div>`;

      const button = item.querySelector("button");
      const instructions = item.querySelector(".instructions");
      button.addEventListener("click", () => {
        const isOpen = instructions.classList.toggle("visible");
        button.setAttribute("aria-expanded", String(isOpen));
        button.textContent = isOpen ? "Hide recipe" : "View recipe";
      });
      list.appendChild(item);
    });
    recipesContainer.replaceChildren(list);
  }

  function instructionItems(recipe) {
    const allInstructions = [
      `Grind the beans with the grinder set at ${recipe.grinderSetting} clicks.`,
      ...recipe.instructions.map(instruction => instruction
        .replace("{{time}}", formatTime(recipe.timeInSeconds, "long"))
        .replace("{{water}}", recipe.water))
    ];
    return allInstructions.map(instruction => `<li>${instruction}</li>`).join("");
  }

  function formatTime(seconds, style = "short") {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    if (style === "long") {
      return [hours && `${hours} hour${hours === 1 ? "" : "s"}`, minutes && `${minutes} minute${minutes === 1 ? "" : "s"}`, remainingSeconds && `${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"}`].filter(Boolean).join(" ");
    }
    return [hours && `${hours}h`, minutes && `${minutes}m`, remainingSeconds && `${remainingSeconds}s`].filter(Boolean).join(" ");
  }
})();
