// ================================
//  app.js — LireMonde
// ================================

const URL = "http://localhost:3000/livres";

// ================================
//  API — les requêtes fetch
// ================================

async function getLivres() {
  try {
    const rep = await fetch(URL);
    return await rep.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function getLivreById(id) {
  try {
    const rep = await fetch(`${URL}/${id}`);
    return await rep.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function ajouterLivre(data) {
  try {
    const rep = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await rep.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function modifierLivre(id, data) {
  try {
    const rep = await fetch(`${URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await rep.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function supprimerLivre(id) {
  try {
    await fetch(`${URL}/${id}`, { method: "DELETE" });
    return true;
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function toggleALire(id, valeur) {
  try {
    const rep = await fetch(`${URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aLire: valeur }),
    });
    return await rep.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

// ================================
//  PAGE ACCUEIL
// ================================

let livresTous = [];
let genreActif = "Tous";

async function initAccueil() {
  livresTous = await getLivres();
  if (!livresTous) return;

  afficherLivres(livresTous);
  creerFiltres(livresTous);

  document.getElementById("recherche")
    .addEventListener("input", filtrer);
}

function afficherLivres(liste) {
  const grille = document.getElementById("livres-grid");
  grille.innerHTML = "";

  if (!liste.length) {
    grille.innerHTML = "<p class='vide'>Aucun livre trouvé.</p>";
    return;
  }

  liste.forEach((livre) => {
    const div = document.createElement("div");
    div.className = "carte";
    div.innerHTML = `
      <img src="${livre.couverture}" alt="${livre.titre}" />
      <div class="info">
        <h3>${livre.titre}</h3>
        <p>${livre.auteur}</p>
      </div>
    `;
    div.onclick = () => ouvrirModale(livre);
    grille.appendChild(div);
  });
}

function creerFiltres(liste) {
  const box = document.getElementById("filtres");
  box.innerHTML = "";

  const genres = ["Tous", ...new Set(liste.map((l) => l.genre))];

  genres.forEach((g) => {
    const btn = document.createElement("button");
    btn.textContent = g;
    if (g === "Tous") btn.classList.add("actif");

    btn.onclick = () => {
      genreActif = g;
      box.querySelectorAll("button")
         .forEach((b) => b.classList.remove("actif"));
      btn.classList.add("actif");
      filtrer();
    };
    box.appendChild(btn);
  });
}

function filtrer() {
  const mot = document.getElementById("recherche")
                .value.toLowerCase();

  let res = livresTous;

  if (genreActif !== "Tous")
    res = res.filter((l) => l.genre === genreActif);

  if (mot)
    res = res.filter(
      (l) => l.titre.toLowerCase().includes(mot) ||
             l.auteur.toLowerCase().includes(mot)
    );

  afficherLivres(res);
}

function ouvrirModale(livre) {
  const modale = document.getElementById("modale");

  modale.innerHTML = `
    <div class="boite">
      <button id="btn-fermer">✕</button>
      <img src="${livre.couverture}" alt="${livre.titre}" />
      <span class="badge">${livre.genre}</span>
      <h2>${livre.titre}</h2>
      <p class="auteur">✍️ ${livre.auteur}</p>
      <p class="desc">${livre.description}</p>
      <button class="btn-vert" id="btn-alire">
        ${livre.aLire ? "➖ Retirer de ma liste" : "➕ Ajouter à ma liste"}
      </button>
    </div>
  `;

  modale.classList.remove("cache");

  document.getElementById("btn-fermer").onclick = fermerModale;
  modale.onclick = (e) => { if (e.target === modale) fermerModale(); };

  document.getElementById("btn-alire").onclick = async () => {
    const nv = !livre.aLire;
    const ok = await toggleALire(livre.id, nv);
    if (ok) {
      livre.aLire = nv;
      livresTous.find((l) => l.id === livre.id).aLire = nv;
      document.getElementById("btn-alire").textContent =
        nv ? "➖ Retirer de ma liste" : "➕ Ajouter à ma liste";
    }
  };
}

function fermerModale() {
  document.getElementById("modale").classList.add("cache");
}

// ================================
//  PAGE À LIRE
// ================================

async function initAlire() {
  const livres = await getLivres();
  if (!livres) return;

  const liste = livres.filter((l) => l.aLire === true);
  const grille = document.getElementById("alire-grid");
  grille.innerHTML = "";

  if (!liste.length) {
    grille.innerHTML =
      "<p class='vide'>📭 Liste vide. Ajoutez des livres depuis l'accueil !</p>";
    return;
  }

  liste.forEach((livre) => {
    const div = document.createElement("div");
    div.className = "carte";
    div.innerHTML = `
      <img src="${livre.couverture}" alt="${livre.titre}" />
      <div class="info">
        <h3>${livre.titre}</h3>
        <p>${livre.auteur}</p>
        <button class="btn-rouge">✖ Retirer</button>
      </div>
    `;
    div.querySelector(".btn-rouge").onclick = async () => {
      const ok = await toggleALire(livre.id, false);
      if (ok) {
        div.remove();
        if (!grille.children.length)
          grille.innerHTML =
            "<p class='vide'>📭 Liste vide. Ajoutez des livres depuis l'accueil !</p>";
      }
    };
    grille.appendChild(div);
  });
}

// ================================
//  PAGE ADMIN
// ================================

async function initAdmin() {
  await chargerTableau();

  document.getElementById("form-livre")
    .addEventListener("submit", soumettre);
  document.getElementById("btn-annuler")
    .addEventListener("click", resetForm);
}

async function chargerTableau() {
  const livres = await getLivres();
  if (!livres) return;

  const tbody = document.getElementById("corps-tableau");
  tbody.innerHTML = "";
  livres.forEach((l) => tbody.appendChild(creerLigne(l)));
}

function creerLigne(livre) {
  const tr = document.createElement("tr");
  tr.setAttribute("data-id", livre.id);
  tr.innerHTML = `
    <td>${livre.titre}</td>
    <td>${livre.auteur}</td>
    <td>${livre.genre}</td>
    <td>
      <button class="btn-bleu">✏️ Modifier</button>
      <button class="btn-rouge">🗑️ Supprimer</button>
    </td>
  `;
  tr.querySelector(".btn-bleu").onclick  = () => remplirForm(livre);
  tr.querySelector(".btn-rouge").onclick = () => supprimer(livre.id, tr);
  return tr;
}

function remplirForm(livre) {
  document.getElementById("champ-id").value    = livre.id;
  document.getElementById("champ-titre").value = livre.titre;
  document.getElementById("champ-auteur").value = livre.auteur;
  document.getElementById("champ-genre").value = livre.genre;
  document.getElementById("champ-desc").value  = livre.description;
  document.getElementById("champ-img").value   = livre.couverture;

  document.getElementById("btn-submit").textContent = "💾 Sauvegarder";
  document.getElementById("form-titre").textContent = "✏️ Modifier";
  document.getElementById("btn-annuler").style.display = "inline-block";
  document.getElementById("form-livre").scrollIntoView({ behavior: "smooth" });
}

async function soumettre(e) {
  e.preventDefault();

  const id    = document.getElementById("champ-id").value;
  const data  = {
    titre:       document.getElementById("champ-titre").value.trim(),
    auteur:      document.getElementById("champ-auteur").value.trim(),
    genre:       document.getElementById("champ-genre").value,
    description: document.getElementById("champ-desc").value.trim(),
    couverture:  document.getElementById("champ-img").value.trim()
                 || "https://picsum.photos/200/300?random=99",
    aLire: false,
  };

  if (!id) {
    const nouveau = await ajouterLivre(data);
    if (nouveau)
      document.getElementById("corps-tableau")
              .appendChild(creerLigne(nouveau));
  } else {
    const ancien = await getLivreById(id);
    data.aLire = ancien ? ancien.aLire : false;
    const modifie = await modifierLivre(id, data);
    if (modifie) {
      const tr = document.querySelector(`tr[data-id="${id}"]`);
      if (tr) tr.replaceWith(creerLigne(modifie));
    }
  }

  resetForm();
}

async function supprimer(id, tr) {
  if (!confirm("Supprimer ce livre ?")) return;
  const ok = await supprimerLivre(id);
  if (ok) tr.remove();
}

function resetForm() {
  ["champ-id","champ-titre","champ-auteur",
   "champ-desc","champ-img"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("champ-genre").value        = "Classique";
  document.getElementById("btn-submit").textContent   = "➕ Ajouter";
  document.getElementById("form-titre").textContent   = "➕ Ajouter un livre";
  document.getElementById("btn-annuler").style.display = "none";
}

// ================================
//  DÉMARRAGE — détecte la page
// ================================
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("livres-grid"))    initAccueil();
  if (document.getElementById("alire-grid"))     initAlire();
  if (document.getElementById("corps-tableau"))  initAdmin();
});