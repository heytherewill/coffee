(async function main() {
  const recipesContainer = document.querySelector("#recipes");
  const recipeCount = document.querySelector("#recipe-count");
  const filters = document.querySelector("#filters");
  const searchInput = document.querySelector("#recipe-search");
  const methodFilter = document.querySelector("#method-filter");
  const timeFilter = document.querySelector("#time-filter");
  const temperatureFilter = document.querySelector("#temperature-filter");
  const clearFiltersButton = document.querySelector("#clear-filters");
  const themeToggle = document.querySelector("#theme-toggle");
  const methodLabels = new Map();
  const recipeElements = new Map();
  let allRecipes = [];
  let recipeList;
  let emptyState;
  let wakeLock = null;

  applyTheme(getSavedTheme() || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    try { window.localStorage.setItem("coffee-theme", nextTheme); } catch (error) { /* Theme still works for this visit. */ }
  });

  try {
    const response = await fetch("recipes.json");
    if (!response.ok) throw new Error("Could not load recipes");
    allRecipes = await response.json();
    populateMethods(allRecipes);
    createRecipeList(allRecipes);
    readFiltersFromUrl();
    applyFilters();
  } catch (error) {
    recipesContainer.textContent = "The menu is taking a coffee break. Please try again shortly.";
  }

  filters.addEventListener("submit", event => event.preventDefault());
  filters.addEventListener("input", applyFilters);
  filters.addEventListener("change", applyFilters);
  clearFiltersButton.addEventListener("click", clearFilters);
  window.addEventListener("popstate", () => {
    readFiltersFromUrl();
    applyFilters(false);
  });

  function populateMethods(recipes) {
    [...new Set(recipes.map(recipe => recipe.method))].forEach(method => {
      methodLabels.set(method, inferMethodLabel(method, recipes));
      const option = document.createElement("option");
      option.value = method;
      option.textContent = methodLabel(method);
      methodFilter.appendChild(option);
    });
  }

  function readFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    searchInput.value = params.get("q") || "";
    methodFilter.value = [...methodFilter.options].some(option => option.value === params.get("method")) ? params.get("method") : "";
    timeFilter.value = ["quick", "medium", "ahead"].includes(params.get("time")) ? params.get("time") : "";
    temperatureFilter.value = ["hot", "cold"].includes(params.get("temperature")) ? params.get("temperature") : "";
  }

  function applyFilters(updateUrl = true) {
    const state = { query: searchInput.value.trim(), method: methodFilter.value, time: timeFilter.value, temperature: temperatureFilter.value };
    const matches = allRecipes
      .map((recipe, index) => ({ recipe, index, score: searchScore(recipe, state.query) }))
      .filter(({ recipe, score }) => score !== -1 && (!state.method || recipe.method === state.method) && matchesTime(recipe, state.time) && (!state.temperature || recipe.temperature === state.temperature))
      .sort((a, b) => state.query ? b.score - a.score || a.index - b.index : a.index - b.index)
      .map(({ recipe }) => recipe);

    recipeCount.textContent = `${matches.length} ${matches.length === 1 ? "recipe" : "recipes"}`;
    animateUpdate(recipeCount);
    setAnimatedVisibility(clearFiltersButton, Boolean(state.query || state.method || state.time || state.temperature));
    updateRecipeList(matches);
    if (updateUrl) writeFiltersToUrl(state);
  }

  function matchesTime(recipe, time) {
    if (time === "quick") return recipe.timeInSeconds < 300;
    if (time === "medium") return recipe.timeInSeconds >= 300 && recipe.timeInSeconds < 900;
    if (time === "ahead") return recipe.timeInSeconds >= 900;
    return true;
  }

  function writeFiltersToUrl({ query, method, time, temperature }) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (method) params.set("method", method);
    if (time) params.set("time", time);
    if (temperature) params.set("temperature", temperature);
    const queryString = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${queryString ? `?${queryString}` : ""}`);
  }

  function clearFilters() {
    searchInput.value = "";
    methodFilter.value = "";
    timeFilter.value = "";
    temperatureFilter.value = "";
    applyFilters();
    searchInput.focus();
  }

  function createRecipeList(recipes) {
    recipeList = document.createElement("ul");
    recipeList.className = "recipe-list";
    recipes.forEach((recipe, index) => {
      const item = document.createElement("li");
      item.className = "recipe";
      const instructionsId = `instructions-${index}`;
      const toggleId = `toggle-${index}`;
      const scaleId = `scale-${index}`;
      const baseCoffee = coffeeIngredient(recipe).amount;
      item.innerHTML = `
        <div class="recipe__summary">
          <img class="recipe__image" src="img/${recipe.method}.png" alt="${methodLabel(recipe.method)} coffee brewer">
          <div>
            <h3 class="recipe__name">${recipe.name}</h3>
            <p class="recipe__details">${recipeDetails(recipe, getIngredients(recipe))}</p>
          </div>
          <button class="recipe__toggle" id="${toggleId}" type="button" aria-expanded="false" aria-controls="${instructionsId}">View recipe</button>
        </div>
        <div class="instructions" id="${instructionsId}" role="region" aria-labelledby="${toggleId}">
          <section class="scale" aria-labelledby="${scaleId}-heading">
            <button class="scale__toggle" id="${scaleId}-toggle" type="button" aria-expanded="false" aria-controls="${scaleId}">Scale this brew</button>
            <div class="scale__body" id="${scaleId}" hidden>
              <div class="scale__heading"><h4 id="${scaleId}-heading">Make it your amount</h4><button class="scale__reset" type="button" hidden>Reset</button></div>
              <label class="scale__label" for="${scaleId}-coffee">Coffee</label>
              <div class="scale__control">
                <button class="scale__step" type="button" data-direction="-1" aria-label="Decrease coffee">−</button>
                <input id="${scaleId}-coffee" type="number" inputmode="decimal" min="5" max="50" step="0.1" value="${baseCoffee}" aria-describedby="${scaleId}-help ${scaleId}-error">
                <span>g</span>
                <button class="scale__step" type="button" data-direction="1" aria-label="Increase coffee">+</button>
              </div>
              <p class="scale__help" id="${scaleId}-help">Original: ${formatAmount(baseCoffee, "coffee")} · <span class="scale__ratio"></span></p>
              <p class="scale__error" id="${scaleId}-error" role="alert"></p>
              <div class="scale__presets" aria-label="Coffee amount presets"><button type="button" data-factor="0.5">½</button><button type="button" data-factor="1">Original</button><button type="button" data-factor="2">2×</button></div>
              <dl class="scale__results"></dl>
            </div>
          </section>
          <h4>Method</h4>
          <ol class="recipe__instruction-list">${instructionItems(recipe, getIngredients(recipe))}</ol>
        </div>`;

      const button = item.querySelector("button");
      const instructions = item.querySelector(".instructions");
      button.addEventListener("click", () => {
        const isOpen = !instructions.classList.contains("visible");
        setExpanded(instructions, isOpen);
        button.setAttribute("aria-expanded", String(isOpen));
        button.textContent = isOpen ? "Hide recipe" : "View recipe";
        if (isOpen) requestWakeLock();
      });
      attachScaling(item, recipe, baseCoffee);
      recipeElements.set(recipe, item);
      recipeList.appendChild(item);
    });
    emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.hidden = true;
    emptyState.innerHTML = "<p>No recipes match those filters.</p><button type=\"button\">Clear filters</button>";
    emptyState.querySelector("button").addEventListener("click", clearFilters);
    recipesContainer.replaceChildren(recipeList, emptyState);
  }

  function updateRecipeList(recipes) {
    const items = recipes.map(recipe => recipeElements.get(recipe));
    if (recipes.length) {
      recipeList.replaceChildren(...items);
      setAnimatedVisibility(recipeList, true);
      setAnimatedVisibility(emptyState, false);
      animateUpdate(...items);
    } else {
      setAnimatedVisibility(recipeList, false);
      setAnimatedVisibility(emptyState, true);
      animateUpdate(emptyState);
    }
  }

  function searchScore(recipe, query) {
    if (!query) return 0;
    const normalizedQuery = normalize(query);
    const tokens = normalizedQuery.split(" ").filter(token => token.length > 2 || /^\d+$/.test(token) || token === "v60");
    if (!tokens.length) return 0;
    const fields = [
      { text: recipe.name, weight: 120 },
      { text: `${recipe.method} ${methodLabel(recipe.method)} ${recipe.method === "mizudashi" ? "cold brew" : ""}`, weight: 90 },
      { text: recipe.instructions.join(" "), weight: 50 },
      { text: `${recipe.temperature} ${getIngredients(recipe).map(ingredient => `${ingredient.amount} g ${ingredient.label}`).join(" ")} ${formatTime(recipe.timeInSeconds)} ${formatTime(recipe.timeInSeconds, "long")} ${recipe.grinderSetting} clicks grinder`, weight: 35 }
    ].map(field => ({ ...field, text: normalize(field.text) }));
    const fullText = fields.map(field => field.text).join(" ");
    if (!tokens.every(token => tokenMatches(token, fullText))) return -1;

    return fields.reduce((score, field) => {
      if (field.text.includes(normalizedQuery)) return score + field.weight * 3;
      return score + tokens.reduce((tokenScore, token) => tokenScore + (field.text.includes(token) ? field.weight : 0), 0);
    }, 0);
  }

  function tokenMatches(token, text) {
    if (text.includes(token)) return true;
    if (token.length < 4 || /^\d+$/.test(token)) return false;
    return text.split(" ").some(word => word.length >= 4 && levenshtein(token, word) <= (token.length >= 7 ? 2 : 1));
  }

  function normalize(value) {
    return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/(\d)\s*(ml|g|grams?|minutes?|mins?|seconds?|secs?|clicks?)/g, "$1 $2")
      .replace(/[^a-z0-9]+/g, " ").trim();
  }

  function levenshtein(first, second) {
    let previous = Array.from({ length: second.length + 1 }, (_, index) => index);
    for (let row = 1; row <= first.length; row += 1) {
      const current = [row];
      for (let column = 1; column <= second.length; column += 1) {
        current[column] = Math.min(current[column - 1] + 1, previous[column] + 1, previous[column - 1] + (first[row - 1] === second[column - 1] ? 0 : 1));
      }
      previous = current;
    }
    return previous[second.length];
  }

  function methodLabel(method) { return methodLabels.get(method) || formatMethod(method); }

  function inferMethodLabel(method, recipes) {
    const escapedMethod = method.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const mention = recipes
      .flatMap(recipe => [recipe.name, ...(recipe.instructions || [])])
      .join(" ")
      .match(new RegExp(`\\b${escapedMethod}\\b`, "i"));
    return mention ? mention[0] : formatMethod(method);
  }

  function formatMethod(method) {
    return method.replace(/[-_]+/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function getIngredients(recipe) {
    if (recipe.ingredients) return recipe.ingredients;
    return [
      { id: "coffee", label: "Coffee", amount: recipe.grounds, scalable: true },
      { id: "water", label: "Water", amount: recipe.water, scalable: true }
    ];
  }

  function coffeeIngredient(recipe) {
    return getIngredients(recipe).find(ingredient => ingredient.id === "coffee");
  }

  function recipeDetails(recipe, ingredients) {
    const icons = { coffee: "fa-weight-scale", water: "fa-droplet", ice: "fa-snowflake" };
    const details = ingredients.map(ingredient => `<span class="recipe__detail"><i class="fa-solid ${icons[ingredient.id] || "fa-circle"}" aria-hidden="true"></i>${formatAmount(ingredient.amount, ingredient.id)} ${ingredient.label.toLowerCase()}</span>`);
    details.push(`<span class="recipe__detail"><i class="fa-solid fa-clock" aria-hidden="true"></i>${formatTime(recipe.timeInSeconds)}</span>`);
    return details.join("");
  }

  function scaledIngredients(recipe, desiredCoffee) {
    const baseCoffee = coffeeIngredient(recipe);
    const factor = desiredCoffee / baseCoffee.amount;
    return getIngredients(recipe).map(ingredient => ({
      ...ingredient,
      amount: ingredient.id === baseCoffee.id ? desiredCoffee : ingredient.scalable ? roundIngredient(ingredient.amount * factor, ingredient.id) : ingredient.amount
    }));
  }

  function roundIngredient(amount, id) { return id === "coffee" ? Math.round(amount * 10) / 10 : Math.round(amount); }

  function formatAmount(amount, id) {
    const decimals = id === "coffee" && amount % 1 !== 0 ? 1 : 0;
    return `${Number(amount).toFixed(decimals)} g`;
  }

  function instructionItems(recipe, ingredients) {
    const values = Object.fromEntries(ingredients.map(ingredient => [ingredient.id, formatAmount(ingredient.amount, ingredient.id)]));
    const allInstructions = [
      `Grind the beans with the grinder set at ${recipe.grinderSetting} clicks.`,
      ...recipe.instructions.map(instruction => instruction.replace(/{{([^}]+)}}/g, (match, key) => {
        if (key === "time") return formatTime(recipe.timeInSeconds, "long");
        return values[key] ?? match;
      }))
    ];
    return allInstructions.map(instruction => `<li>${instruction}</li>`).join("");
  }

  function attachScaling(item, recipe, baseCoffee) {
    const panel = item.querySelector(".scale__body");
    const toggle = item.querySelector(".scale__toggle");
    const input = item.querySelector(".scale__control input");
    const reset = item.querySelector(".scale__reset");
    const results = item.querySelector(".scale__results");
    const ratio = item.querySelector(".scale__ratio");
    const error = item.querySelector(".scale__error");
    const details = item.querySelector(".recipe__details");
    const instructions = item.querySelector(".recipe__instruction-list");
    const minimum = 5;
    const maximum = 50;
    const step = 0.5;
    let lastValidCoffee = baseCoffee;

    toggle.addEventListener("click", () => {
      const isOpen = panel.hidden;
      setExpanded(panel, isOpen, true);
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.textContent = isOpen ? "Hide scaling" : "Scale this brew";
      if (isOpen) requestWakeLock();
    });

    function renderScale(coffee, shouldAnimate = false) {
      const ingredients = scaledIngredients(recipe, coffee);
      const water = ingredients.find(ingredient => ingredient.id === "water");
      const ratioValue = water ? water.amount / coffee : 0;
      details.innerHTML = recipeDetails(recipe, ingredients);
      instructions.innerHTML = instructionItems(recipe, ingredients);
      results.innerHTML = ingredients.filter(ingredient => ingredient.id !== "coffee" && ingredient.scalable).map(ingredient => `<div><dt>${ingredient.label}</dt><dd>${formatAmount(ingredient.amount, ingredient.id)}</dd></div>`).join("");
      ratio.textContent = water ? `Ratio 1:${ratioValue.toFixed(1)}` : "";
      reset.hidden = coffee === baseCoffee;
      if (shouldAnimate) animateUpdate(details, results, instructions);
    }

    function updateCoffee(coffee) {
      lastValidCoffee = coffee;
      input.value = coffee;
      error.textContent = "";
      input.removeAttribute("aria-invalid");
      renderScale(coffee, true);
    }

    input.addEventListener("input", () => {
      const coffee = Number(input.value);
      if (Number.isFinite(coffee) && coffee >= minimum && coffee <= maximum) updateCoffee(coffee);
    });
    input.addEventListener("change", () => {
      const coffee = Number(input.value);
      if (!Number.isFinite(coffee) || coffee < minimum || coffee > maximum) {
        error.textContent = `Enter an amount between ${formatAmount(minimum, "coffee")} and ${formatAmount(maximum, "coffee")}.`;
        input.setAttribute("aria-invalid", "true");
        return;
      }
      updateCoffee(coffee);
    });
    item.querySelectorAll(".scale__step").forEach(button => button.addEventListener("click", () => updateCoffee(Math.min(maximum, Math.max(minimum, Math.round((lastValidCoffee + Number(button.dataset.direction) * step) * 10) / 10)))));
    item.querySelectorAll(".scale__presets button").forEach(button => button.addEventListener("click", () => updateCoffee(Math.min(maximum, Math.max(minimum, baseCoffee * Number(button.dataset.factor))))));
    reset.addEventListener("click", () => updateCoffee(baseCoffee));
    renderScale(baseCoffee);
  }

  function animateUpdate(...elements) {
    elements.forEach(element => {
      element.classList.remove("is-updating");
      void element.offsetWidth;
      element.classList.add("is-updating");
    });
  }

  function getSavedTheme() {
    try {
      const theme = window.localStorage.getItem("coffee-theme");
      return theme === "dark" || theme === "light" ? theme : null;
    } catch (error) {
      return null;
    }
  }

  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = theme;
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.lastElementChild.textContent = isDark ? "Light mode" : "Dark mode";
  }

  function motionIsReduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function setExpanded(element, expanded, usesHiddenAttribute = false) {
    element.getAnimations().forEach(animation => animation.cancel());
    if (motionIsReduced()) {
      if (usesHiddenAttribute) element.hidden = !expanded;
      element.classList.toggle("visible", expanded);
      return;
    }

    if (expanded) {
      if (usesHiddenAttribute) element.hidden = false;
      element.classList.add("visible");
      element.style.height = "0px";
      element.style.overflow = "hidden";
      const animation = element.animate([
        { height: "0px", opacity: 0, transform: "translateY(-6px)" },
        { height: `${element.scrollHeight}px`, opacity: 1, transform: "translateY(0)" }
      ], { duration: 260, easing: "cubic-bezier(.2, .8, .2, 1)" });
      animation.onfinish = () => {
        element.style.height = "";
        element.style.overflow = "";
      };
      return;
    }

    const height = element.getBoundingClientRect().height;
    element.style.height = `${height}px`;
    element.style.overflow = "hidden";
    const animation = element.animate([
      { height: `${height}px`, opacity: 1, transform: "translateY(0)" },
      { height: "0px", opacity: 0, transform: "translateY(-6px)" }
    ], { duration: 210, easing: "ease-in" });
    animation.onfinish = () => {
      element.classList.remove("visible");
      if (usesHiddenAttribute) element.hidden = true;
      element.style.height = "";
      element.style.overflow = "";
    };
  }

  function setAnimatedVisibility(element, visible) {
    element.getAnimations().forEach(animation => animation.cancel());
    if (visible) {
      element.hidden = false;
      animateUpdate(element);
      return;
    }
    if (element.hidden || motionIsReduced()) {
      element.hidden = true;
      return;
    }
    const animation = element.animate([
      { opacity: 1, transform: "translateY(0)" },
      { opacity: 0, transform: "translateY(-4px)" }
    ], { duration: 150, easing: "ease-in" });
    animation.onfinish = () => { element.hidden = true; };
  }

  function formatTime(seconds, style = "short") {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    if (style === "long") return [hours && `${hours} hour${hours === 1 ? "" : "s"}`, minutes && `${minutes} minute${minutes === 1 ? "" : "s"}`, remainingSeconds && `${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"}`].filter(Boolean).join(" ");
    return [hours && `${hours}h`, minutes && `${minutes}m`, remainingSeconds && `${remainingSeconds}s`].filter(Boolean).join(" ");
  }

  async function requestWakeLock() {
    if (!("wakeLock" in navigator) || wakeLock) return;
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    } catch (error) {
      // Some browsers require an explicit interaction or do not support Wake Lock.
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && document.querySelector(".instructions.visible")) requestWakeLock();
  });
})();
