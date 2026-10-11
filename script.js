var vehicules = [];
var catalogueDataTable = null;

function obtenirDatesEtDuree(dateDebut, dateFin) {
    if (!dateDebut || !dateFin) {
        return null;
    }

    var debut = new Date(dateDebut + "T00:00:00Z");
    var fin = new Date(dateFin + "T00:00:00Z");

    if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime()) || fin < debut) {
        return null;
    }

    var nombreJours = Math.max(1, (fin - debut) / (1000 * 60 * 60 * 24));
    return { debut: debut, fin: fin, nombreJours: nombreJours };
}

function lireReservationsLocales() {
    var texte;
    try {
        texte = localStorage.getItem("autoRentReservations");
    } catch (error) {
        throw new Error("Le stockage local des réservations est inaccessible : " + error.message);
    }
    if (!texte) {
        return [];
    }

    var reservations;
    try {
        reservations = JSON.parse(texte);
    } catch (error) {
        throw new Error("Les réservations enregistrées sont illisibles : " + error.message);
    }
    if (!Array.isArray(reservations) || reservations.some(function (reservation) {
        return !reservation || (typeof reservation.voitureId !== "string"
            && !Number.isInteger(reservation.voitureId))
            || typeof reservation.dateDebut !== "string"
            || typeof reservation.dateFin !== "string"
            || !obtenirDatesEtDuree(reservation.dateDebut, reservation.dateFin);
    })) {
        throw new Error("Les réservations enregistrées sont invalides. Effacez les données Auto Rent du navigateur.");
    }
    return reservations;
}

function datesChevauchent(dateDebut, dateFin, reservation) {
    var debut = new Date(dateDebut + "T00:00:00Z").getTime();
    var fin = new Date(dateFin + "T00:00:00Z").getTime();
    var ancienDebut = new Date(reservation.dateDebut + "T00:00:00Z").getTime();
    var ancienneFin = new Date(reservation.dateFin + "T00:00:00Z").getTime();
    if (fin === debut) {
        fin += 86400000;
    }
    if (ancienneFin === ancienDebut) {
        ancienneFin += 86400000;
    }
    return debut < ancienneFin && fin > ancienDebut;
}

function voitureDisponiblePourDates(voitureId, dateDebut, dateFin) {
    if (!dateDebut || !dateFin || !obtenirDatesEtDuree(dateDebut, dateFin)) {
        return true;
    }
    var reservations = lireReservationsLocales();
    return !reservations.some(function (reservation) {
        return String(reservation.voitureId) === String(voitureId)
            && datesChevauchent(dateDebut, dateFin, reservation);
    });
}

function afficherMessage(message, type) {
    var element = document.getElementById("message");
    if (!element) {
        return;
    }

    element.textContent = message;
    element.className = "mb-0" + (type ? " text-" + type : "");
}

function calculerPrix() {
    var selectVoiture = document.getElementById("voiture");
    var dateDebut = document.getElementById("dateDebut");
    var dateFin = document.getElementById("dateFin");
    var prixTotal = document.getElementById("prixTotal");
    var voitureId = selectVoiture ? selectVoiture.value : "";
    var voiture = vehicules.find(function (element) {
        return String(element.id) === voitureId;
    });
    var prixJournalier = voiture
        ? voiture.pricePerDay
        : Number(selectVoiture && selectVoiture.selectedOptions[0]
            ? selectVoiture.selectedOptions[0].dataset.price || voitureId
            : voitureId);
    var dates = obtenirDatesEtDuree(
        dateDebut ? dateDebut.value : "",
        dateFin ? dateFin.value : ""
    );

    if (!voitureId || !Number.isFinite(prixJournalier) || !dates) {
        if (prixTotal) {
            prixTotal.value = "";
        }
        afficherMessage("Vérifiez le véhicule choisi et les dates de location.", "danger");
        return null;
    }

    var total = dates.nombreJours * prixJournalier;
    if (prixTotal) {
        prixTotal.value = total + " DT";
    }

    return {
        voiture: voiture,
        prixJournalier: prixJournalier,
        nombreJours: dates.nombreJours,
        total: total,
        dates: dates
    };
}

function imprimerDevis() {
    window.print();
}

function analyserCSV(texte) {
    var lignes = texte.trim().split(/\r?\n/);
    var entetesAttendues = [
        "id", "category", "brand", "model", "power", "pricePerDay", "available"
    ];
    var entetes = lignes.shift().split(",");

    if (entetes.join(",") !== entetesAttendues.join(",")) {
        throw new Error("Les colonnes du fichier CSV ne correspondent pas au format attendu.");
    }

    var identifiants = new Set();
    return lignes.filter(Boolean).map(function (ligne, index) {
        var colonnes = ligne.split(",");
        if (colonnes.length !== entetesAttendues.length) {
            throw new Error("La ligne " + (index + 2) + " du fichier CSV est invalide.");
        }

        var voiture = {
            id: Number(colonnes[0]),
            category: colonnes[1],
            brand: colonnes[2],
            model: colonnes[3],
            power: Number(colonnes[4]),
            pricePerDay: Number(colonnes[5]),
            available: colonnes[6] === "true"
        };

        if (!Number.isInteger(voiture.id) || identifiants.has(voiture.id)
            || !voiture.category || !voiture.brand || !voiture.model
            || !Number.isFinite(voiture.power) || !Number.isFinite(voiture.pricePerDay)
            || voiture.pricePerDay <= 0 || !["true", "false"].includes(colonnes[6])) {
            throw new Error("Les données du véhicule à la ligne " + (index + 2) + " sont invalides.");
        }

        identifiants.add(voiture.id);
        return voiture;
    });
}

