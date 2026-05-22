// ================================================
//   app.js — LireMonde · Fichier JavaScript UNIQUE
//   Contient : API + Accueil + À lire + Admin
// ================================================

const BASE_URL = "http://localhost:3000";

// ================================================
//   PARTIE 1 — API (toutes les requêtes fetch)
// ================================================

// Récupérer tous les livres
async function getLivres() {
  try {
    const rep = await fetch(`${BASE_URL}/livres`);
    return await rep.json();
  } catch (err) {
    console.error("getLivres :", err);
    return null;
  }
}

// Récupérer un livre par son id
async function getLivreById(id) {
  try {
    const rep = await fetch(`${BASE_URL}/livres/${id}`);
    return await rep.json();
  } catch (err) {
    console.error("getLivreById :", err);
    return null;
  }
}

// Ajouter un nouveau livre
async function ajouterLivre(data) {
  try {
    const rep = await fetch(`${BASE_URL}/livres`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await rep.json();
  } catch (err) {
    console.error("ajouterLivre :", err);
    return null;
  }
}

// Modifier un livre entier
async function modifierLivre(id, data) {
  try {
    const rep = await fetch(`${BASE_URL}/livres/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await rep.json();
  } catch (err) {
    console.error("modifierLivre :", err);
    return null;
  }
}

// Supprimer un livre
async function supprimerLivre(id) {
  try {
    await fetch(`${BASE_URL}/livres/${id}`, { method: "DELETE" });
    return true;
  } catch (err) {
    console.error("supprimerLivre :", err);
    return null;
  }
}

// Changer uniquement le champ aLire
async function toggleALire(id, valeur) {
  try {
    const rep = await fetch(`${BASE_URL}/livres/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aLire: valeur }),
    });
    return await rep.json();
  } catch (err) {
    console.error("toggleALire :", err);
    return null;
  }
}

// ================================================
//   PARTIE 2 — PAGE ACCUEIL (index.html)
// ================================================

let livresTous = [];
let genreActif = "Tous";

async function initAccueil() {
  livresTous = await getLivres();

  if (!livresTous) {
    document.getElementById("livres-grid").innerHTML =
      "<p style='color:red'>❌ JSON Server non démarré !</p>";
    return;
  }

  afficherLivres(livresTous);
  creerFiltresGenre(livresTous);

  document.getElementById("recherche").addEventListener("input", filtrerLivres);
}

// Afficher les cartes de livres
function afficherLivres(liste) {
  const grille = document.getElementById("livres-grid");
  grille.innerHTML = "";

  if (liste.length === 0) {
    grille.innerHTML = "<p class='message-vide'>Aucun livre trouvé.</p>";
    return;
  }

  liste.forEach((livre) => {
    const carte = document.createElement("div");
    carte.classList.add("carte-livre");
    carte.innerHTML = `
      <img src="${livre.couverture}" alt="${livre.titre}" />
      <div class="carte-info">
        <h3>${livre.titre}</h3>
        <p>${livre.auteur}</p>
      </div>
    `;
    carte.addEventListener("click", () => ouvrirModale(livre));
    grille.appendChild(carte);
  });
}

// Créer les boutons de filtre par genre
function creerFiltresGenre(liste) {
  const section = document.getElementById("filtres");
  section.innerHTML = "";

  const genres = ["Tous", ...new Set(liste.map((l) => l.genre))];

  genres.forEach((genre) => {
    const btn = document.createElement("button");
    btn.textContent = genre;
    if (genre === "Tous") btn.classList.add("actif");

    btn.addEventListener("click", () => {
      genreActif = genre;
      section.querySelectorAll("button").forEach((b) => b.classList.remove("actif"));
      btn.classList.add("actif");
      filtrerLivres();
    });

    section.appendChild(btn);
  });
}

// Filtrer par genre ET par recherche
function filtrerLivres() {
  const motCle = document.getElementById("recherche").value.toLowerCase();

  let resultat = livresTous;

  if (genreActif !== "Tous") {
    resultat = resultat.filter((l) => l.genre === genreActif);
  }

  if (motCle.trim() !== "") {
    resultat = resultat.filter(
      (l) =>
        l.titre.toLowerCase().includes(motCle) ||
        l.auteur.toLowerCase().includes(motCle)
    );
  }

  afficherLivres(resultat);
}

