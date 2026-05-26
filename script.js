// ================================================
//   script.js — LireMonde
//   Un seul fichier JS pour les 3 pages
// ================================================

const BASE_URL = "http://localhost:3000";

// ================================================
//   PARTIE 1 — FONCTIONS API
// ================================================

// Récupérer tous les livres
async function getLivres() {
  try {
    const reponse = await fetch(`${BASE_URL}/livres`);
    const livres  = await reponse.json();
    return livres;
  } catch (erreur) {
    console.error("Erreur getLivres :", erreur);
    return null;
  }
}

// Récupérer un seul livre par son id
async function getLivreById(id) {
  try {
    const reponse = await fetch(`${BASE_URL}/livres/${id}`);
    const livre   = await reponse.json();
    return livre;
  } catch (erreur) {
    console.error("Erreur getLivreById :", erreur);
    return null;
  }
}

// Ajouter un nouveau livre (POST)
async function ajouterLivre(donnees) {
  try {
    const reponse = await fetch(`${BASE_URL}/livres`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(donnees)
    });
    const livre = await reponse.json();
    return livre;
  } catch (erreur) {
    console.error("Erreur ajouterLivre :", erreur);
    return null;
  }
}

// Modifier un livre existant (PUT)
async function modifierLivre(id, donnees) {
  try {
    const reponse = await fetch(`${BASE_URL}/livres/${id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(donnees)
    });
    const livre = await reponse.json();
    return livre;
  } catch (erreur) {
    console.error("Erreur modifierLivre :", erreur);
    return null;
  }
}

// Supprimer un livre (DELETE)
async function supprimerLivre(id) {
  try {
    await fetch(`${BASE_URL}/livres/${id}`, { method: "DELETE" });
    return true;
  } catch (erreur) {
    console.error("Erreur supprimerLivre :", erreur);
    return null;
  }
}

// Changer uniquement le champ aLire (PATCH)
async function toggleALire(id, valeur) {
  try {
    const reponse = await fetch(`${BASE_URL}/livres/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ aLire: valeur })
    });
    const livre = await reponse.json();
    return livre;
  } catch (erreur) {
    console.error("Erreur toggleALire :", erreur);
    return null;
  }
}

// ================================================
//   PARTIE 2 — PAGE ACCUEIL
// ================================================

let livresTous = [];
let genreActif = "Tous";

async function initAccueil() {
  livresTous = await getLivres();

  if (!livresTous) {
    document.getElementById("livres-grid").innerHTML =
      "<p class='vide'>JSON Server non demarre. Lance : npm start</p>";
    return;
  }

  afficherLivres(livresTous);
  creerFiltres(livresTous);
  document.getElementById("recherche").addEventListener("input", filtrerLivres);
}

function afficherLivres(liste) {
  const grille = document.getElementById("livres-grid");
  grille.innerHTML = "";

  if (liste.length === 0) {
    grille.innerHTML = "<p class='vide'>Aucun livre trouve.</p>";
    return;
  }

  liste.forEach(function(livre) {
    const carte = document.createElement("div");
    carte.classList.add("carte");

    carte.innerHTML =
      '<img src="' + livre.couverture + '" alt="' + livre.titre + '" />' +
      '<div class="carte-body">' +
        '<h3>' + livre.titre + '</h3>' +
        '<p class="auteur">' + livre.auteur + '</p>' +
        '<span class="badge badge-genre">' + livre.genre + '</span>' +
      '</div>';

    carte.addEventListener("click", function() {
      ouvrirModale(livre);
    });

    grille.appendChild(carte);
  });
}

function creerFiltres(liste) {
  const section = document.getElementById("filtres");
  section.innerHTML = "";

  const genres = ["Tous"];
  liste.forEach(function(l) {
    if (!genres.includes(l.genre)) genres.push(l.genre);
  });

  genres.forEach(function(genre) {
    const btn = document.createElement("button");
    btn.textContent = genre;
    if (genre === "Tous") btn.classList.add("actif");

    btn.addEventListener("click", function() {
      genreActif = genre;
      section.querySelectorAll("button").forEach(function(b) {
        b.classList.remove("actif");
      });
      btn.classList.add("actif");
      filtrerLivres();
    });

    section.appendChild(btn);
  });
}