function creerImageVoiture(voiture) {
    var espaceSVG = "http://www.w3.org/2000/svg";
    var couleur = voiture.category === "Berline"
        ? "#1769aa"
        : voiture.category === "Commerciale" ? "#16845b" : "#6c5ce7";
    var svg = document.createElementNS(espaceSVG, "svg");
    svg.setAttribute("xmlns", espaceSVG);
    svg.setAttribute("viewBox", "0 0 320 180");
    svg.setAttribute("role", "img");

    var fond = document.createElementNS(espaceSVG, "rect");
    fond.setAttribute("width", "320");
    fond.setAttribute("height", "180");
    fond.setAttribute("rx", "18");
    fond.setAttribute("fill", couleur);
    svg.appendChild(fond);

    var ombre = document.createElementNS(espaceSVG, "ellipse");
    ombre.setAttribute("cx", "160");
    ombre.setAttribute("cy", "135");
    ombre.setAttribute("rx", "112");
    ombre.setAttribute("ry", "13");
    ombre.setAttribute("fill", "#10233b");
    ombre.setAttribute("opacity", "0.28");
    svg.appendChild(ombre);

    var carrosserie = document.createElementNS(espaceSVG, "path");
    carrosserie.setAttribute(
        "d",
        voiture.category === "Commerciale"
            ? "M48 112 L62 75 Q67 64 82 64 H199 L238 85 H261 Q276 85 280 101 L284 122 H39 Z"
            : "M45 113 L59 91 Q66 81 83 77 L112 56 H202 Q215 56 225 68 L248 91 H267 Q279 91 283 105 L286 122 H40 Z"
    );
    carrosserie.setAttribute("fill", "#f8fbff");
    svg.appendChild(carrosserie);

    var fenetre = document.createElementNS(espaceSVG, "path");
    fenetre.setAttribute(
        "d",
        voiture.category === "Commerciale"
            ? "M76 73 H137 V96 H65 Z M147 73 H195 L224 96 H147 Z"
            : "M119 64 H198 Q208 64 216 76 L231 91 H117 Z"
    );
    fenetre.setAttribute("fill", "#9ec8e8");
    svg.appendChild(fenetre);

    [[92, 121], [233, 121]].forEach(function (position) {
        var roue = document.createElementNS(espaceSVG, "circle");
        roue.setAttribute("cx", String(position[0]));
        roue.setAttribute("cy", String(position[1]));
        roue.setAttribute("r", "18");
        roue.setAttribute("fill", "#1e293b");
        svg.appendChild(roue);

        var moyeu = document.createElementNS(espaceSVG, "circle");
        moyeu.setAttribute("cx", String(position[0]));
        moyeu.setAttribute("cy", String(position[1]));
        moyeu.setAttribute("r", "8");
        moyeu.setAttribute("fill", "#cbd5e1");
        svg.appendChild(moyeu);
    });

    var nom = document.createElementNS(espaceSVG, "text");
    nom.setAttribute("x", "160");
    nom.setAttribute("y", "164");
    nom.setAttribute("text-anchor", "middle");
    nom.setAttribute("font-family", "Arial, sans-serif");
    nom.setAttribute("font-size", "14");
    nom.setAttribute("font-weight", "700");
    nom.setAttribute("fill", "#fff");
    nom.textContent = voiture.brand + " " + voiture.model;
    svg.appendChild(nom);

    return "data:image/svg+xml;charset=utf-8,"
        + encodeURIComponent(new XMLSerializer().serializeToString(svg));
}

