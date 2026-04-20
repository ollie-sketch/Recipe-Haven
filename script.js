let favorites = JSON.parse(localStorage.getItem("recipeFavorites")) || [];
let mealCache = new Map();
let currentCategory = "Beef";
let currentSearchQuery = "";
let currentView = "home";
let categoriesData = [];

function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

function saveFavorites() {
  localStorage.setItem("recipeFavorites", JSON.stringify(favorites));
}

function isFavorited(id) {
  return favorites.some((fav) => fav.idMeal === id);
}


function createCardData(meal, fallbackCategory = "") {
  return {
    idMeal: meal.idMeal,
    strMeal: meal.strMeal,
    strMealThumb: meal.strMealThumb,
    strCategory: meal.strCategory || fallbackCategory,
  };
}

function toggleFavorite(cardData) {
  const index = favorites.findIndex((f) => f.idMeal === cardData.idMeal);

  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(cardData);
  }

  saveFavorites();

  refreshCurrentView();
}


function refreshCurrentView() {
  if (currentView === "favorites") {
    renderFavorites();
  } else if (currentSearchQuery) {
    performSearch(currentSearchQuery);
  } else {
    loadMealsByCategory(currentCategory);
  }
}

async function fetchCategories() {
  try {
    const res = await fetch(
      "https://www.themealdb.com/api/json/v1/1/categories.php",
    );
    const data = await res.json();
    categoriesData = data.categories || [];
    renderCategoryButtons();
  } catch (err) {
    console.error("Failed to fetch categories:", err);
    document.getElementById("category-list").innerHTML =
      `<p style="color:#f97316;padding:1rem;">⚠️ Could not load categories. Please check your connection.</p>`;
  }
}

async function loadMealsByCategory(category) {
  currentView = "home";
  currentCategory = category;
  currentSearchQuery = "";

  document.getElementById("section-title").textContent = `${category} Recipes`;
  document.getElementById("results-info").style.display = "none";
  document.getElementById("nav-home").classList.add("active");
  document.getElementById("nav-favorites").classList.remove("active");

  const grid = document.getElementById("recipes-grid");
  grid.innerHTML = `<div class="loader"></div>`;

  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category)}`,
    );
    const data = await res.json();

    const meals = data.meals || [];

    if (meals.length === 0) {
      grid.innerHTML = `<div class="empty"><p>No recipes found in this category.</p></div>`;
      return;
    }

    renderRecipes(meals, grid, false, category);
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<div class="empty"><p>⚠️ Failed to load recipes. Try again later.</p></div>`;
  }
}

async function performSearch(query) {
  currentView = "search";
  currentSearchQuery = query;

  const grid = document.getElementById("recipes-grid");
  grid.innerHTML = `<div class="loader"></div>`;

  document.getElementById("section-title").textContent =
    `Results for “${query}”`;
  const info = document.getElementById("results-info");
  info.style.display = "flex";

  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`,
    );
    const data = await res.json();
    const meals = data.meals || [];

    if (meals.length === 0) {
      grid.innerHTML = `
        <div class="empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 01-14 0 7 7 0 0114 0z" />
            </svg>
            <p>No recipes found for <strong>“${query}”</strong></p>
            <button onclick="clearSearch()" style="margin-top:1rem;background:var(--accent);color:white;border:none;padding:10px 24px;border-radius:9999px;">Try another search</button>
        </div>`;
      return;
    }

    document.getElementById("result-count").innerHTML =
      `${meals.length} recipe${meals.length === 1 ? "" : "s"} found`;

    renderRecipes(meals, grid, true);
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<div class="empty"><p>⚠️ Search failed. Please try again.</p></div>`;
  }
}

function renderFavorites() {
  currentView = "favorites";
  currentSearchQuery = "";

  document.getElementById("section-title").textContent = "❤️ Your Favorites";
  document.getElementById("results-info").style.display = "none";
  document.getElementById("nav-home").classList.remove("active");
  document.getElementById("nav-favorites").classList.add("active");

  const grid = document.getElementById("recipes-grid");

  if (favorites.length === 0) {
    grid.innerHTML = `
        <div class="empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364" />
            </svg>
            <p>You haven't saved any favorites yet!</p>
            <p style="margin-top:1rem;font-size:1rem;">Heart some recipes on the homepage to see them here.</p>
        </div>`;
    return;
  }

  renderRecipes(favorites, grid, false, "", true);
}