// Ouvrir la modale avec les détails du livre
function ouvrirModale(livre) {
  const modale = document.getElementById("modale");

  modale.innerHTML = `
    <div class="modale-boite">
      <button id="fermer-modale">✕</button>
      <img src="${livre.couverture}" alt="${livre.titre}" />
      <span class="genre-badge">${livre.genre}</span>
      <h2>${livre.titre}</h2>
      <p class="auteur-modale">✍️ ${livre.auteur}</p>
      <p class="description-modale">${livre.description}</p>
      <button class="btn-accent" id="btn-alire">
        ${livre.aLire ? "➖ Retirer de ma liste" : "➕ Ajouter à ma liste"}
      </button>
    </div>
  `;

  modale.classList.remove("cache");

  document.getElementById("fermer-modale").addEventListener("click", fermerModale);
  modale.addEventListener("click", (e) => { if (e.target === modale) fermerModale(); });

  document.getElementById("btn-alire").addEventListener("click", async () => {
    const nouvelleValeur = !livre.aLire;
    const livreModifie = await toggleALire(livre.id, nouvelleValeur);

    if (livreModifie) {
      livre.aLire = nouvelleValeur;
      const index = livresTous.findIndex((l) => l.id === livre.id);
      if (index !== -1) livresTous[index].aLire = nouvelleValeur;

      document.getElementById("btn-alire").textContent = nouvelleValeur
        ? "➖ Retirer de ma liste"
        : "➕ Ajouter à ma liste";
    }
  });
}

// Fermer la modale
function fermerModale() {
  document.getElementById("modale").classList.add("cache");
}

// ================================================
//   PARTIE 3 — PAGE À LIRE (alire.html)
// ================================================

async function initAlire() {
  const tousLesLivres = await getLivres();

  if (!tousLesLivres) {
    document.getElementById("alire-grid").innerHTML =
      "<p style='color:red'>❌ JSON Server non démarré !</p>";
    return;
  }

  const livresALire = tousLesLivres.filter((livre) => livre.aLire === true);
  afficherALire(livresALire);
}

// Afficher les livres de la liste À lire
function afficherALire(liste) {
  const grille = document.getElementById("alire-grid");
  grille.innerHTML = "";

  if (liste.length === 0) {
    grille.innerHTML =
      "<p class='message-vide'>📭 Votre liste est vide. Ajoutez des livres depuis l'accueil !</p>";
    return;
  }

  liste.forEach((livre) => {
    const carte = document.createElement("div");
    carte.classList.add("carte-livre");
    carte.setAttribute("data-id", livre.id);

    carte.innerHTML = `
      <img src="${livre.couverture}" alt="${livre.titre}" />
      <div class="carte-info">
        <h3>${livre.titre}</h3>
        <p>${livre.auteur}</p>
        <button class="btn-danger" style="margin-top:8px;width:100%">
          ✖ Retirer de la liste
        </button>
      </div>
    `;

    carte.querySelector(".btn-danger").addEventListener("click", async () => {
      const ok = await toggleALire(livre.id, false);
      if (ok) {
        carte.remove();
        const grille = document.getElementById("alire-grid");
        if (grille.children.length === 0) {
          grille.innerHTML =
            "<p class='message-vide'>📭 Votre liste est vide. Ajoutez des livres depuis l'accueil !</p>";
        }
      }
    });

    grille.appendChild(carte);
  });
}

// ================================================
//   PARTIE 4 — PAGE ADMIN (admin.html)
// ================================================

async function initAdmin() {
  await chargerTableau();

  document.getElementById("form-livre").addEventListener("submit", soumettreFormulaire);
  document.getElementById("btn-annuler").addEventListener("click", reinitialiserFormulaire);
}

// Charger tous les livres dans le tableau
async function chargerTableau() {
  const livres = await getLivres();

  if (!livres) {
    document.getElementById("corps-tableau").innerHTML =
      `<tr><td colspan="4" style="color:red">❌ JSON Server non démarré.</td></tr>`;
    return;
  }

  const corps = document.getElementById("corps-tableau");
  corps.innerHTML = "";
  livres.forEach((livre) => corps.appendChild(creerLigne(livre)));
}