function remplirCatalogue(liste) {
    var tableau = document.getElementById("tableauCatalogue")
        || document.getElementById("tableCatalogue");
    var tableauDetaille = tableau.id === "tableCatalogue";
    var corps = tableau.tBodies[0];
    corps.replaceChildren();

    liste.forEach(function (voiture) {
        var ligne = document.createElement("tr");
        var celluleImage = document.createElement("td");
        var image = document.createElement("img");
        image.src = creerImageVoiture(voiture);
        image.alt = "Illustration du véhicule " + voiture.brand + " " + voiture.model;
        image.width = 96;
        image.height = 54;
        image.className = "rounded vehicle-thumbnail";
        celluleImage.appendChild(image);
        ligne.appendChild(celluleImage);

        var valeurs = tableauDetaille
            ? [
                String(voiture.id),
                voiture.category,
                voiture.brand,
                voiture.model,
                voiture.power + " CV",
                voiture.pricePerDay + " DT"
            ]
            : [
                voiture.category,
                voiture.brand + " " + voiture.model,
                voiture.power + " CV",
                voiture.pricePerDay + " DT",
                voiture.available ? "Disponible" : "Indisponible"
            ];

        valeurs.forEach(function (valeur) {
            var cellule = document.createElement("td");
            cellule.textContent = valeur;
            if ((tableauDetaille && valeur === voiture.pricePerDay + " DT")
                || (!tableauDetaille && valeur === voiture.pricePerDay + " DT")) {
                cellule.dataset.order = String(voiture.pricePerDay);
            }
            ligne.appendChild(cellule);
        });

        if (tableauDetaille) {
            var disponibilite = document.createElement("td");
            disponibilite.textContent = voiture.available ? "Disponible" : "Indisponible";
            disponibilite.className = voiture.available ? "text-success" : "text-secondary";
            ligne.appendChild(disponibilite);

            var action = document.createElement("td");
            action.className = "text-center";
            if (voiture.available) {
                var lienReservation = document.createElement("a");
                lienReservation.className = "btn btn-sm btn-outline-primary";
                lienReservation.href = "index2.html?categorie="
                    + encodeURIComponent(voiture.category) + "&voiture="
                    + encodeURIComponent(voiture.id) + "#reservation";
                lienReservation.textContent = "Réserver";
                action.appendChild(lienReservation);
            } else {
                action.textContent = "Indisponible";
            }
            ligne.appendChild(action);
        }

        corps.appendChild(ligne);
    });

    catalogueDataTable = new DataTable(tableau, {
        order: tableauDetaille ? [[6, "asc"]] : [],
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        language: {
            search: "Rechercher :",
            lengthMenu: "Afficher _MENU_ véhicules",
            info: "Affichage de _START_ à _END_ sur _TOTAL_ véhicules",
            infoEmpty: "Aucun véhicule à afficher",
            infoFiltered: "(filtré parmi _MAX_ véhicules)",
            zeroRecords: "Aucun véhicule correspondant",
            emptyTable: "Aucun véhicule dans le catalogue",
            paginate: {
                first: "Première",
                last: "Dernière",
                next: "Suivante",
                previous: "Précédente"
            }
        }
    });

    if (tableauDetaille) {
        initialiserFiltresCatalogue();
    }
}

function mettreAJourStatistiquesCatalogue(liste) {
    var disponibles = liste.filter(function (voiture) {
        return voiture.available;
    });
    var prix = liste.map(function (voiture) {
        return voiture.pricePerDay;
    });

    document.getElementById("statTotal").textContent = String(liste.length);
    document.getElementById("statDispo").textContent = String(disponibles.length);
    document.getElementById("statMinPrix").textContent = prix.length
        ? Math.min.apply(null, prix) + " DT"
        : "—";
    document.getElementById("statMaxPrix").textContent = prix.length
        ? Math.max.apply(null, prix) + " DT"
        : "—";
}

function initialiserFiltresCatalogue() {
    var boutons = document.querySelectorAll(".filter-btn");
    var marqueSelect = document.getElementById("filtreMarque");
    var prixMaxInput = document.getElementById("filtrePrixMax");
    var disponibiliteSelect = document.getElementById("filtreDisponibilite");
    var triPrixSelect = document.getElementById("triPrix");
    var effacerFiltres = document.getElementById("effacerFiltres");
    mettreAJourStatistiquesCatalogue(vehicules);

    Array.from(new Set(vehicules.map(function (voiture) {
        return voiture.brand;
    }))).sort().forEach(function (marque) {
        marqueSelect.add(new Option(marque, marque));
    });

    DataTable.ext.search.push(function (settings, donnees) {
        if (!settings.nTable || settings.nTable.id !== "tableCatalogue") {
            return true;
        }
        var maximum = prixMaxInput.value === "" ? null : Number(prixMaxInput.value);
        return maximum === null || !Number.isFinite(maximum)
            || Number.parseFloat(donnees[6]) <= maximum;
    });

    marqueSelect.addEventListener("change", function () {
        catalogueDataTable.column(3)
            .search(marqueSelect.value ? "^" + marqueSelect.value + "$" : "", true, false)
            .draw();
    });
    prixMaxInput.addEventListener("input", function () {
        catalogueDataTable.draw();
    });
    disponibiliteSelect.addEventListener("change", function () {
        catalogueDataTable.column(7)
            .search(disponibiliteSelect.value ? "^" + disponibiliteSelect.value + "$" : "", true, false)
            .draw();
    });
    triPrixSelect.addEventListener("change", function () {
        catalogueDataTable.order([6, triPrixSelect.value]).draw();
    });
    effacerFiltres.addEventListener("click", function () {
        marqueSelect.value = "";
        prixMaxInput.value = "";
        disponibiliteSelect.value = "";
        triPrixSelect.value = "asc";
        catalogueDataTable.column(3).search("", true, false);
        catalogueDataTable.column(7).search("", true, false);
        catalogueDataTable.order([6, "asc"]).draw();
        var boutonTous = Array.prototype.find.call(boutons, function (bouton) {
            return bouton.dataset.cat === "tous";
        });
        if (boutonTous) {
            boutonTous.click();
        }
    });

    boutons.forEach(function (bouton) {
        bouton.addEventListener("click", function () {
            var categorie = bouton.dataset.cat === "tous" ? "" : bouton.dataset.cat;
            var listeFiltree = categorie
                ? vehicules.filter(function (voiture) {
                    return voiture.category === categorie;
                })
                : vehicules;

            catalogueDataTable.column(2)
                .search(categorie ? "^" + categorie + "$" : "", true, false)
                .draw();
            mettreAJourStatistiquesCatalogue(listeFiltree);
            boutons.forEach(function (element) {
                var actif = element === bouton;
                element.classList.toggle("active", actif);
                element.classList.toggle("btn-primary", actif);
                element.classList.toggle("btn-outline-primary", !actif);
                element.setAttribute("aria-pressed", String(actif));
            });
        });
    });

    var categorieDemandee = new URLSearchParams(window.location.search).get("categorie");
    if (categorieDemandee) {
        var filtreDemande = Array.prototype.find.call(boutons, function (bouton) {
            return bouton.dataset.cat === categorieDemandee;
        });
        if (filtreDemande) {
            filtreDemande.click();
        }
    }
}

