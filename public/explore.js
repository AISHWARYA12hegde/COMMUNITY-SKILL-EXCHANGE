const toastStack = document.getElementById("toastStack");
const showToast = (message, type = "info", timeout = 3200) => {
  if (!toastStack) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastStack.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
  }, timeout - 300);
  setTimeout(() => toast.remove(), timeout);
};

const state = {
  allUsers: [],
  filtered: [],
  currentPage: 1,
  pageSize: 6,
  showFavoritesOnly: false,
};

const searchInput = document.getElementById("searchInput");
const skillFilter = document.getElementById("skillFilter");
const sortSelect = document.getElementById("sortSelect");
const cardsContainer = document.querySelector(".service-box");
const emptyState = document.getElementById("emptyState");
const pagination = document.getElementById("pagination");
const resultsMeta = document.getElementById("resultsMeta");
const favoritesOnlyToggle = document.getElementById("favoritesOnly");

let favoritesKey = "";
let favoritesMap = new Map();

const loadFavorites = () => {
  if (!favoritesKey) return [];
  try {
    return JSON.parse(localStorage.getItem(favoritesKey)) || [];
  } catch (err) {
    console.warn("Unable to parse favorites", err);
    return [];
  }
};

const saveFavorites = () => {
  if (!favoritesKey) return;
  localStorage.setItem(favoritesKey, JSON.stringify(Array.from(favoritesMap.values())));
};

const syncFavorites = () => {
  favoritesMap = new Map(loadFavorites().map((fav) => [String(fav.id), fav]));
};

const renderMeta = () => {
  const total = state.filtered.length;
  if (!total) {
    resultsMeta.textContent = "No profiles to show.";
    return;
  }
  const start = (state.currentPage - 1) * state.pageSize + 1;
  const end = Math.min(start + state.pageSize - 1, total);
  resultsMeta.textContent = `Showing ${start}-${end} of ${total} profiles`;
};

const renderPagination = () => {
  pagination.innerHTML = "";
  const totalPages = Math.ceil(state.filtered.length / state.pageSize);

  if (totalPages <= 1) return;

  const createButton = (label, disabled, onClick, isActive = false) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.disabled = disabled;
    if (isActive) btn.classList.add("active");
    btn.addEventListener("click", onClick);
    pagination.appendChild(btn);
  };

  createButton("Prev", state.currentPage === 1, () => {
    state.currentPage--;
    renderCards();
  });

  for (let i = 1; i <= totalPages; i += 1) {
    createButton(
      i,
      false,
      () => {
        state.currentPage = i;
        renderCards();
      },
      state.currentPage === i
    );
  }

  createButton("Next", state.currentPage === totalPages, () => {
    state.currentPage++;
    renderCards();
  });
};

const renderCards = () => {
  cardsContainer.innerHTML = "";
  const total = state.filtered.length;

  if (!total) {
    emptyState.hidden = false;
    renderMeta();
    pagination.innerHTML = "";
    return;
  }

  emptyState.hidden = true;
  const start = (state.currentPage - 1) * state.pageSize;
  const items = state.filtered.slice(start, start + state.pageSize);

  items.forEach((user) => {
    const card = document.createElement("div");
    card.className = "card";
    const isFav = favoritesMap.has(String(user.id));
    card.innerHTML = `
      <h3>${user.name}</h3>
      <p><strong>Wants to Teach:</strong> ${user.teachSkills.join(", ") || "None"}</p>
      <p><strong>Wants to Learn:</strong> ${user.learnSkills.join(", ") || "None"}</p>
      <button class="fav-toggle ${isFav ? "active" : ""}" data-id="${user.id}">
        <span>${isFav ? "★" : "☆"}</span>${isFav ? "Saved" : "Save"}
      </button>
    `;
    cardsContainer.appendChild(card);
  });

  renderMeta();
  renderPagination();
};

