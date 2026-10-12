(()=>{

    // Your Blizzard API credentials
    
    // Configuration
    const ITEMS_PER_PAGE = 24;
    const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    // Navigation state
    let currentLanguage = sessionStorage.getItem("wow-language") || "en_US";
    let currentFamily = "all";
    let currentCategory = null; // Will be null when viewing a family
    let currentPet = null; // Will be null when viewing a family or category
    let currentPage = 1;
    let viewMode = "families"; // families, categories, category-pets, pet-details
    
    // State objects
    let allPets = [];
    let petFamilies = {};
    let petCategories = {}; // Map of family -> array of categories
    
    // Text translations
    const translations = {
      "page-title": {
        "en_US": "Battle Pets",
        "pt_BR": "Mascotes de Batalha"
      },
      "loading": {
        "en_US": "Loading...",
        "pt_BR": "Carregando..."
      },
      "back-btn": {
        "en_US": "← Back to Classes",
        "pt_BR": "← Voltar para Classes"
      },
      "all-pets": {
        "en_US": "All Pets",
        "pt_BR": "Todos os Mascotes"
      },
      "pet-count": {
        "en_US": "${count} pets",
        "pt_BR": "${count} mascotes"
      },
      "error-load": {
        "en_US": "Error loading pets: ",
        "pt_BR": "Erro ao carregar mascotes: "
      },
      "loading-background": {
        "en_US": "Loading additional pets...",
        "pt_BR": "Carregando mascotes adicionais..."
      },
      "loading-families": {
        "en_US": "Loading pet families...",
        "pt_BR": "Carregando famílias de mascotes..."
      },
      "miscellaneous": {
        "en_US": "Miscellaneous",
        "pt_BR": "Diversos"
      },
      "categories": {
        "en_US": "Categories",
        "pt_BR": "Categorias"
      },
      "appearance-rating": {
        "en_US": "Appearance Rating",
        "pt_BR": "Avaliação de Aparência"
      },
      "battle-rating": {
        "en_US": "Battle Rating",
        "pt_BR": "Avaliação de Batalha"
      },
      "vendor": {
        "en_US": "Vendor",
        "pt_BR": "Vendedor"
      },
      "zone": {
        "en_US": "Zone",
        "pt_BR": "Zona"
      },
      "cost": {
        "en_US": "Cost",
        "pt_BR": "Custo"
      },
      "item": {
        "en_US": "Item",
        "pt_BR": "Item"
      },
      "base-quality": {
        "en_US": "Base Quality",
        "pt_BR": "Qualidade Base"
      },
      "cageable": {
        "en_US": "Cageable",
        "pt_BR": "Engaiolável"
      },
      "faction": {
        "en_US": "Faction",
        "pt_BR": "Facção"
      },
      "family": {
        "en_US": "Family",
        "pt_BR": "Família"
      },
      "yes": {
        "en_US": "Yes",
        "pt_BR": "Sim"
      },
      "no": {
        "en_US": "No",
        "pt_BR": "Não"
      },
      "unknown": {
        "en_US": "Unknown",
        "pt_BR": "Desconhecido"
      },
      "category-count": {
        "en_US": "${count} categories",
        "pt_BR": "${count} categorias"
      },
      "abilities": {
        "en_US": "Abilities",
        "pt_BR": "Habilidades"
      },
      "stats": {
        "en_US": "Stats",
        "pt_BR": "Estatísticas"
      },
      "source": {
        "en_US": "Source",
        "pt_BR": "Origem"
      },
      "tradable": {
        "en_US": "Tradable",
        "pt_BR": "Negociável"
      },
      "loading-item-details": {
        "en_US": "Loading item details",
        "pt_BR": "Carregando detalhes do item"
      },
      "quality": {
        "en_US": "Quality",
        "pt_BR": "Qualidade"
      },
      "vendor-info": {
        "en_US": "Vendor Information",
        "pt_BR": "Informações do Vendedor"
      },
      "mobility": {
        "en_US": "Mobility",
        "pt_BR": "Mobilidade"
      },
      "animation": {
        "en_US": "Animation",
        "pt_BR": "Animação"
      },
      "sound": {
        "en_US": "Sound",
        "pt_BR": "Som"
      },
      "interactivity": {
        "en_US": "Interactivity",
        "pt_BR": "Interatividade"
      },
      "exclusivity": {
        "en_US": "Exclusivity",
        "pt_BR": "Exclusividade"
      },
      "journal-limit": {
        "en_US": "Pet Journal Limit",
        "pt_BR": "Limite no Diário de Mascotes"
      },
      "details": {
        "en_US": "Details",
        "pt_BR": "Detalhes"
      },
      "notes": {
        "en_US": "Notes",
        "pt_BR": "Notas"
      },
      "level": {
        "en_US": "Level",
        "pt_BR": "Nível"
      },
      "source-type": {
        "en_US": "Source Type",
        "pt_BR": "Tipo de Origem"
      },
      "expansion": {
        "en_US": "Expansion",
        "pt_BR": "Expansão"
      },
      "limited": {
        "en_US": "limited supply",
        "pt_BR": "oferta limitada"
      },
      "unlimited": {
        "en_US": "unlimited supply",
        "pt_BR": "oferta ilimitada"
      }
    };
    
    // Pet family translations
    const familyTranslations = {
      "Humanoid": { "pt_BR": "Humanoide" },
      "Dragonkin": { "pt_BR": "Draconiano" },
      "Flying": { "pt_BR": "Voador" },
      "Undead": { "pt_BR": "Morto-vivo" },
      "Critter": { "pt_BR": "Bicho" },
      "Magic": { "pt_BR": "Mágico" },
      "Elemental": { "pt_BR": "Elemental" },
      "Beast": { "pt_BR": "Fera" },
      "Aquatic": { "pt_BR": "Aquático" },
      "Mechanical": { "pt_BR": "Mecânico" }
    };
    
    // Pet family colors
    const familyColors = {
      "Humanoid": "#C79C6E",
      "Dragonkin": "#C41F3B",
      "Flying": "#69CCF0",
      "Undead": "#C41E3A",
      "Critter": "#ABD473",
      "Magic": "#69CCF0",
      "Elemental": "#F58CBA",
      "Beast": "#FF7D0A",
      "Aquatic": "#0070DE",
      "Mechanical": "#8787ED"
    };
    
    // Create comprehensive categories for all pet families
    const petCategoryDefinitions = {
      "Beast": {
        "Bears": ["bear", "cub", "grizzl"],
        "Boars": ["boar", "hog", "pig"],
        "Canines": ["dog", "wolf", "fox", "coyote", "pup"],
        "Direhorns": ["direhorn"],
        "Felines": ["cat", "lion", "tiger", "lynx", "sabertooth", "kitten"],
        "Hippos": ["hippo"],
        "Insects": ["beetle", "bug", "insect", "firefly", "dragonfly", "grasshopper", "wasp", "moth", "mantis", "ant", "bee"],
        "Lizards": ["lizard", "basilisk", "crocolisk", "turtle", "shell", "iguana", "chameleon", "salamander"],
        "Pandas": ["panda"],
        "Primates": ["monkey", "gorilla", "ape", "orangutan", "chimpanzee"],
        "Raptors": ["raptor", "velociraptor"],
        "Ravagers": ["ravager"],
        "Rodents": ["rat", "mouse", "hamster", "gopher", "squirrel", "chipmunk", "rabbit", "hedgehog", "porcupine"],
        "Scorpions": ["scorpion", "scorpid"],
        "Snakes": ["snake", "cobra", "serpent", "python", "asp", "viper", "anaconda"],
        "Spiders": ["spider", "arachnid", "tarantula"],
        "Ungulates": ["goat", "deer", "stag", "elk", "gazelle", "antelope", "ram", "sheep", "horse", "pony", "stallion", "rhinoceros", "rhino", "camel", "llama"],
        "Miscellaneous": []
      },
      "Aquatic": {
        "Fish": ["fish", "angler", "bass", "carp", "catfish", "cod", "eel", "grouper", "herring", "minnow", "puffer", "salmon", "shark", "trout", "tuna"],
        "Frogs": ["frog", "toad"],
        "Crustaceans": ["crab", "lobster", "shrimp", "crawfish", "crayfish"],
        "Molluscs": ["clam", "mussel", "octopus", "squid", "snail", "slug"],
        "Water Mammals": ["dolphin", "whale", "otter", "seal", "walrus"],
        "Miscellaneous": []
      },
      "Flying": {
        "Birds of Prey": ["eagle", "hawk", "owl", "falcon", "vulture", "condor"],
        "Small Birds": ["sparrow", "finch", "chickadee", "warbler", "wren", "robin", "bluebird", "cardinal"],
        "Corvids": ["crow", "raven", "magpie", "jackdaw", "jay"],
        "Parrots": ["parrot", "cockatiel", "macaw", "cockatoo", "parakeet", "lovebird", "lory"],
        "Game Birds": ["pheasant", "quail", "grouse", "turkey", "chicken", "rooster", "partridge"],
        "Water Birds": ["duck", "swan", "goose", "gull", "tern", "pelican", "heron", "stork", "flamingo"],
        "Insects": ["butterfly", "moth", "dragonfly", "bee", "wasp", "hornet"],
        "Bats": ["bat", "vampire"],
        "Miscellaneous": []
      },
      "Undead": {
        "Skeletal": ["skeleton", "bones", "skull", "bony"],
        "Zombies": ["zombie", "ghoul", "risen"],
        "Spirits": ["ghost", "spirit", "wraith", "specter", "phantom", "banshee"],
        "Miscellaneous": []
      },
      "Critter": {
        "Rabbits": ["rabbit", "bunny", "hare"],
        "Rodents": ["rat", "mouse", "vole", "squirrel", "chipmunk", "gopher", "prairie dog"],
        "Amphibians": ["frog", "toad", "salamander", "newt"],
        "Small Mammals": ["hedgehog", "mole", "shrew", "weasel", "ferret", "mink", "badger"],
        "Insects": ["beetle", "ant", "cricket", "grasshopper", "ladybug"],
        "Miscellaneous": []
      },
      "Mechanical": {
        "Robots": ["robot", "automaton", "golem", "construct", "mech"],
        "Clockwork": ["clockwork", "tinker", "gear", "cog"],
        "Vehicles": ["plane", "copter", "rocket", "car", "tank", "truck", "bike", "cycle", "gyro"],
        "Toys": ["toy", "doll", "figure", "model", "squirrel", "pet"],
        "Miscellaneous": []
      },
      "Magic": {
        "Arcane": ["arcane", "mana", "energy", "magic"],
        "Elementals": ["wisp", "sprite", "light", "void", "shadow"],
        "Ethereal": ["ethereal", "astral", "celestial"],
        "Magical Creatures": ["fairy", "pixie", "imp", "fel"],
        "Miscellaneous": []
      },
      "Elemental": {
        "Fire": ["fire", "flame", "ember", "blaze", "inferno"],
        "Water": ["water", "aqua", "hydro", "frost", "ice"],
        "Earth": ["earth", "stone", "rock", "pebble", "crystal", "sand"],
        "Air": ["air", "wind", "breeze", "storm", "tempest", "thunder"],
        "Miscellaneous": []
      },
      "Humanoid": {
        "Diminutive": ["gnome", "dwarf", "goblin", "pygmy", "leprechaun"],
        "Human-like": ["human", "elf", "blood", "night", "orc", "troll", "tauren", "undead", "forsaken"],
        "Children": ["child", "kid", "baby", "infant", "toddler"],
        "Miscellaneous": []
      },
      "Dragonkin": {
        "Dragons": ["dragon", "drake", "wyrm", "whelp"],
        "Proto-Dragons": ["proto", "storm", "time", "twilight", "ruby", "emerald", "azure", "bronze", "obsidian"],
        "Wyverns": ["wyvern"],
        "Miscellaneous": []
      }
    };

    // Update the categorizeFamily function to handle all families
    function categorizeFamily(family) {
      if (!petFamilies[family] || petFamilies[family].length === 0) {
        return;
      }
      // Use the predefined categories or create a single "All" category
      const categories = petCategoryDefinitions[family] || { "All": [] };
      petCategories[family] = {};
      
      // If using predefined categories, initialize them
      if (petCategoryDefinitions[family]) {
        Object.keys(categories).forEach(category => {
          petCategories[family][category] = [];
        });
        
        // Categorize each pet
        (petFamilies[family] || []).forEach(pet => {
          let matched = false;
          const lowerName = pet.name.toLowerCase();
          
          // Try to match pet name against category patterns
          Object.keys(categories).forEach(category => {
            if (matched || category === "Miscellaneous") return;
            
            const patterns = categories[category];
            for (const pattern of patterns) {
              if (lowerName.includes(pattern.toLowerCase())) {
                petCategories[family][category].push(pet);
                matched = true;
                break;
              }
            }
          });
          
          // If no match, add to miscellaneous
          if (!matched) {
            const miscCategory = "Miscellaneous";
            if (!petCategories[family][miscCategory]) {
              petCategories[family][miscCategory] = [];
            }
            petCategories[family][miscCategory].push(pet);
          }
        });
        
        // Remove empty categories
        Object.keys(petCategories[family]).forEach(category => {
          if (petCategories[family][category].length === 0) {
            delete petCategories[family][category];
          }
        });
      } else {
        // Just use a single "All" category
        petCategories[family]["All"] = petFamilies[family];
      }
    }

    // Add setupFamilyNav function
    function setupFamilyNav() {
      const nav = document.getElementById("family-nav");
      nav.innerHTML = '';
      
      // Skip creating the "All Pets" button - just create family buttons
      const sortedFamilies = Object.keys(petFamilies)
        .filter(family => family !== "Unknown" && petFamilies[family].length > 0)
        .sort();
      
      sortedFamilies.forEach(family => {
        const btn = document.createElement("button");
        btn.className = `family-btn ${currentFamily === family ? 'active' : ''}`;
        btn.dataset.family = family;
        
        
        const translatedFamily = getTranslatedFamily(family);
        btn.innerHTML = `<span>${translatedFamily}</span> <span class="count">${petFamilies[family].length}</span>`;
        
        btn.addEventListener("click", () => {
          if (currentFamily !== family) {
            currentFamily = family;
            currentPage = 1;
            showCategories(family);
          }
        });
        
        nav.appendChild(btn);
      });
      
      nav.classList.remove("hidden");
    }

    // Add displayCategories function
    function displayCategories() {
      const container = document.getElementById("output");
      container.innerHTML = "";
      container.className = "category-grid";
      document.getElementById("pagination").classList.add("hidden");
      
      if (!petCategories[currentFamily]) {
        categorizeFamily(currentFamily);
      }
      
      const categories = petCategories[currentFamily] || {};
      const sortedCategories = Object.keys(categories).sort();
      
      sortedCategories.forEach(category => {
        const pets = categories[category];
        if (!pets || pets.length === 0) return;
        
        // Create a card for this category
        const card = document.createElement("div");
        card.className = "category-card";
        card.dataset.category = category;
        
        
        // Get a sample pet for the category image
        const samplePet = pets[Math.floor(Math.random() * pets.length)];
        
        // Build the card content
        let html = `<h3>${category}</h3>`;
        
        if (samplePet && samplePet.icon) {
          html += `<img src="${samplePet.icon}" alt="${category}">`;
        } else {
          html += `<div class="placeholder-img">?</div>`;
        }
        
        html += `<div class="count">${pets.length} pets</div>`;
        
        card.innerHTML = html;
        
        card.addEventListener("click", () => {
          showCategoryPets(currentFamily, category);
        });
        
        container.appendChild(card);
      });
    }

    // Add displayCategoryPets function
    function displayCategoryPets() {
      const container = document.getElementById("output");
      container.innerHTML = "";
      container.className = "pet-grid";
      
      // Get pets for the current category
      const pets = petCategories[currentFamily]?.[currentCategory] || [];
      
      // Calculate pagination
      const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, pets.length);
      const totalPages = Math.ceil(pets.length / ITEMS_PER_PAGE);
      
      // Display pets for this page
      for (let i = startIdx; i < endIdx; i++) {
        container.appendChild(createPetCard(pets[i]));
      }
      
      // Setup pagination
      const paginationContainer = document.getElementById("pagination");
      paginationContainer.innerHTML = "";
      
      if (totalPages <= 1) {
        paginationContainer.classList.add("hidden");
        return;
      }
      
      paginationContainer.classList.remove("hidden");
      
      // Add pagination buttons
      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.className = `page-btn ${i === currentPage ? "active" : ""}`;
        btn.textContent = i;
        
        if (i !== currentPage) {
          btn.addEventListener("click", () => {
            currentPage = i;
            displayCategoryPets();
          });
        }
        
        paginationContainer.appendChild(btn);
      }
    }

    // Add createPetCard function
    function createPetCard(pet) {
      const card = document.createElement("div");
      card.className = "pet-card";
      
      
      // Build card content
      let html = `<strong>${pet.name}</strong>`;
      
      if (pet.icon) {
        html += `<img src="${pet.icon}" alt="${pet.name}" loading="lazy" decoding="async">`;
      } else {
        html += `<div class="placeholder-img">?</div>`;
      }
      
      if (pet.family) {
        html += `<div class="pet-family">${getTranslatedFamily(pet.family)}</div>`;
      }
      
      card.innerHTML = html;
      
      // Add click handler to show pet details
      card.addEventListener("click", () => {
        showPetDetails(pet);
      });
      
      return card;
    }

    // Add displayFamilyPets function
    function displayFamilyPets() {
      const container = document.getElementById("output");
      container.innerHTML = "";
      container.className = "pet-grid";
      
      // Get pets to display based on current family
      const petsToDisplay = currentFamily === "all" ? allPets : petFamilies[currentFamily] || [];
      
      // Calculate pagination
      const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, petsToDisplay.length);
      const totalPages = Math.ceil(petsToDisplay.length / ITEMS_PER_PAGE);
      
      // Display pets for this page
      for (let i = startIdx; i < endIdx; i++) {
        container.appendChild(createPetCard(petsToDisplay[i]));
      }
      
      // Setup pagination
      const paginationContainer = document.getElementById("pagination");
      paginationContainer.innerHTML = "";
      
      if (totalPages <= 1) {
        paginationContainer.classList.add("hidden");
        return;
      }
      
      paginationContainer.classList.remove("hidden");
      
      // Add pagination buttons
      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.className = `page-btn ${i === currentPage ? "active" : ""}`;
        btn.textContent = i;
        
        if (i !== currentPage) {
          btn.addEventListener("click", () => {
            currentPage = i;
            displayFamilyPets();
          });
        }
        
        paginationContainer.appendChild(btn);
      }
    }

    // Helper Functions
    function getTranslation(key, vars = {}) {
      let text = translations[key][currentLanguage] || translations[key]["en_US"] || key;
      
      // Replace variables if any
      Object.keys(vars).forEach(varName => {
        text = text.replace('${' + varName + '}', vars[varName]);
      });
      
      return text;
    }
    
    function getTranslatedFamily(family) {
      if (currentLanguage === "pt_BR" && familyTranslations[family] && familyTranslations[family]["pt_BR"]) {
        return familyTranslations[family]["pt_BR"];
      }
      return family;
    }
    
    function getCachedData(key) {
      // Try localStorage first (persistent across browser sessions)
      let stored = localStorage.getItem(key);
      if (!stored) {
        // Fall back to sessionStorage if not in localStorage
        stored = sessionStorage.getItem(key);
      }
      
      if (!stored) return null;
      
      try {
        const { timestamp, data } = JSON.parse(stored);
        // Cache expires after 30 days (since pets rarely change)
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      } catch (e) {
        console.error("Error parsing cached data:", e);
      }
      return null;
    }
    
    function setCachedData(key, data) {
      try {
        const cacheData = JSON.stringify({
          timestamp: Date.now(),
          data
        });
        
        // Try localStorage first
        try {
          localStorage.setItem(key, cacheData);
        } catch (e) {
          // If localStorage is full, fallback to sessionStorage
          sessionStorage.setItem(key, cacheData);
        }
      } catch (e) {
        console.error("Error caching data:", e);
      }
    }
    
    // UI Update Functions
    function updateBackgroundLoading(show, message) {
      const loadingEl = document.getElementById("background-loading");
      const textEl = document.getElementById("loading-text");
      
      if (show) {
        loadingEl.classList.remove("hidden");
        if (message) textEl.textContent = message;
      } else {
        loadingEl.classList.add("hidden");
      }
    }
    
    function updateLanguageButtons() {
      document.getElementById("lang-en").classList.toggle("active", currentLanguage === "en_US");
      document.getElementById("lang-pt").classList.toggle("active", currentLanguage === "pt_BR");
      updatePageText();
    }
    
    function updatePageText() {
      document.getElementById("page-title").textContent = getTranslation("page-title");
      document.getElementById("back-btn").textContent = getTranslation("back-btn");
      
      // Only update if elements exist (depending on current view)
      const titleEl = document.getElementById("current-title");
      if (titleEl) {
        if (viewMode === "families") {
          titleEl.textContent = getTranslation("all-pets");
        } else if (viewMode === "categories") {
          titleEl.textContent = getTranslatedFamily(currentFamily) + " " + getTranslation("categories");
        } else if (viewMode === "category-pets") {
          titleEl.textContent = currentCategory;
        }
      }
      
      const petCount = document.getElementById("pet-count");
      if (petCount) {
        let count = 0;
        let translationKey = "pet-count";
        
        if (viewMode === "families") {
          count = allPets.length;
        } else if (viewMode === "categories") {
          count = Object.keys(petCategories[currentFamily] || {}).length;
          translationKey = "category-count"; // Use category count translation for categories view
        } else if (viewMode === "category-pets") {
          count = petCategories[currentFamily][currentCategory].length;
        }
        
        petCount.textContent = getTranslation(translationKey, { count });
      }
      
      updateBreadcrumbs();
    }
    
    function updateBreadcrumbs() {
      const breadcrumbsEl = document.getElementById("breadcrumbs");
      if (!breadcrumbsEl) return;
      
      // Don't show breadcrumbs on the initial families page
      if (viewMode === "families") {
        breadcrumbsEl.classList.add("hidden");
        return;
      }
      
      // Start with empty breadcrumbs or just show the current family
      let html = '';
      
      if (viewMode === "categories" && currentFamily) {
        html = `<span>${getTranslatedFamily(currentFamily)}</span>`;
      } else if (viewMode === "category-pets" && currentFamily && currentCategory) {
        html = `<a href="#" data-action="show-categories" data-family="${currentFamily}">${getTranslatedFamily(currentFamily)}</a>
                <span class="separator">›</span>
                <span>${currentCategory}</span>`;
      } else if (viewMode === "pet-details" && currentFamily && currentCategory && currentPet) {
        html = `<a href="#" data-action="show-categories" data-family="${currentFamily}">${getTranslatedFamily(currentFamily)}</a>
                <span class="separator">›</span>
                <a href="#" data-action="show-category-pets" data-family="${currentFamily}" data-category="${currentCategory}">${currentCategory}</a>
                <span class="separator">›</span>
                <span>${currentPet.name}</span>`;
      }
      
      breadcrumbsEl.innerHTML = html;
      
      // Only show breadcrumbs if there's content
      if (html) {
        breadcrumbsEl.classList.remove("hidden");
      } else {
        breadcrumbsEl.classList.add("hidden");
      }
      
      // Add event listeners to breadcrumb links
      breadcrumbsEl.querySelectorAll("a[data-action]").forEach(link => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const action = link.dataset.action;
          
          if (action === "show-categories") {
            showCategories(link.dataset.family);
          } else if (action === "show-category-pets") {
            showCategoryPets(link.dataset.family, link.dataset.category);
          }
        });
      });
    }
    
    // API Functions
    // Keep existing callers compatible; provider authentication happens only on the server.
    async function getAccessToken() { return null; }
    async function blizzardFetch(resource) {
      const url = new URL(resource);
      const base = window.WowConfig.basePath;
      return fetch(base + '/api/blizzard?path=' + encodeURIComponent(url.pathname) + '&locale=' + encodeURIComponent(url.searchParams.get('locale') || 'en_US'));
    }
    try {localStorage.removeItem('wow-token');sessionStorage.removeItem('wow-token');} catch {}

    async function fetchPetIndex(token) {
      const cacheKey = `wow-pet-index-${currentLanguage}`;
      const cachedData = getCachedData(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      try {
        const response = await blizzardFetch(`https://us.api.blizzard.com/data/wow/pet/index?namespace=static-us&locale=${currentLanguage}`);
        
        if (!response.ok) {
          throw new Error(`API Error (${response.status}: ${response.statusText})`);
        }
        
        const data = await response.json();
        setCachedData(cacheKey, data);
        return data;
      } catch (error) {
        console.error("Error fetching pet index:", error);
        throw error;
      }
    }
    
    // Update displayPetBasicDetails function to only show fields that exist in the data
    function displayPetBasicDetails(pet) {
      console.log("Displaying full pet details object:", pet);
      
      const container = document.getElementById("output");
      container.innerHTML = "";
      container.className = "pet-details";
      
      // Build the main pet details structure
      let html = `<h2>${pet.name}</h2>
        <div class="pet-details-content">
          <div class="pet-details-sidebar">
            <img class="pet-icon" src="${pet.icon}" alt="${pet.name}">`;
      
      // Add description if available
      if (pet.description) {
        html += `<p class="pet-description">${pet.description}</p>`;
      }
      
      // Use the media_image (potentially the model render)
      html += `<img class="pet-image" src="${pet.media_image || pet.icon}" alt="${pet.name}">
          </div>
          
          <div class="pet-details-main">
            <table class="pet-info-table">
              <tr>
                <th>${getTranslation("family")}:</th>
                <td>${getTranslatedFamily(pet.family || "Unknown")}</td>
              </tr>`;
      
      // Show source information
      if (pet.source) {
        html += `
          <tr>
            <th>${getTranslation("source")}:</th>
            <td>${pet.source}</td>
          </tr>`;
      }
      
      // Show zone information if available
      if (pet.zones && pet.zones.length > 0) {
        html += `
          <tr>
            <th>${getTranslation("zone")}:</th> 
            <td>${pet.zones.join(', ')}</td> 
          </tr>`;
      }
      
      // Show if the pet is capturable/cageable
      if (pet.is_capturable !== undefined) {
        html += `
          <tr>
            <th>${getTranslation("cageable")}:</th>
            <td>${pet.is_capturable ? getTranslation("yes") : getTranslation("no")}</td>
          </tr>`;
      }
      
      // Show if the pet is tradable
      if (pet.is_tradable !== undefined) {
        html += `
          <tr>
            <th>${getTranslation("tradable")}:</th>
            <td>${pet.is_tradable ? getTranslation("yes") : getTranslation("no")}</td>
          </tr>`;
      }
      
      // Show faction information
      if (pet.is_alliance_only || pet.is_horde_only) {
        html += `
          <tr>
            <th>${getTranslation("faction")}:</th>
            <td>${pet.is_alliance_only ? "Alliance" : "Horde"}</td>
          </tr>`;
      } else {
        html += `
          <tr>
            <th>${getTranslation("faction")}:</th>
            <td>Neutral</td>
          </tr>`;
      }
      
      // Check for quality information (potentially updated from item)
      if (pet.quality) {
        html += `
          <tr>
            <th>${getTranslation("base-quality")}:</th>
            <td class="quality-${pet.quality.toLowerCase()}">${pet.quality}</td>
          </tr>`;
      }
      
      // Add expansion information if available
      if (pet.expansion) {
        html += `
          <tr>
            <th>${getTranslation("expansion")}:</th>
            <td>${pet.expansion}</td>
          </tr>`;
      }
      
      html += `</table>`;
      
      // Add vendor section if we have that information
      if (pet.vendors && pet.vendors.length > 0) {
        html += `<h3 class="section-header">${getTranslation("vendor-info")}</h3>`;
        
        pet.vendors.forEach(vendor => {
          html += `
            <div class="vendor-info">
              <strong>${getTranslation("vendor")}:</strong> ${vendor.name}<br>
              <strong>${getTranslation("zone")}:</strong> ${vendor.zone}<br>
              <strong>${getTranslation("cost")}:</strong> ${vendor.cost}
              ${vendor.currency_icon ? `<img src="${vendor.currency_icon}" width="14" height="14">` : ''}
              (${vendor.limited ? getTranslation("limited") : getTranslation("unlimited")})
            </div>
          `;
        });
      }
      
      // Add abilities section if the pet has abilities
      if (pet.abilities && pet.abilities.length > 0) {
        html += `<h3 class="section-header">${getTranslation("abilities")}</h3>
          <ul class="abilities-list">`;
        
        pet.abilities.forEach(ability => {
          const abilityName = ability.ability?.name || "Unknown";
          const requiredLevel = ability.required_level || 1;
          const slot = ability.slot !== undefined ? ability.slot + 1 : "";
          html += `<li>${abilityName} (${getTranslation("level")} ${requiredLevel}, Slot ${slot})</li>`;
        });
        
        html += `</ul>`;
      }
      
      html += `</div></div>`;
      
      container.innerHTML = html;
    }

    // Fix the fetchPetDetails function to not add hardcoded fields
    async function fetchPetDetails(token, petId) {
      console.log(`Starting fetchPetDetails for pet ${petId} with token: ${token ? "Valid" : "Invalid"}`);
      
      const cacheKey = `wow-pet-details-${currentLanguage}-${petId}`;
      const cachedData = getCachedData(cacheKey);
      
      // Check if cached data exists AND is complete (has expected fields)
      if (cachedData && 
          cachedData.description !== undefined && 
          cachedData.abilities !== undefined && 
          cachedData.is_capturable !== undefined) {
        console.log("Returning complete cached pet details");
        return cachedData;
      } else if (cachedData) {
        console.log("Found cached data but it's incomplete, fetching from API instead");
        localStorage.removeItem(cacheKey);
        sessionStorage.removeItem(cacheKey);
      } else {
        console.log("No cached data found, fetching from API");
      }
      
      try {
        // First fetch the basic pet data
        console.log(`Fetching pet data from API for ID: ${petId}`);
        const url = `https://us.api.blizzard.com/data/wow/pet/${petId}?namespace=static-us&locale=${currentLanguage}`;
        console.log("API URL:", url);
        
        const response = await blizzardFetch(url);
        
        console.log("API Response status:", response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`API Error for pet ${petId}: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Pet API data:", data);
        
        // Fetch media data if available
        let mediaData = null;
        let modelImage = data.icon; // Default to icon
        if (data.media && data.media.id) {
          try {
            console.log(`Fetching media for pet ${petId}`);
            const mediaUrl = `https://us.api.blizzard.com/data/wow/media/pet/${data.media.id}?namespace=static-us&locale=${currentLanguage}`;
            const mediaResponse = await blizzardFetch(mediaUrl);
            
            console.log("Media API Response status:", mediaResponse.status);
            
            if (mediaResponse.ok) {
              mediaData = await mediaResponse.json();
              console.log("Pet media data:", mediaData);
              
              // Try to find a better image (render or zoom)
              const renderAsset = mediaData.assets?.find(asset => asset.key === 'zoom' || asset.key === 'creature-display');
              if (renderAsset) {
                modelImage = renderAsset.value;
                console.log("Found model image:", modelImage);
              } else {
                // If no specific model image, use the first asset (usually icon)
                modelImage = mediaData.assets?.[0]?.value || data.icon;
              }
            }
          } catch (error) {
            console.error("Error fetching pet media:", error);
          }
        }
        
        // Fetch vendor information (this would be from the API if available)
        const vendors = await fetchPetVendors(token, petId);
        
        // Get expansion information based on the API namespace or other data
        let expansionInfo = null;
        if (data._links?.self?.href) {
          const namespaceMatch = data._links.self.href.match(/static-(\d+\.\d+\.\d+)/);
          if (namespaceMatch) {
            const version = namespaceMatch[1];
            if (version.startsWith("9.")) {
              expansionInfo = "Shadowlands";
            } else if (version.startsWith("8.")) {
              expansionInfo = "Battle for Azeroth";
            } else if (version.startsWith("7.")) {
              expansionInfo = "Legion";
            }
            // Add more mappings as needed
          }
        }
        
        // Try to determine quality based on source or other factors
        let quality = null;
        if (data.source) {
          if (data.source.type === "ACHIEVEMENT") quality = "Rare";
          else if (data.source.type === "PROMOTION") quality = "Epic";
          // More quality mappings could be added based on source type
        }
        
        // Create a pet object using only data from the API
        const pet = {
          id: data.id,
          name: data.name,
          family: data.battle_pet_type?.name || "Unknown",
          icon: data.icon,
          description: data.description,
          source: data.source?.name,
          source_type: data.source?.type,
          is_capturable: data.is_capturable,
          is_tradable: data.is_tradable,
          is_alliance_only: data.is_alliance_only,
          is_horde_only: data.is_horde_only,
          abilities: data.abilities || [],
          is_battlepet: data.is_battlepet,
          creature_id: data.creature?.id || null, // Store creature_id
          creature_name: data.creature?.name,
          is_random_creature_display: data.is_random_creature_display,
          item_id: data.creature_display?.item?.id || null, // Store item_id
          
          // Only include these if we can derive them from the API
          quality: quality, // Will be potentially overwritten by item quality later
          expansion: expansionInfo,
          vendors: vendors.length > 0 ? vendors : null,
          
          // Media image - use the best one found
          media_image: modelImage,
        };
        
        console.log("Final pet details object (initial fetch):", pet);
        setCachedData(cacheKey, pet); // Cache the initially fetched data
        return pet;
      } catch (error) {
        console.error(`Error in fetchPetDetails for pet ${petId}:`, error);
        return { 
          id: petId, 
          name: currentPet?.name || `Pet ${petId}`, 
          family: currentPet?.family || "Unknown",
          icon: currentPet?.icon || ""
        };
      }
    }

    // Add the missing showPetDetails function
    async function showPetDetails(pet) {
      const selectionVersion = catalogueLoadVersion;
      const selectionId = pet.id;
      viewMode = "pet-details";
      // Start with the basic pet info passed in
      currentPet = { ...pet }; 
      console.log("Showing initial pet details for:", currentPet);
      
      // Configure UI elements
      document.getElementById("family-nav").classList.add("hidden");
      document.getElementById("category-nav").classList.add("hidden");
      document.getElementById("pet-list-header").classList.add("hidden");
      document.getElementById("pagination").classList.add("hidden");
      
      // Display basic info immediately while fetching more
      displayPetBasicDetails(currentPet); 
      updatePageText();
      
      try {
        const token = await getAccessToken();
        console.log("Got access token:", token ? "Valid token" : "Invalid token");
        
        // Authentication is handled by the server; no browser token is needed.
        
        // --- Fetch all necessary data in parallel (or sequence if needed) ---
        
        // 1. Fetch detailed pet data (includes media_image, item_id, creature_id, vendors)
        console.log("Fetching detailed pet data for:", currentPet.id);
        const detailedPetData = await fetchPetDetails(token, currentPet.id);
        if (selectionVersion !== catalogueLoadVersion || viewMode !== 'pet-details' || currentPet?.id !== selectionId) return;
        if (!detailedPetData) {
          console.error("Failed to fetch detailed pet data.");
          // Keep showing basic info already rendered
          return; 
        }
        // Merge detailed data into currentPet
        Object.assign(currentPet, detailedPetData);
        console.log("Merged detailed pet data:", currentPet);

        // 2. Fetch item details (if item_id exists)
        let itemDetails = null;
        if (currentPet.item_id) {
          console.log("Pet has item_id, fetching item details:", currentPet.item_id);
          itemDetails = await fetchPetItemDetails(token, currentPet.item_id);
          if (itemDetails && itemDetails.quality?.name) {
            console.log("Received item quality:", itemDetails.quality.name);
            // Update quality directly on currentPet
            currentPet.quality = itemDetails.quality.name; 
          }
        }
        
        // 3. Fetch creature details (if creature_id exists)
        let creatureDetails = null;
        if (currentPet.creature_id) {
          console.log("Pet has creature_id, fetching creature details:", currentPet.creature_id);
          creatureDetails = await fetchCreatureDetails(token, currentPet.creature_id);
          if (creatureDetails && creatureDetails.location?.name) {
            const zoneName = creatureDetails.location.name;
            console.log("Received creature zone:", zoneName);
            // Update zones directly on currentPet
            currentPet.zones = [zoneName]; 
          }
        }
        
        // --- Final Render ---
        // Now currentPet should have all available data merged
        if (selectionVersion !== catalogueLoadVersion || viewMode !== 'pet-details' || currentPet?.id !== selectionId) return;
        console.log("Rendering final pet details with all fetched data:", currentPet);
        displayPetBasicDetails(currentPet); // Render once with the complete object
        
      } catch (error) {
        console.error("Error loading additional pet details:", error);
        // Display the error or keep showing basic info
      }
    }

    // Add missing fetchPetVendors function
    async function fetchPetVendors(token, petId) {
      // This function would ideally fetch vendor information from the API
      // For now, we'll return hardcoded data for specific pets as examples
      
      // Example for Barnacled Hermit Crab
      if (petId === 2425) {
        return [
          {
            name: "Madeline Netley",
            zone: "Stormsong Valley",
            cost: "50",
            currency_icon: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_coin_01.jpg",
            limited: false
          },
          {
            name: "Jenoh",
            zone: "Vol'dun",
            cost: "50", 
            currency_icon: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_coin_01.jpg",
            limited: false
          }
        ];
      }
      
      // For all other pets, return an empty array
      return [];
    }

    // Add missing fetchPetItemDetails function
    async function fetchPetItemDetails(token, itemId) {
      if (!itemId) return null;
      
      const cacheKey = `wow-item-details-${currentLanguage}-${itemId}`;
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log("Returning cached item details for:", itemId);
        return cachedData;
      }
      
      console.log(`Fetching item details from API for ID: ${itemId}`);
      try {
        const url = `https://us.api.blizzard.com/data/wow/item/${itemId}?namespace=static-us&locale=${currentLanguage}`;
        const response = await blizzardFetch(url);
        
        if (!response.ok) {
          throw new Error(`API Error for item ${itemId}: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Item API data:", data);
        setCachedData(cacheKey, data);
        return data;
      } catch (error) {
        console.error(`Error fetching item details for ${itemId}:`, error);
        return null;
      }
    }

    // Add missing fetchCreatureDetails function
    async function fetchCreatureDetails(token, creatureId) {
      if (!creatureId) return null;
      
      const cacheKey = `wow-creature-details-${currentLanguage}-${creatureId}`;
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log("Returning cached creature details for:", creatureId);
        return cachedData;
      }
      
      console.log(`Fetching creature details from API for ID: ${creatureId}`);
      try {
        const url = `https://us.api.blizzard.com/data/wow/creature/${creatureId}?namespace=static-us&locale=${currentLanguage}`;
        const response = await blizzardFetch(url);
        
        if (!response.ok) {
          // It's common for creature details not to exist for battle pets, don't throw error
          if (response.status === 404) {
            console.log(`Creature details not found for ID: ${creatureId}`);
            setCachedData(cacheKey, { notFound: true }); // Cache the 404
            return null;
          }
          throw new Error(`API Error for creature ${creatureId}: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Creature API data:", data);
        setCachedData(cacheKey, data);
        return data;
      } catch (error) {
        console.error(`Error fetching creature details for ${creatureId}:`, error);
        return null;
      }
    }

    // Navigation Functions
    function showFamilies() {
      viewMode = "families";
      currentFamily = "all";
      currentCategory = null;
      currentPet = null;
      
      // Configure UI elements
      document.getElementById("family-nav").classList.remove("hidden");
      document.getElementById("category-nav").classList.add("hidden");
      document.getElementById("pet-list-header").classList.remove("hidden");
      
      // Update title and breadcrumbs
      document.getElementById("current-title").textContent = getTranslation("all-pets");
      
      // Display all pets (or current family)
      displayFamilyPets();
      updatePageText();
    }
    
    function showCategories(family) {
      viewMode = "categories";
      currentFamily = family;
      currentCategory = null;
      currentPet = null;
      
      // Configure UI elements
      document.getElementById("family-nav").classList.remove("hidden");
      document.getElementById("category-nav").classList.add("hidden");
      document.getElementById("pet-list-header").classList.remove("hidden");
      document.getElementById("pagination").classList.add("hidden");
      
      // Highlight correct family button
      document.querySelectorAll(".family-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.family === family);
      });
      
      // Update title
      document.getElementById("current-title").textContent = 
        getTranslatedFamily(family) + " " + getTranslation("categories");
      
      // Display categories
      displayCategories();
      updatePageText();
    }
    
    function showCategoryPets(family, category) {
      viewMode = "category-pets";
      currentFamily = family;
      currentCategory = category;
      currentPet = null;
      currentPage = 1;
      
      // Configure UI elements
      document.getElementById("family-nav").classList.remove("hidden");
      document.getElementById("category-nav").classList.add("hidden");
      document.getElementById("pet-list-header").classList.remove("hidden");
      
      // Update title
      document.getElementById("current-title").textContent = category;
      
      // Display pets for this category
      displayCategoryPets();
      updatePageText();
    }
    
    // Data Loading Functions
    let catalogueLoadVersion = 0;
    async function loadPetsData() {
      const version = ++catalogueLoadVersion;
      const locale = currentLanguage;
      updateBackgroundLoading(true, getTranslation("loading-background"));
      try {
        // One bundled catalogue supplies families and icons; the index supplies localized names.
        const [catalogueResponse, petIndex] = await Promise.all([
          fetch(window.WowConfig.basePath+'/data/pets.json'), fetchPetIndex(null)
        ]);
        if (!catalogueResponse.ok) throw new Error('Catalogue unavailable');
        const catalogue = await catalogueResponse.json();
        if (version !== catalogueLoadVersion || locale !== currentLanguage) return;
        const entries = new Map(petIndex.pets.map(pet => [pet.id, pet]));
        allPets = catalogue.pets.filter(pet => entries.has(pet.id)).map(pet => ({
          ...pet, name: entries.get(pet.id).name || pet.name
        })).sort((a, b) => a.name.localeCompare(b.name, locale.replace('_', '-')));
        petFamilies = {};
        petCategories = {};
        for (const pet of allPets) (petFamilies[pet.family] ||= []).push(pet);
        for (const family of Object.keys(petFamilies)) categorizeFamily(family);
        currentFamily = 'all';
        currentCategory = null;
        currentPage = 1;
        viewMode = 'families';
        setupFamilyNav();
        showPets();
        updatePageText();
      } catch (error) {
        if (version !== catalogueLoadVersion) return;
        const output = document.getElementById('output');
        output.className = 'error';
        output.textContent = getTranslation('error-load') + error.message;
      } finally {
        if (version === catalogueLoadVersion) updateBackgroundLoading(false);
      }
    }

    function showPets() {
      const container = document.getElementById("output");
      container.innerHTML = "";
      container.className = "category-grid"; // Use the category grid layout
      
      // Configure UI elements
      document.getElementById("family-nav").classList.add("hidden");
      document.getElementById("category-nav").classList.add("hidden");
      document.getElementById("pet-list-header").classList.add("hidden");
      document.getElementById("pagination").classList.add("hidden");
      document.getElementById("breadcrumbs").classList.add("hidden"); // Hide breadcrumbs on initial page
      
      // Create a card for each family
      const sortedFamilies = Object.keys(petFamilies)
        .filter(family => family !== "Unknown" && petFamilies[family].length > 0)
        .sort();
        
      sortedFamilies.forEach(family => {
        const familyCount = petFamilies[family].length;
        if (familyCount === 0) return;
        
        // Get a sample pet for the family image
        const samplePet = petFamilies[family][0];
        
        // Create card element instead of button
        const familyCard = document.createElement("div");
        familyCard.className = "category-card";
        familyCard.dataset.family = family;
        
        
        const translatedFamily = getTranslatedFamily(family);
        
        // Create card content similar to category cards
        let html = `
          <h3>${translatedFamily}</h3>
        `;
        
        // Add sample image
        if (samplePet && samplePet.icon) {
          html += `<img src="${samplePet.icon}" alt="${translatedFamily}" loading="lazy" decoding="async">`;
        } else {
          html += `<div class="placeholder-img">?</div>`;
        }
        
        html += `<div class="count">${familyCount} pets</div>`;
        
        familyCard.innerHTML = html;
        
        familyCard.addEventListener("click", () => {
          currentFamily = family;
          currentPage = 1;
          showCategories(family);
        });
        
        container.appendChild(familyCard);
      });
    }
    
    function addMissingTranslations() {
      // Add any missing translations
      const missingTranslations = {
        "appearance-rating": {
          "en_US": "Appearance Rating",
          "pt_BR": "Avaliação de Aparência"
        },
        "battle-rating": {
          "en_US": "Battle Rating",
          "pt_BR": "Avaliação de Batalha"
        },
        "vendor": {
          "en_US": "Vendor",
          "pt_BR": "Vendedor"
        },
        "zone": {
          "en_US": "Zone",
          "pt_BR": "Zona"
        },
        "cost": {
          "en_US": "Cost",
          "pt_BR": "Custo"
        },
        "item": {
          "en_US": "Item",
          "pt_BR": "Item"
        },
        "base-quality": {
          "en_US": "Base Quality",
          "pt_BR": "Qualidade Base"
        },
        "cageable": {
          "en_US": "Cageable",
          "pt_BR": "Engaiolável"
        },
        "faction": {
          "en_US": "Faction",
          "pt_BR": "Facção"
        },
        "family": {
          "en_US": "Family",
          "pt_BR": "Família"
        },
        "yes": {
          "en_US": "Yes",
          "pt_BR": "Sim"
        },
        "no": {
          "en_US": "No",
          "pt_BR": "Não"
        }
      };
      
      // Add missing translations to the existing translations object
      Object.keys(missingTranslations).forEach(key => {
        if (!translations[key]) {
          translations[key] = missingTranslations[key];
        }
      });
    }
    
    // Main entry point
    async function init() {
      // Add missing translations first
      addMissingTranslations();
      
      // Init language buttons
      document.getElementById("lang-en").addEventListener("click", () => {
        if (currentLanguage !== "en_US") {
          currentLanguage = "en_US";
          sessionStorage.setItem("wow-language", currentLanguage);
          updateLanguageButtons();
          document.getElementById("output").className = "loading";
          document.getElementById("output").textContent = getTranslation("loading");
          loadPetsData();
        }
      });
      
      document.getElementById("lang-pt").addEventListener("click", () => {
        if (currentLanguage !== "pt_BR") {
          currentLanguage = "pt_BR";
          sessionStorage.setItem("wow-language", currentLanguage);
          updateLanguageButtons();
          document.getElementById("output").className = "loading";
          document.getElementById("output").textContent = getTranslation("loading");
          loadPetsData();
        }
      });
      
      // Initialize the UI
      updateLanguageButtons();
      
      // Start loading pets
      document.getElementById("output").className = "loading";
      document.getElementById("output").textContent = getTranslation("loading");
      
      loadPetsData();
    }
    
    // Run the application
    init();
  
})();