function initialiserSelect2() {
    if (!window.jQuery || !jQuery.fn.select2) {
        throw new Error("Select2 ou jQuery n'a pas pu être chargé.");
    }

    jQuery("#categorie").select2({
        width: "100%",
        placeholder: "Choisir une catégorie",
        allowClear: true,
        language: "fr"
    });
    jQuery("#voiture").select2({
        width: "100%",
        placeholder: "Choisir d'abord une catégorie",
        allowClear: true,
        language: "fr"
    });
}

function mettreAJourChoixVoitures(categorie, conserverSelection) {
    var select = document.getElementById("voiture");
    var prixJournalier = document.getElementById("prixJournalier");
    var estimation = document.getElementById("prixTotal");
    if (!select) {
        return;
    }

    var ancienneSelection = conserverSelection ? select.value : "";
    var dateDebut = document.getElementById("dateDebut");
    var dateFin = document.getElementById("dateFin");
    var voituresEligibles;
    try {
        var reservations = lireReservationsLocales();
        voituresEligibles = vehicules.filter(function (voiture) {
            return voiture.available && voiture.category === categorie
                && (!dateDebut || !dateFin || !dateDebut.value || !dateFin.value
                    || !obtenirDatesEtDuree(dateDebut.value, dateFin.value)
                    || !reservations.some(function (reservation) {
                        return String(reservation.voitureId) === String(voiture.id)
                            && datesChevauchent(dateDebut.value, dateFin.value, reservation);
                    }));
        });
    } catch (error) {
        select.disabled = true;
        afficherMessage(error.message, "danger");
        return;
    }

    select.replaceChildren(new Option(
        categorie
            ? (voituresEligibles.length ? "Choisir un véhicule" : "Aucun véhicule disponible à ces dates")
            : "Choisir d'abord une catégorie",
        ""
    ));

    voituresEligibles.forEach(function (voiture) {
        var option = new Option(
            voiture.brand + " " + voiture.model + " — " + voiture.pricePerDay + " DT / jour",
            String(voiture.id)
        );
        option.dataset.price = String(voiture.pricePerDay);
        select.add(option);
    });

    select.disabled = !categorie || !voituresEligibles.length;
    if (ancienneSelection && voituresEligibles.some(function (voiture) {
        return String(voiture.id) === ancienneSelection;
    })) {
        select.value = ancienneSelection;
    }
    if (window.jQuery && jQuery.fn.select2) {
        jQuery(select).val(select.value).trigger("change.select2");
    }
    if (prixJournalier && !select.value) {
        prixJournalier.value = "";
    }
    if (estimation && !select.value) {
        estimation.value = "";
    }
}

function initialiserDatesReservation() {
    var debut = document.getElementById("dateDebut");
    var fin = document.getElementById("dateFin");
    if (!debut || !fin) {
        return;
    }

    var aujourdHui = new Date();
    var minimum = [
        aujourdHui.getFullYear(),
        String(aujourdHui.getMonth() + 1).padStart(2, "0"),
        String(aujourdHui.getDate()).padStart(2, "0")
    ].join("-");
    debut.min = minimum;
    fin.min = minimum;

    debut.addEventListener("change", function () {
        fin.min = debut.value || minimum;
        if (fin.value && debut.value && fin.value < debut.value) {
            fin.value = "";
        }
    });
}

function afficherPrixJournalier() {
    var select = document.getElementById("voiture");
    var prix = document.getElementById("prixJournalier");
    var option = select && select.selectedOptions[0];
    if (prix) {
        prix.value = option && option.value ? option.dataset.price + " DT / jour" : "";
    }
}