function filtrerLivres() {
  const motCle = document.getElementById("recherche").value.toLowerCase();
  let resultat = livresTous;

  if (genreActif !== "Tous") {
    resultat = resultat.filter(function(l) {
      return l.genre === genreActif;
    });
  }

  if (motCle.trim() !== "") {
    resultat = resultat.filter(function(l) {
      return l.titre.toLowerCase().includes(motCle) ||
             l.auteur.toLowerCase().includes(motCle);
    });
  }

  afficherLivres(resultat);
}

function ouvrirModale(livre) {
  const modale = document.getElementById("modale");

  modale.innerHTML =
    '<div class="modale-box">' +
      '<button class="modale-fermer" id="fermer-modale">✕</button>' +
      '<img class="cover" src="' + livre.couverture + '" alt="' + livre.titre + '" />' +
      '<div class="modale-body">' +
        '<span class="badge badge-genre">' + livre.genre + '</span>' +
        '<h2>' + livre.titre + '</h2>' +
        '<p class="sous-titre">' + livre.auteur + '</p>' +
        '<p class="desc">' + livre.description + '</p>' +
        '<button class="btn btn-or" id="btn-alire">' +
          (livre.aLire ? "➖ Retirer de ma liste" : "➕ Ajouter a ma liste") +
        '</button>' +
      '</div>' +
    '</div>';

  modale.classList.remove("cache");

  document.getElementById("fermer-modale").addEventListener("click", fermerModale);
  modale.addEventListener("click", function(e) {
    if (e.target === modale) fermerModale();
  });

  document.getElementById("btn-alire").addEventListener("click", async function() {
    const nouvelleValeur = !livre.aLire;
    const resultat = await toggleALire(livre.id, nouvelleValeur);
    if (resultat) {
      livre.aLire = nouvelleValeur;
      const index = livresTous.findIndex(function(l) { return l.id === livre.id; });
      if (index !== -1) livresTous[index].aLire = nouvelleValeur;
      document.getElementById("btn-alire").textContent =
        nouvelleValeur ? "➖ Retirer de ma liste" : "➕ Ajouter a ma liste";
    }
  });
}

function fermerModale() {
  document.getElementById("modale").classList.add("cache");
}

// ================================================
//   PARTIE 3 — PAGE A LIRE
// ================================================

async function initAlire() {
  const tousLesLivres = await getLivres();

  if (!tousLesLivres) {
    document.getElementById("alire-grid").innerHTML =
      "<p class='vide'>JSON Server non demarre. Lance : npm start</p>";
    return;
  }

  const livresALire = tousLesLivres.filter(function(livre) {
    return livre.aLire === true;
  });

  afficherALire(livresALire);
}

function afficherALire(liste) {
  const grille = document.getElementById("alire-grid");
  grille.innerHTML = "";

  if (liste.length === 0) {
    grille.innerHTML = "<p class='vide'>Votre liste est vide. Ajoutez des livres depuis l'accueil !</p>";
    return;
  }

  liste.forEach(function(livre) {
    const carte = document.createElement("div");
    carte.classList.add("carte");

    carte.innerHTML =
      '<img src="' + livre.couverture + '" alt="' + livre.titre + '" />' +
      '<div class="carte-body">' +
        '<h3>' + livre.titre + '</h3>' +
        '<p class="auteur">' + livre.auteur + '</p>' +
        '<span class="badge badge-genre">' + livre.genre + '</span>' +
        '<button class="btn-retirer">✖ Retirer de la liste</button>' +
      '</div>';

    carte.querySelector(".btn-retirer").addEventListener("click", async function() {
      const resultat = await toggleALire(livre.id, false);
      if (resultat) {
        carte.remove();
        if (grille.children.length === 0) {
          grille.innerHTML = "<p class='vide'>Votre liste est vide.</p>";
        }
      }
    });

    grille.appendChild(carte);
  });
}

// ================================================
//   PARTIE 4 — PAGE ADMIN
// ================================================

async function initAdmin() {
  await chargerTableau();
  document.getElementById("form-livre").addEventListener("submit", soumettreFormulaire);
  document.getElementById("btn-annuler").addEventListener("click", viderFormulaire);
}