function renderCategoryButtons() {
  const container = document.getElementById("category-list");
  container.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = `category-btn ${currentCategory === "Beef" ? "active" : ""}`;
  allBtn.innerHTML = `🍽️ All`;
  allBtn.onclick = () => {
    currentCategory = "Beef";
    loadMealsByCategory("Beef");
    document
      .querySelectorAll(".category-btn")
      .forEach((b) => b.classList.remove("active"));
    allBtn.classList.add("active");
  };
  container.appendChild(allBtn);

  categoriesData.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = `category-btn ${cat.strCategory === currentCategory ? "active" : ""}`;
    btn.innerHTML = `${cat.strCategoryThumb ? `<img src="${cat.strCategoryThumb}" alt="" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">` : "🍲"} ${cat.strCategory}`;
    btn.onclick = () => {

      document
        .querySelectorAll(".category-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      loadMealsByCategory(cat.strCategory);
    };
    container.appendChild(btn);
  });
}

function renderRecipes(
  meals,
  container,
  isSearchResult = false,
  fallbackCategory = "",
  isFavoritesView = false,
) {
  container.innerHTML = "";

  meals.forEach((meal) => {
    const card = document.createElement("div");
    card.className = "recipe-card";

    const isFav = isFavorited(meal.idMeal);

    let shortDesc = "";
    if (isSearchResult && meal.strCategory) {
      shortDesc = `${meal.strCategory} • ${meal.strArea || "World"}`;
    } else if (fallbackCategory) {
      shortDesc = `${fallbackCategory} specialty`;
    } else if (meal.strCategory) {
      shortDesc = `${meal.strCategory} recipe`;
    } else {
      shortDesc = "Delicious homemade meal";
    }

    card.innerHTML = `
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <div class="card-content">
            <h3 class="card-title">${meal.strMeal}</h3>
                <p class="card-desc">${shortDesc}</p>
                        
        <div class="card-footer">
            <button class="heart-btn ${isFav ? "heart-filled" : ""}" onclick="event.stopImmediatePropagation(); toggleFavoriteFromCard('${meal.idMeal}', '${meal.strMeal}', '${meal.strMealThumb}', '${meal.strCategory || fallbackCategory}');">
                ${isFav ? "❤️" : "♡"}
            </button>
            <span style="font-size:0.85rem;color:var(--text-light);">Tap for details →</span>
            </div>
            </div>
                `;

    card.addEventListener("click", (e) => {
      if (!e.target.closest(".heart-btn")) {
        showRecipeDetail(meal.idMeal);
      }
    });

    container.appendChild(card);
  });
}

function toggleFavoriteFromCard(id, name, thumb, category) {
  const cardData = {
    idMeal: id,
    strMeal: name,
    strMealThumb: thumb,
    strCategory: category || "Recipe",
  };
  toggleFavorite(cardData);
}

function toggleFavoriteFromModal() {
  if (!window.currentModalMeal) return;
  const cardData = createCardData(window.currentModalMeal);
  toggleFavorite(cardData);

  const heartBtn = document.getElementById("modal-heart-btn");
  const isNowFav = isFavorited(window.currentModalMeal.idMeal);
  heartBtn.textContent = isNowFav ? "❤️" : "♡";
}