function genererDevis(reservation) {
    var devis = {
        reference: reservation.reference,
        createdAt: new Date().toISOString(),
        voitureId: reservation.voiture ? reservation.voiture.id : document.getElementById("voiture").value,
        nom: document.getElementById("nom").value.trim(),
        email: document.getElementById("email").value.trim(),
        telephone: document.getElementById("telephone").value.trim(),
        categorie: document.getElementById("categorie").value,
        vehicule: reservation.voiture
            ? reservation.voiture.brand + " " + reservation.voiture.model
            : document.getElementById("voiture").selectedOptions[0].textContent.split(" — ")[0],
        dateDebut: document.getElementById("dateDebut").value,
        dateFin: document.getElementById("dateFin").value,
        nombreJours: reservation.nombreJours,
        prixJournalier: reservation.prixJournalier,
        total: reservation.total
    };

    try {
        sessionStorage.setItem("autoRentDevis", JSON.stringify(devis));
    } catch (error) {
        afficherMessage("Impossible de préparer le devis dans ce navigateur : " + error.message, "danger");
        return false;
    }

    window.location.href = "devis.html";
    return true;
}

function formaterDate(date) {
    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC"
    }).format(new Date(date + "T00:00:00Z"));
}

function actualiserRecapitulatifReservation(reservation) {
    var recapitulatif = document.getElementById("reservationReview");
    var voiture = reservation && reservation.voiture;
    if (!recapitulatif || !voiture) {
        return;
    }

    recapitulatif.replaceChildren();
    var lignes = [
        ["Client", document.getElementById("nom").value.trim()],
        ["Email", document.getElementById("email").value.trim()],
        ["Téléphone", document.getElementById("telephone").value.trim()],
        ["Catégorie", voiture.category],
        ["Véhicule", voiture.brand + " " + voiture.model],
        ["Location", formaterDate(document.getElementById("dateDebut").value)
            + " — " + formaterDate(document.getElementById("dateFin").value)],
        ["Durée", reservation.nombreJours + (reservation.nombreJours > 1 ? " jours" : " jour")],
        ["Prix journalier", reservation.prixJournalier + " DT"],
        ["Total", reservation.total + " DT"]
    ];
    lignes.forEach(function (ligne) {
        var wrapper = document.createElement("div");
        var libelle = document.createElement("span");
        var valeur = document.createElement("strong");
        libelle.textContent = ligne[0];
        valeur.textContent = ligne[1];
        wrapper.append(libelle, valeur);
        recapitulatif.appendChild(wrapper);
    });
}

function changerEtapeReservation(etape) {
    var formulaire = document.getElementById("reservationForm");
    var etapeActuelle = Number(formulaire.dataset.currentStep || 1);
    if (etape === etapeActuelle) {
        return;
    }

    var champsRequis = Array.prototype.slice.call(
        formulaire.querySelectorAll('[data-booking-step="' + etapeActuelle + '"] [required]')
    );
    var champInvalide = champsRequis.find(function (champ) {
        return !champ.checkValidity();
    });
    if (champInvalide) {
        champInvalide.setAttribute("aria-invalid", "true");
        champInvalide.reportValidity();
        afficherMessage("Complétez les champs obligatoires de cette étape.", "danger");
        return;
    }
    champsRequis.forEach(function (champ) {
        champ.removeAttribute("aria-invalid");
    });

    if (etapeActuelle === 1) {
        var datesChoisies = obtenirDatesEtDuree(
            document.getElementById("dateDebut").value,
            document.getElementById("dateFin").value
        );
        if (!selectValueValide("categorie") || !selectValueValide("voiture") || !datesChoisies) {
            afficherMessage("Choisissez une catégorie, un véhicule et des dates valides.", "danger");
            return;
        }
        try {
            if (!voitureDisponiblePourDates(
                document.getElementById("voiture").value,
                document.getElementById("dateDebut").value,
                document.getElementById("dateFin").value
            )) {
                mettreAJourChoixVoitures(document.getElementById("categorie").value, true);
                afficherMessage("Ce véhicule vient d'être réservé pour ces dates. Choisissez-en un autre.", "danger");
                return;
            }
        } catch (error) {
            afficherMessage(error.message, "danger");
            return;
        }
    }

    if (etapeActuelle === 2 && etape === 3) {
        if (!formulaire.querySelector("#nom").checkValidity()
            || !formulaire.querySelector("#email").checkValidity()
            || !formulaire.querySelector("#telephone").checkValidity()) {
            afficherMessage("Vérifiez vos coordonnées avant de continuer.", "danger");
            return;
        }
        var reservation = calculerPrix();
        if (!reservation) {
            return;
        }
        actualiserRecapitulatifReservation(reservation);
    }

    formulaire.dataset.currentStep = String(etape);
    formulaire.querySelectorAll("[data-booking-step]").forEach(function (panneau) {
        panneau.hidden = Number(panneau.dataset.bookingStep) !== etape;
    });
    formulaire.querySelectorAll("[data-step-indicator]").forEach(function (indicateur) {
        if (Number(indicateur.dataset.stepIndicator) === etape) {
            indicateur.setAttribute("aria-current", "step");
        } else {
            indicateur.removeAttribute("aria-current");
        }
    });
    afficherMessage("", "");
    var titreEtape = formulaire.querySelector('[data-booking-step="' + etape + '"] h3');
    if (titreEtape) {
        titreEtape.setAttribute("tabindex", "-1");
        titreEtape.focus();
    }
}