async function chargerTableau() {
  const livres = await getLivres();

  if (!livres) {
    document.getElementById("corps-tableau").innerHTML =
      '<tr><td colspan="4" style="color:red">JSON Server non demarre.</td></tr>';
    return;
  }

  const corps = document.getElementById("corps-tableau");
  corps.innerHTML = "";
  livres.forEach(function(livre) {
    corps.appendChild(creerLigne(livre));
  });
}

function creerLigne(livre) {
  const ligne = document.createElement("tr");
  ligne.setAttribute("data-id", livre.id);

  ligne.innerHTML =
    '<td>' + livre.titre + '</td>' +
    '<td>' + livre.auteur + '</td>' +
    '<td><span class="badge badge-genre">' + livre.genre + '</span></td>' +
    '<td class="td-actions">' +
      '<button class="btn btn-bleu btn-modifier">✏️ Modifier</button>' +
      '<button class="btn btn-rouge btn-supprimer">🗑️ Supprimer</button>' +
    '</td>';

  ligne.querySelector(".btn-modifier").addEventListener("click", function() {
    remplirFormulaire(livre);
  });
  ligne.querySelector(".btn-supprimer").addEventListener("click", function() {
    supprimerLigneLivre(livre.id, ligne);
  });

  return ligne;
}

function remplirFormulaire(livre) {
  document.getElementById("champ-id").value          = livre.id;
  document.getElementById("champ-titre").value       = livre.titre;
  document.getElementById("champ-auteur").value      = livre.auteur;
  document.getElementById("champ-genre").value       = livre.genre;
  document.getElementById("champ-description").value = livre.description;
  document.getElementById("champ-couverture").value  = livre.couverture;
  document.getElementById("form-titre").textContent  = "✏️ Modifier un livre";
  document.getElementById("btn-submit").textContent  = "💾 Sauvegarder";
  document.getElementById("btn-annuler").style.display = "inline-block";
  document.getElementById("form-livre").scrollIntoView({ behavior: "smooth" });
}

async function soumettreFormulaire(e) {
  e.preventDefault();

  const id          = document.getElementById("champ-id").value;
  const titre       = document.getElementById("champ-titre").value.trim();
  const auteur      = document.getElementById("champ-auteur").value.trim();
  const genre       = document.getElementById("champ-genre").value;
  const description = document.getElementById("champ-description").value.trim();
  const couverture  = document.getElementById("champ-couverture").value.trim()
                      || "https://picsum.photos/200/300?random=99";

  const donnees = { titre, auteur, genre, description, couverture, aLire: false };

  if (id === "") {
    const nouveauLivre = await ajouterLivre(donnees);
    if (nouveauLivre) {
      document.getElementById("corps-tableau").appendChild(creerLigne(nouveauLivre));
    }
  } else {
    const ancienLivre = await getLivreById(id);
    donnees.aLire = ancienLivre ? ancienLivre.aLire : false;
    const livreModifie = await modifierLivre(id, donnees);
    if (livreModifie) {
      const ancienneLigne = document.querySelector('tr[data-id="' + id + '"]');
      if (ancienneLigne) ancienneLigne.replaceWith(creerLigne(livreModifie));
    }
  }

  viderFormulaire();
}

async function supprimerLigneLivre(id, ligne) {
  const confirme = confirm("Voulez-vous vraiment supprimer ce livre ?");
  if (!confirme) return;
  const ok = await supprimerLivre(id);
  if (ok) ligne.remove();
}

function viderFormulaire() {
  document.getElementById("champ-id").value          = "";
  document.getElementById("champ-titre").value       = "";
  document.getElementById("champ-auteur").value      = "";
  document.getElementById("champ-genre").value       = "Classique";
  document.getElementById("champ-description").value = "";
  document.getElementById("champ-couverture").value  = "";
  document.getElementById("form-titre").textContent  = "➕ Ajouter un livre";
  document.getElementById("btn-submit").textContent  = "➕ Ajouter le livre";
  document.getElementById("btn-annuler").style.display = "none";
}

// ================================================
//   DEMARRAGE
// ================================================

document.addEventListener("DOMContentLoaded", function() {
  if (document.getElementById("livres-grid"))   initAccueil();
  if (document.getElementById("alire-grid"))    initAlire();
  if (document.getElementById("corps-tableau")) initAdmin();
});