const applyFilters = (resetPage = true) => {
  let filtered = [...state.allUsers];
  const query = searchInput.value.trim().toLowerCase();
  const filterValue = skillFilter.value;
  const sortValue = sortSelect.value;

  if (query) {
    filtered = filtered.filter((user) =>
      user.searchText.includes(query)
    );
  }

  filtered = filtered.filter((user) => {
    if (filterValue === "teach") return user.teachSkills.length > 0;
    if (filterValue === "learn") return user.learnSkills.length > 0;
    if (filterValue === "both") return user.teachSkills.length > 0 && user.learnSkills.length > 0;
    return true;
  });

  if (state.showFavoritesOnly) {
    filtered = filtered.filter((user) => favoritesMap.has(String(user.id)));
  }

  filtered.sort((a, b) => {
    switch (sortValue) {
      case "za":
        return b.name.localeCompare(a.name);
      case "teach":
        return b.teachSkills.length - a.teachSkills.length;
      case "learn":
        return b.learnSkills.length - a.learnSkills.length;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  state.filtered = filtered;
  if (resetPage) state.currentPage = 1;
  renderCards();
};

document.addEventListener("DOMContentLoaded", async () => {
  const user_id = localStorage.getItem("user_id");
  if (!user_id) {
    showToast("Please log in first!", "error");
    window.location.href = "index.html";
    return;
  }

  favoritesKey = `favorites_${user_id}`;
  syncFavorites();

  try {
    const res = await fetch(`http://localhost:3000/dashboard/${user_id}`);
    if (!res.ok) throw new Error("Unable to load dashboard");
    const data = await res.json();

    document.querySelector("#user-info h2 span").innerText = data.user.name;
    document.querySelector("#user-info p:nth-of-type(1)").innerHTML =
      `<strong>Skills You Teach:</strong> ${data.teachSkills.join(", ") || "None"}`;
    document.querySelector("#user-info p:nth-of-type(2)").innerHTML =
      `<strong>Skills You Want to Learn:</strong> ${data.learnSkills.join(", ") || "None"}`;

    const grouped = {};
    data.explore.forEach((item) => {
      const userKey = item.user_id ?? item.user_name;
      if (!grouped[userKey]) {
        grouped[userKey] = { id: String(userKey), name: item.user_name, teach: [], learn: [] };
      }
      if (item.type === "Teach") grouped[userKey].teach.push(item.skill_name);
      else grouped[userKey].learn.push(item.skill_name);
    });

    state.allUsers = Object.values(grouped).map((user) => ({
      id: user.id,
      name: user.name,
      teachSkills: user.teach,
      learnSkills: user.learn,
      searchText: `${user.name} ${user.teach.join(" ")} ${user.learn.join(" ")}`.toLowerCase(),
    }));

    applyFilters();
    showToast("Dashboard updated with the latest skills!", "success", 2600);
  } catch (err) {
    console.error("Error loading dashboard:", err);
    showToast("Error loading dashboard details", "error");
  }
});

searchInput.addEventListener("input", () => applyFilters());
skillFilter.addEventListener("change", () => applyFilters());
sortSelect.addEventListener("change", () => applyFilters(false));
favoritesOnlyToggle.addEventListener("change", (e) => {
  state.showFavoritesOnly = e.target.checked;
  applyFilters();
});

cardsContainer.addEventListener("click", (event) => {
  const btn = event.target.closest(".fav-toggle");
  if (!btn) return;
  const userId = btn.dataset.id;
  const user = state.allUsers.find((u) => String(u.id) === String(userId));
  if (!user) return;

  const key = String(user.id);
  if (favoritesMap.has(key)) {
    favoritesMap.delete(key);
    showToast(`${user.name} removed from bookmarks.`, "info");
  } else {
    favoritesMap.set(key, {
      id: key,
      name: user.name,
      teachSkills: user.teachSkills,
      learnSkills: user.learnSkills,
    });
    showToast(`${user.name} saved to your bookmarks!`, "success");
  }
  saveFavorites();
  renderCards();
});