function selectValueValide(identifiant) {
    var select = document.getElementById(identifiant);
    return Boolean(select && select.value);
}

function lireDevisEnregistre() {
    var devis;
    try {
        devis = JSON.parse(sessionStorage.getItem("autoRentDevis") || "null");
    } catch (error) {
        return { devis: null, error: error };
    }

    var valide = devis && typeof devis.nom === "string" && devis.nom.trim()
        && typeof devis.email === "string" && devis.email.trim()
        && typeof devis.telephone === "string" && devis.telephone.trim()
        && typeof devis.categorie === "string" && devis.categorie.trim()
        && typeof devis.vehicule === "string" && devis.vehicule.trim()
        && typeof devis.dateDebut === "string" && devis.dateDebut.trim()
        && typeof devis.dateFin === "string" && devis.dateFin.trim()
        && Number.isInteger(devis.nombreJours) && devis.nombreJours > 0
        && Number.isFinite(devis.prixJournalier) && devis.prixJournalier > 0
        && Number.isFinite(devis.total) && devis.total > 0
        && Math.abs(devis.total - devis.nombreJours * devis.prixJournalier) < 0.01;
    return { devis: valide ? devis : null, error: null };
}

function initialiserLiensDevis() {
    var liens = document.querySelectorAll("[data-devis-link]");
    if (!liens.length) {
        return;
    }

    var resultat = lireDevisEnregistre();
    if (resultat.error) {
        console.warn("Le devis enregistré ne peut pas être lu.", resultat.error);
        return;
    }
    if (resultat.devis) {
        liens.forEach(function (lien) {
            lien.hidden = false;
        });
    }
}

function initialiserDevis() {
    var fiche = document.getElementById("ficheDevis");
    if (!fiche) {
        return;
    }

    document.getElementById("boutonImprimerDevis").addEventListener("click", imprimerDevis);
    var statut = document.getElementById("devisStatut");
    var resultat = lireDevisEnregistre();
    if (resultat.error) {
        statut.textContent = "Le devis enregistré ne peut pas être lu : " + resultat.error.message;
        document.getElementById("retourReservation").classList.remove("d-none");
        return;
    }
    if (!resultat.devis) {
        window.location.replace("index2.html#reservation");
        return;
    }
    var devis = resultat.devis;

    var valeurs = {
        devisReference: devis.reference || "AUTO-RENT",
        devisDateCreation: devis.createdAt
            ? formaterDate(devis.createdAt.slice(0, 10))
            : formaterDate(devis.dateDebut),
        devisNom: devis.nom,
        devisEmail: devis.email,
        devisTelephone: devis.telephone,
        devisCategorie: devis.categorie,
        devisVehicule: devis.vehicule,
        devisDebut: formaterDate(devis.dateDebut),
        devisFin: formaterDate(devis.dateFin),
        devisJours: String(devis.nombreJours),
        devisPrixJournalier: String(devis.prixJournalier),
        devisSousTotal: String(devis.nombreJours * devis.prixJournalier),
        devisTotal: String(devis.total)
    };
    Object.keys(valeurs).forEach(function (id) {
        document.getElementById(id).textContent = valeurs[id];
    });

    fiche.classList.remove("d-none");
    statut.classList.add("d-none");
    document.getElementById("retourReservation").classList.add("d-none");
}