// Créer une ligne du tableau
function creerLigne(livre) {
  const ligne = document.createElement("tr");
  ligne.setAttribute("data-id", livre.id);

  ligne.innerHTML = `
    <td>${livre.titre}</td>
    <td>${livre.auteur}</td>
    <td>${livre.genre}</td>
    <td class="actions-cell">
      <button class="btn-neutre btn-modifier">✏️ Modifier</button>
      <button class="btn-danger btn-supprimer">🗑️ Supprimer</button>
    </td>
  `;

  ligne.querySelector(".btn-modifier").addEventListener("click", () => remplirFormulaire(livre));
  ligne.querySelector(".btn-supprimer").addEventListener("click", () => supprimerLigneLivre(livre.id, ligne));

  return ligne;
}

// Remplir le formulaire pour modifier
function remplirFormulaire(livre) {
  document.getElementById("champ-id").value          = livre.id;
  document.getElementById("champ-titre").value       = livre.titre;
  document.getElementById("champ-auteur").value      = livre.auteur;
  document.getElementById("champ-genre").value       = livre.genre;
  document.getElementById("champ-description").value = livre.description;
  document.getElementById("champ-couverture").value  = livre.couverture;

  document.getElementById("btn-submit").textContent      = "💾 Sauvegarder";
  document.getElementById("form-titre").textContent      = "✏️ Modifier un livre";
  document.getElementById("btn-annuler").style.display   = "inline-block";

  document.getElementById("form-livre").scrollIntoView({ behavior: "smooth" });
}

// Soumettre le formulaire (ajout ou modification)
async function soumettreFormulaire(e) {
  e.preventDefault();

  const id          = document.getElementById("champ-id").value;
  const titre       = document.getElementById("champ-titre").value.trim();
  const auteur      = document.getElementById("champ-auteur").value.trim();
  const genre       = document.getElementById("champ-genre").value;
  const description = document.getElementById("champ-description").value.trim();
  const couverture  = document.getElementById("champ-couverture").value.trim()
                      || "https://picsum.photos/200/300?random=99";

  const data = { titre, auteur, genre, description, couverture, aLire: false };

  if (id === "") {
    // AJOUT
    const nouveauLivre = await ajouterLivre(data);
    if (nouveauLivre) {
      document.getElementById("corps-tableau").appendChild(creerLigne(nouveauLivre));
    }
  } else {
    // MODIFICATION
    const ancienLivre = await getLivreById(id);
    data.aLire = ancienLivre ? ancienLivre.aLire : false;

    const livreModifie = await modifierLivre(id, data);
    if (livreModifie) {
      const ancienneLigne = document.querySelector(`tr[data-id="${id}"]`);
      if (ancienneLigne) ancienneLigne.replaceWith(creerLigne(livreModifie));
    }
  }

  reinitialiserFormulaire();
}

// Supprimer un livre
async function supprimerLigneLivre(id, ligneElement) {
  const confirme = confirm("❓ Voulez-vous vraiment supprimer ce livre ?");
  if (!confirme) return;

  const ok = await supprimerLivre(id);
  if (ok) ligneElement.remove();
}

// Remettre le formulaire à zéro
function reinitialiserFormulaire() {
  document.getElementById("champ-id").value          = "";
  document.getElementById("champ-titre").value       = "";
  document.getElementById("champ-auteur").value      = "";
  document.getElementById("champ-genre").value       = "Classique";
  document.getElementById("champ-description").value = "";
  document.getElementById("champ-couverture").value  = "";

  document.getElementById("btn-submit").textContent    = "➕ Ajouter le livre";
  document.getElementById("form-titre").textContent    = "➕ Ajouter un livre";
  document.getElementById("btn-annuler").style.display = "none";
}

// ================================================
//   DÉMARRAGE — Détecte quelle page est ouverte
// ================================================

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("livres-grid"))  initAccueil();
  if (document.getElementById("alire-grid"))   initAlire();
  if (document.getElementById("corps-tableau")) initAdmin();
});