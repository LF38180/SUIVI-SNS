export type MesureSeed = {
  categorie: 'AXE_1' | 'AXE_2' | 'AXE_3' | 'AXE_4' | 'HORS_PROGRAMME'
  rubrique: string
  intitule: string
  referentKey: string | null
  natureCout: string
  ordreGrandeur: string
  avancementPublie: number
}

export const MESURES: MesureSeed[] = [
  // ── AXE 1 — Protéger et garantir la qualité de vie (18) ──
  // Gérer avec sérieux et transparence
  { categorie: 'AXE_1', rubrique: 'Gérer avec sérieux et transparence', intitule: 'Maîtriser la fiscalité locale dans la durée', referentKey: 'ferrucci', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: 'Gérer avec sérieux et transparence', intitule: "Renforcer les mutualisations et les groupements d'achats publics", referentKey: 'ferrucci', natureCout: 'Temps agent', ordreGrandeur: 'À chiffrer', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: 'Gérer avec sérieux et transparence', intitule: 'Mettre en place un plan stratégique de gestion du patrimoine communal', referentKey: 'ferrucci', natureCout: '€ fonctionnement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: 'Gérer avec sérieux et transparence', intitule: 'Garantir un pilotage exigeant des projets municipaux', referentKey: 'ferrucci', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: 'Gérer avec sérieux et transparence', intitule: "Renforcer la transparence sur les coûts et l'efficacité des services municipaux", referentKey: 'ferrucci', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  // Ville apaisée et sécurité
  { categorie: 'AXE_1', rubrique: 'Ville apaisée et sécurité', intitule: 'Poursuivre le déploiement de la vidéoprotection', referentKey: 'faucher', natureCout: '€ investissement', ordreGrandeur: 'Élevé', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: 'Ville apaisée et sécurité', intitule: 'Renforcer les patrouilles de police municipale', referentKey: 'faucher', natureCout: '€ fonctionnement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: 'Ville apaisée et sécurité', intitule: 'Pérenniser les médiateurs de proximité durant la période estivale', referentKey: 'faucher', natureCout: '€ fonctionnement', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: 'Ville apaisée et sécurité', intitule: 'Mettre en œuvre un plan global des cheminements piétons', referentKey: 'courraud', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: 'Ville apaisée et sécurité', intitule: "Poursuivre un plan d'apaisement de la circulation", referentKey: 'courraud', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  // Vie associative
  { categorie: 'AXE_1', rubrique: 'Vie associative', intitule: 'Maintenir un soutien financier stable et lisible aux associations', referentKey: 'viton', natureCout: '€ fonctionnement', ordreGrandeur: 'Élevé', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: 'Vie associative', intitule: 'Consolider un partenariat de confiance avec les associations', referentKey: 'viton', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: 'Vie associative', intitule: 'Garantir un accès large et équitable aux équipements municipaux', referentKey: 'viton', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: 'Vie associative', intitule: "Valoriser et reconnaître l'engagement bénévole", referentKey: 'viton', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  // Pouvoir d'achat
  { categorie: 'AXE_1', rubrique: "Pouvoir d'achat", intitule: 'Maintenir une fiscalité communale maîtrisée et prévisible', referentKey: 'ferrucci', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: "Pouvoir d'achat", intitule: "Expérimenter des dispositifs de bons d'achat municipaux (commerces locaux)", referentKey: 'viton', natureCout: '€ fonctionnement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: "Pouvoir d'achat", intitule: 'Développer un outil de valorisation du commerce local', referentKey: 'viton', natureCout: '€ invest. + fonct.', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: "Pouvoir d'achat", intitule: "Étudier la mise en place d'offres collectives (esprit mutuelle communale)", referentKey: 'cialdella', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },

  // ── AXE 2 — Prendre soin de chacun (18) ──
  // Offre de santé
  { categorie: 'AXE_2', rubrique: 'Offre de santé', intitule: 'Faire aboutir le projet de maison de santé pluridisciplinaire à la Plaine', referentKey: 'cialdella', natureCout: '€ investissement', ordreGrandeur: 'À chiffrer', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Offre de santé', intitule: 'Renforcer la prévention santé pour tous les publics', referentKey: 'cialdella', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Offre de santé', intitule: 'Faciliter la coordination locale des acteurs de santé', referentKey: 'cialdella', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  // Bien vieillir
  { categorie: 'AXE_2', rubrique: 'Bien vieillir', intitule: "Étudier l'implantation d'une résidence seniors adaptée", referentKey: 'gresil', natureCout: '€ investissement', ordreGrandeur: 'À chiffrer', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Bien vieillir', intitule: "Renforcer le maintien à domicile et l'accompagnement de proximité", referentKey: 'gresil', natureCout: '€ fonctionnement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Bien vieillir', intitule: 'Soutenir les aidants familiaux', referentKey: 'gresil', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Bien vieillir', intitule: 'Développer des actions intergénérationnelles structurées', referentKey: 'gresil', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Bien vieillir', intitule: 'Mettre en place des espaces municipaux rafraîchis dans les écoles', referentKey: 'gresil', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  // Familles et jeunesse
  { categorie: 'AXE_2', rubrique: 'Familles et jeunesse', intitule: "Soutenir les familles modestes dans l'accès aux activités sportives et culturelles", referentKey: 'cialdella', natureCout: '€ fonctionnement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Familles et jeunesse', intitule: 'Consolider les actions de soutien à la parentalité', referentKey: 'collot', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Familles et jeunesse', intitule: 'Pérenniser les jobs citoyens', referentKey: 'paucod', natureCout: '€ fonctionnement', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Familles et jeunesse', intitule: 'Créer une bourse aux projets pour les 15-18 ans', referentKey: 'paucod', natureCout: '€ fonctionnement', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Familles et jeunesse', intitule: 'Soutenir et valoriser le Conseil Municipal des Jeunes', referentKey: 'paucod', natureCout: '€ fonctionnement', ordreGrandeur: 'Faible', avancementPublie: 0 },
  // Solidarités
  { categorie: 'AXE_2', rubrique: 'Solidarités', intitule: 'Maintenir le conseiller numérique au CCAS', referentKey: 'cialdella', natureCout: '€ fonctionnement', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Solidarités', intitule: "Développer les actions « d'aller vers »", referentKey: 'cialdella', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Solidarités', intitule: 'Mieux informer sur les missions et dispositifs du CCAS', referentKey: 'cialdella', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Solidarités', intitule: "Encourager l'économie sociale et solidaire", referentKey: 'cialdella', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Solidarités', intitule: 'Créer une journée citoyenne des solidarités', referentKey: 'cialdella', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },

  // ── AXE 3 — Animer tous les quartiers (17) ──
  // Sport et culture
  { categorie: 'AXE_3', rubrique: 'Sport et culture', intitule: 'Poursuivre la rénovation progressive des équipements structurants', referentKey: 'ferrucci', natureCout: '€ investissement', ordreGrandeur: 'Élevé', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Sport et culture', intitule: 'Garantir un accès équitable aux équipements sportifs et culturels', referentKey: 'viton', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Sport et culture', intitule: 'Développer le sport santé et encourager les pratiques inclusives', referentKey: 'viton', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Sport et culture', intitule: 'Renforcer les échanges entre associations', referentKey: 'viton', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Sport et culture', intitule: "Valoriser la culture comme vecteur de citoyenneté et d'ouverture", referentKey: 'rouillon', natureCout: '€ fonctionnement', ordreGrandeur: 'Faible', avancementPublie: 0 },
  // Événements festifs
  { categorie: 'AXE_3', rubrique: 'Événements festifs', intitule: 'Consolider et moderniser les grands rendez-vous et les temps festifs communaux', referentKey: 'shaiek', natureCout: '€ fonctionnement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Événements festifs', intitule: 'Associer davantage les associations et les commerçants', referentKey: 'shaiek', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Événements festifs', intitule: 'Valoriser le patrimoine et les savoir-faire locaux', referentKey: 'rouillon', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  // Commerce de proximité
  { categorie: 'AXE_3', rubrique: 'Commerce de proximité', intitule: "Soutenir l'animation commerciale", referentKey: 'viton', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Commerce de proximité', intitule: "Améliorer l'attractivité de nos centralités commerciales", referentKey: 'viton', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Commerce de proximité', intitule: 'Développer des outils de valorisation du commerce local', referentKey: 'viton', natureCout: '€ invest. + fonct.', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Commerce de proximité', intitule: "Veiller à la diversité de l'offre commerciale", referentKey: 'viton', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  // Démocratie participative
  { categorie: 'AXE_3', rubrique: 'Démocratie participative', intitule: 'Maintenir et renforcer les instances participatives existantes', referentKey: 'lombard', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Démocratie participative', intitule: 'Adapter les concertations aux projets', referentKey: 'lombard', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Démocratie participative', intitule: 'Garantir une représentation équilibrée des quartiers', referentKey: 'lombard', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Démocratie participative', intitule: 'Associer davantage les jeunes aux grands projets communaux', referentKey: 'lombard', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Démocratie participative', intitule: "Conforter le rôle du Comité d'Évaluation Citoyenne (CECi)", referentKey: 'lombard', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },

  // ── AXE 4 — Préparer l'avenir (14) ──
  // Écoles et climat
  { categorie: 'AXE_4', rubrique: 'Écoles et climat', intitule: "Améliorer durablement le confort d'été dans les écoles", referentKey: 'paucod', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_4', rubrique: 'Écoles et climat', intitule: 'Sécuriser durablement les abords des écoles', referentKey: 'faucher', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_4', rubrique: 'Écoles et climat', intitule: 'Moderniser le patrimoine scolaire (achever Blanche-Rochas, décider la suite)', referentKey: 'ferrucci', natureCout: '€ investissement', ordreGrandeur: 'Élevé', avancementPublie: 0 },
  // Énergie
  { categorie: 'AXE_4', rubrique: 'Énergie', intitule: 'Rénover les bâtiments communaux les plus énergivores', referentKey: 'ferrucci', natureCout: '€ investissement', ordreGrandeur: 'Élevé', avancementPublie: 0 },
  { categorie: 'AXE_4', rubrique: 'Énergie', intitule: 'Mettre en œuvre une stratégie pluriannuelle de rénovation énergétique', referentKey: 'ferrucci', natureCout: '€ fonctionnement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_4', rubrique: 'Énergie', intitule: 'Développer les énergies renouvelables locales', referentKey: 'jacquier', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_4', rubrique: 'Énergie', intitule: "Finaliser la modernisation de l'éclairage public et des bâtiments municipaux", referentKey: 'courraud', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  // Adaptation climatique
  { categorie: 'AXE_4', rubrique: 'Adaptation climatique', intitule: 'Créer des îlots de fraîcheur dans les lieux de sociabilité', referentKey: 'baudin', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_4', rubrique: 'Adaptation climatique', intitule: 'Transformer progressivement les espaces les plus minéralisés', referentKey: 'baudin', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_4', rubrique: 'Adaptation climatique', intitule: 'Économiser durablement la ressource en eau', referentKey: 'baudin', natureCout: '€ investissement', ordreGrandeur: 'Faible', avancementPublie: 0 },
  // Urbanisme
  { categorie: 'AXE_4', rubrique: 'Urbanisme', intitule: 'Défendre un urbanisme maîtrisé et raisonné', referentKey: 'courraud', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  { categorie: 'AXE_4', rubrique: 'Urbanisme', intitule: 'Favoriser un parcours résidentiel équilibré', referentKey: 'courraud', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_4', rubrique: 'Urbanisme', intitule: "Garantir toujours la concertation sur les projets d'aménagement", referentKey: 'courraud', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  { categorie: 'AXE_4', rubrique: 'Urbanisme', intitule: 'Favoriser des mobilités plus douces et sécurisées', referentKey: 'courraud', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
]