function initialiserReservation() {
    var formulaire = document.getElementById("reservationForm");
    if (!formulaire) {
        return;
    }

    var selectCategorie = document.getElementById("categorie");
    var selectVoiture = document.getElementById("voiture");

    if (document.getElementById("tableauCatalogue")) {
        try {
            initialiserSelect2();
        } catch (error) {
            var bibliothequeErreur = document.getElementById("catalogueErreur");
            bibliothequeErreur.textContent = "Impossible d'initialiser Select2 : " + error.message
                + " Vérifiez les fichiers locaux dans node_modules.";
            bibliothequeErreur.classList.remove("d-none");
        }

        var parametres = new URLSearchParams(window.location.search);
        var categorieDemandee = parametres.get("categorie");
        if (categorieDemandee && Array.prototype.some.call(selectCategorie.options, function (option) {
            return option.value === categorieDemandee;
        })) {
            selectCategorie.value = categorieDemandee;
            if (window.jQuery && jQuery.fn.select2) {
                jQuery(selectCategorie).trigger("change.select2");
            }
        }

        if (window.jQuery && jQuery.fn.select2) {
            jQuery(selectCategorie).on("change", function () {
                mettreAJourChoixVoitures(selectCategorie.value);
            });
            jQuery(selectVoiture).on("change", afficherPrixJournalier);
        } else {
            selectCategorie.addEventListener("change", function () {
                mettreAJourChoixVoitures(selectCategorie.value);
            });
            selectVoiture.addEventListener("change", afficherPrixJournalier);
        }

        document.querySelectorAll("[data-reservation-category]").forEach(function (lien) {
            lien.addEventListener("click", function () {
                selectCategorie.value = lien.dataset.reservationCategory;
                selectCategorie.dispatchEvent(new Event("change", { bubbles: true }));
                if (window.jQuery && jQuery.fn.select2) {
                    jQuery(selectCategorie).trigger("change.select2");
                }
            });
        });

        mettreAJourChoixVoitures(selectCategorie.value);
    }

    initialiserDatesReservation();
    formulaire.dataset.currentStep = "1";
    formulaire.querySelectorAll("[data-booking-step]").forEach(function (panneau) {
        panneau.hidden = panneau.dataset.bookingStep !== "1";
    });
    formulaire.querySelectorAll("[data-booking-next]").forEach(function (bouton) {
        bouton.addEventListener("click", function () {
            changerEtapeReservation(Number(bouton.dataset.bookingNext));
        });
    });

    function actualiserDatesEtEstimation() {
        var dateDebut = document.getElementById("dateDebut");
        var dateFin = document.getElementById("dateFin");
        var ancienneVoiture = selectVoiture.value;
        if (formulaire.querySelector('[data-booking-step="1"]') && vehicules.length) {
            mettreAJourChoixVoitures(selectCategorie.value, true);
        }
        if (ancienneVoiture && !selectVoiture.value) {
            afficherMessage("Ce véhicule n'est pas disponible pour ces dates. Choisissez-en un autre.", "danger");
        }
        if (dateDebut.value && dateFin.value && obtenirDatesEtDuree(dateDebut.value, dateFin.value)
            && selectVoiture.value) {
            var estimation = calculerPrix();
            if (estimation && Number(formulaire.dataset.currentStep) === 3) {
                actualiserRecapitulatifReservation(estimation);
            }
        } else {
            document.getElementById("prixTotal").value = "";
        }
    }

    document.getElementById("dateDebut").addEventListener("change", actualiserDatesEtEstimation);
    document.getElementById("dateFin").addEventListener("change", actualiserDatesEtEstimation);

    formulaire.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!formulaire.checkValidity()) {
            formulaire.classList.add("was-validated");
            formulaire.reportValidity();
            afficherMessage("Veuillez compléter correctement les champs obligatoires.", "danger");
            return;
        }

        var nom = document.getElementById("nom").value.trim();
        if (nom.length < 3) {
            afficherMessage("Le nom doit contenir au moins 3 caractères.", "danger");
            return;
        }

        var selection = selectVoiture && selectVoiture.selectedOptions[0];
        var voiture = vehicules.find(function (element) {
            return String(element.id) === (selectVoiture ? selectVoiture.value : "");
        });
        var prixJournalier = voiture
            ? voiture.pricePerDay
            : Number(selection ? selection.dataset.price || selectVoiture.value : 0);
        var dates = obtenirDatesEtDuree(
            document.getElementById("dateDebut").value,
            document.getElementById("dateFin").value
        );

        if (!dates) {
            afficherMessage("La date de fin doit être égale ou postérieure à la date de début.", "danger");
            return;
        }
        if (!selection || !selection.value || !Number.isFinite(prixJournalier)) {
            afficherMessage("Veuillez choisir un véhicule disponible.", "danger");
            return;
        }
        if (voiture && (!voiture.available || voiture.category !== selectCategorie.value)) {
            afficherMessage("Le véhicule choisi ne correspond pas à la catégorie sélectionnée.", "danger");
            return;
        }
        try {
            if (!voitureDisponiblePourDates(
                selectVoiture.value,
                document.getElementById("dateDebut").value,
                document.getElementById("dateFin").value
            )) {
                mettreAJourChoixVoitures(selectCategorie.value, true);
                afficherMessage("Ce véhicule vient d'être réservé pour ces dates. Choisissez-en un autre.", "danger");
                return;
            }
        } catch (error) {
            afficherMessage(error.message, "danger");
            return;
        }

        var reference = "AR-" + new Date().toISOString().replace(/\D/g, "").slice(0, 14)
            + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
        var reservation = {
            voiture: voiture,
            prixJournalier: prixJournalier,
            nombreJours: dates.nombreJours,
            total: dates.nombreJours * prixJournalier,
            reference: reference
        };
        document.getElementById("prixTotal").value = reservation.total + " DT";

        var reservations;
        try {
            reservations = lireReservationsLocales();
            reservations.push({
                reference: reference,
                voitureId: String(selectVoiture.value),
                dateDebut: document.getElementById("dateDebut").value,
                dateFin: document.getElementById("dateFin").value
            });
            localStorage.setItem("autoRentReservations", JSON.stringify(reservations));
        } catch (error) {
            afficherMessage("La réservation ne peut pas être enregistrée localement : " + error.message, "danger");
            return;
        }

        if (!genererDevis(reservation)) {
            try {
                localStorage.setItem("autoRentReservations", JSON.stringify(
                    reservations.filter(function (element) {
                        return element.reference !== reference;
                    })
                ));
            } catch (error) {
                console.error("La réservation n'a pas pu être retirée après l'échec du devis.", error);
            }
        }
    });
}