async function showRecipeDetail(id) {
  const modal = document.getElementById("recipe-modal");

  modal.style.display = "flex";
  modal.querySelector(".modal-body").innerHTML = `
    <div style="padding:4rem 2rem;text-align:center;">
        <div class="loader"></div>
        <p style="margin-top:1rem;color:var(--text-light);">Loading delicious details...</p>
    </div>
 `;

  let meal;

  if (mealCache.has(id)) {
    meal = mealCache.get(id);
  } else {
    try {
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`,
      );
      const data = await res.json();
      meal = data.meals[0];
      if (meal) mealCache.set(id, meal);
    } catch (err) {
      console.error(err);
      modal.innerHTML = `<div style="padding:3rem;text-align:center;color:#f97316;">Failed to load recipe details.</div>`;
      return;
    }
  }

  if (!meal) {
    hideModal();
    return;
  }

  window.currentModalMeal = meal;

  let ingredientsHTML = "";
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredientsHTML += `
        <li>
            <span style="font-size:1.4rem;">🥄</span>
            <span><strong>${measure ? measure.trim() : ""}</strong> ${ingredient.trim()}</span>
        </li>`;
    }
  }

  let instructionsHTML = "";
  const rawInstructions = meal.strInstructions || "No instructions available.";
  const steps = rawInstructions
    .split(/\r?\n|\.\s+/)
    .filter((step) => step.trim().length > 3);

  if (steps.length > 1) {
    steps.forEach((step, index) => {
      instructionsHTML += `<li>${step.trim()}</li>`;
    });
  } else {
    instructionsHTML = `<p style="white-space:pre-line;line-height:1.7;">${rawInstructions}</p>`;
  }

  let metaHTML = `
    <div class="tag">${meal.strCategory || "Uncategorized"}</div>
    <div class="tag">${meal.strArea || "World Cuisine"}</div>
    `;

  if (meal.strYoutube) {
    metaHTML += `<a href="${meal.strYoutube}" target="_blank" class="tag" style="background:#ef4444;color:white;text-decoration:none;">📺 Watch on YouTube</a>`;
  }

  const modalBody = modal.querySelector(".modal-body");
  modalBody.innerHTML = `
                <h1 id="modal-title" class="modal-title">${meal.strMeal}</h1>
                <div id="modal-meta" class="modal-meta">${metaHTML}</div>
                
                <div class="ingredients">
                    <div class="section-label">🛒 Ingredients</div>
                    <ul id="modal-ingredients">${ingredientsHTML}</ul>
                </div>
                
                <div class="instructions">
                    <div class="section-label">👨‍🍳 Step-by-step instructions</div>
                    <ol id="modal-instructions">${instructionsHTML}</ol>
                </div>
                
                <button onclick="hideModal()" 
                        style="background:var(--accent); color:white; border:none; padding:14px 32px; border-radius:9999px; font-weight:600; font-size:1.1rem; cursor:pointer; display:flex; align-items:center; gap:8px; margin:2rem auto 0;">
                    ← Back to recipes
                </button>
            `;

  document.getElementById("modal-image").src = meal.strMealThumb;

  const heartBtn = document.getElementById("modal-heart-btn");
  heartBtn.textContent = isFavorited(meal.idMeal) ? "❤️" : "♡";
}

function hideModal() {
  const modal = document.getElementById("recipe-modal");
  modal.style.display = "none";
  window.currentModalMeal = null;
}

function clearSearch() {
  currentSearchQuery = "";
  document.getElementById("search-input").value = "";
  loadMealsByCategory(currentCategory);
}

function switchToHome() {
  document.getElementById("search-input").value = "";
  loadMealsByCategory(currentCategory);
}

function showFavorites() {
  renderFavorites();
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");

  const toggle = document.getElementById("theme-toggle");
  toggle.textContent = isDark ? "☀️" : "🌙";
}

async function initApp() {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    document.getElementById("theme-toggle").textContent = "☀️";
  }

  await fetchCategories();

  await loadMealsByCategory("Beef");

  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener(
    "input",
    debounce(() => {
      const query = searchInput.value.trim();
      if (query.length >= 2) {
        performSearch(query);
      } else if (query.length === 0) {
        if (currentView === "search") {
          loadMealsByCategory(currentCategory);
        }
      }
    }, 350),
  );

  console.log(
    "%c✅ Recipe Haven initialized successfully with TheMealDB!",
    "color:#f97316;font-weight:600",
  );
}

window.onload = initApp;