function initialiserContact() {
    var formulaire = document.getElementById("contactForm");
    if (!formulaire) {
        return;
    }

    formulaire.addEventListener("submit", function (event) {
        event.preventDefault();
        formulaire.classList.add("was-validated");
        if (!formulaire.checkValidity()) {
            document.getElementById("contactStatut").textContent =
                "Veuillez corriger les champs signalés.";
            return;
        }

        document.getElementById("contactStatut").textContent =
            "Formulaire validé. Aucun message n'est envoyé : cette démonstration ne possède pas de serveur.";
        formulaire.reset();
        formulaire.classList.remove("was-validated");
    });
}

function initialiserModeSombre() {
    var boutons = document.querySelectorAll("[data-theme-toggle]");
    var clePreference = "autoRentTheme";
    var theme = "light";

    try {
        var preference = localStorage.getItem(clePreference);
        if (preference === "dark" || preference === "light") {
            theme = preference;
        }
    } catch (error) {
        console.warn("La préférence de thème ne peut pas être lue.", error);
    }

    function appliquerTheme(nouveauTheme) {
        var sombre = nouveauTheme === "dark";
        document.documentElement.setAttribute("data-bs-theme", nouveauTheme);
        boutons.forEach(function (bouton) {
            var libelle = sombre ? "Activer le mode clair" : "Activer le mode sombre";
            var icone = bouton.querySelector("i");
            bouton.setAttribute("aria-label", libelle);
            bouton.setAttribute("aria-pressed", String(sombre));
            bouton.title = libelle;

            if (icone) {
                icone.classList.toggle("bi-moon-stars-fill", !sombre);
                icone.classList.toggle("bi-sun-fill", sombre);
            } else {
                var symbole = bouton.querySelector("i");
                var texte = bouton.querySelector("span:not([aria-hidden='true'])");
                if (symbole) {
                    symbole.classList.toggle("bi-moon-stars-fill", !sombre);
                    symbole.classList.toggle("bi-sun-fill", sombre);
                }
                if (texte) {
                    texte.textContent = sombre ? "Mode clair" : "Mode sombre";
                }
            }
        });
    }

    appliquerTheme(theme);
    boutons.forEach(function (bouton) {
        bouton.addEventListener("click", function () {
            theme = document.documentElement.getAttribute("data-bs-theme") === "dark"
                ? "light"
                : "dark";
            appliquerTheme(theme);
            try {
                localStorage.setItem(clePreference, theme);
            } catch (error) {
                console.warn("La préférence de thème ne peut pas être enregistrée.", error);
            }
        });
    });

    window.addEventListener("storage", function (event) {
        if (event.key === clePreference && (event.newValue === "dark" || event.newValue === "light")) {
            theme = event.newValue;
            appliquerTheme(theme);
        }
    });
}

function chargerCatalogue() {
    var erreur = document.getElementById("catalogueErreur");
    var tableau = document.getElementById("tableauCatalogue")
        || document.getElementById("tableCatalogue");
    if (!tableau) {
        return;
    }

    try {
        if (!erreur) {
            throw new Error("L'élément d'affichage des erreurs du catalogue est absent de la page.");
        }
        if (typeof window.autoRentVehiclesCsv !== "string") {
            throw new Error("Le fichier local data/vehicles.js n'a pas pu être chargé.");
        }
        vehicules = analyserCSV(window.autoRentVehiclesCsv);
        if (vehicules.length < 50) {
            throw new Error("Le catalogue doit contenir au minimum 50 véhicules.");
        }
        remplirCatalogue(vehicules);
        var selectCategorie = document.getElementById("categorie");
        if (selectCategorie) {
            mettreAJourChoixVoitures(selectCategorie.value);
            var identifiantVoiture = new URLSearchParams(window.location.search).get("voiture");
            var voitureDemandee = vehicules.find(function (voiture) {
                return String(voiture.id) === identifiantVoiture
                    && voiture.available
                    && voiture.category === selectCategorie.value;
            });
            var selectVoiture = document.getElementById("voiture");
            if (voitureDemandee && selectVoiture) {
                selectVoiture.value = String(voitureDemandee.id);
                selectVoiture.dispatchEvent(new Event("change", { bubbles: true }));
                if (window.jQuery && jQuery.fn.select2) {
                    jQuery(selectVoiture).trigger("change.select2");
                }
                afficherPrixJournalier();
            }
        }
    } catch (error) {
        if (erreur) {
            erreur.textContent = "Impossible de charger le catalogue : " + error.message
                + " Vérifiez que data/vehicles.js est présent dans le dossier du projet.";
            erreur.classList.remove("d-none");
        }
        var corps = tableau.tBodies[0];
        corps.replaceChildren();
        var ligne = document.createElement("tr");
        var cellule = document.createElement("td");
        cellule.colSpan = tableau.tHead.rows[0].cells.length;
        cellule.className = "text-center text-danger";
        cellule.textContent = "Catalogue indisponible.";
        ligne.appendChild(cellule);
        corps.appendChild(ligne);
    }
}

initialiserReservation();
initialiserContact();
initialiserDevis();
initialiserLiensDevis();
initialiserModeSombre();
chargerCatalogue();
