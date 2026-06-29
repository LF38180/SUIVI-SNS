export type EluSeed = {
  key: string // identifiant court pour relier les mesures
  nom: string
  email: string
  role: 'ADMIN' | 'ELU'
  fonction: string
  adjointKey?: string // binôme §4.3 : adjoint de rattachement
}

export const ELUS: EluSeed[] = [
  { key: 'ferrucci', nom: 'Loïck Ferrucci', email: 'loick.ferrucci@mairie-seyssins.fr', role: 'ADMIN', fonction: '3e adjoint, Moyens généraux' },
  { key: 'debreza', nom: 'Julie De Breza', email: 'julie.debreza@mairie-seyssins.fr', role: 'ADMIN', fonction: 'Directrice de cabinet' },
  { key: 'hugele', nom: 'Fabrice Hugelé', email: 'fabrice.hugele@mairie-seyssins.fr', role: 'ELU', fonction: 'Maire' },
  { key: 'paucod', nom: 'Jean-Marc Paucod', email: 'jean-marc.paucod@mairie-seyssins.fr', role: 'ELU', fonction: '1er adjoint, Éducation' },
  { key: 'baudin', nom: 'Isabelle Baudin', email: 'isabelle.baudin@mairie-seyssins.fr', role: 'ELU', fonction: '2e adjointe, Environnement' },
  { key: 'lombard', nom: 'Anne-Marie Lombard', email: 'anne-marie.lombard@mairie-seyssins.fr', role: 'ELU', fonction: '4e adjointe, Citoyenneté' },
  { key: 'cialdella', nom: 'Sylvain Cialdella', email: 'sylvain.cialdella@mairie-seyssins.fr', role: 'ELU', fonction: '5e adjoint, Affaires sociales' },
  { key: 'viton', nom: 'Carole Viton', email: 'carole.viton@mairie-seyssins.fr', role: 'ELU', fonction: '6e adjointe, Vie économique/Sport' },
  { key: 'courraud', nom: 'Emmanuel Courraud', email: 'emmanuel.courraud@mairie-seyssins.fr', role: 'ELU', fonction: '7e adjoint, Urbanisme/Mobilités' },
  { key: 'rouillon', nom: 'Rachel Rouillon', email: 'rachel.rouillon@mairie-seyssins.fr', role: 'ELU', fonction: '8e adjointe, Culture' },
  { key: 'garrigos', nom: 'Marie Garrigos-Leclerc', email: 'marie.garrigos-leclerc@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseillère déléguée, Contrôle de gestion', adjointKey: 'ferrucci' },
  { key: 'chevrier', nom: 'Pierre Chevrier', email: 'pierre.chevrier@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseiller délégué, RH/ERP', adjointKey: 'ferrucci' },
  { key: 'jacquier', nom: 'Cyril Jacquier', email: 'cyril.jacquier@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseiller délégué, Énergie', adjointKey: 'baudin' },
  { key: 'cianci', nom: 'Mathieu Cianci', email: 'mathieu.cianci@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseiller délégué, Restauration scolaire', adjointKey: 'paucod' },
  { key: 'collot', nom: 'Françoise Collot', email: 'francoise.collot@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseillère déléguée, Petite enfance', adjointKey: 'cialdella' },
  { key: 'gresil', nom: 'Delphine Gresil', email: 'delphine.gresil@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseillère déléguée, Personnes âgées', adjointKey: 'cialdella' },
  { key: 'bugier', nom: 'Sylvain Bugier', email: 'sylvain.bugier@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseiller délégué, Bâtiments' },
  { key: 'shaiek', nom: 'Jihène Shaiek', email: 'jihene.shaiek@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseillère déléguée, Animations', adjointKey: 'rouillon' },
  { key: 'faucher', nom: 'Pascal Faucher', email: 'pascal.faucher@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseiller délégué, Tranquillité publique' },
  { key: 'borre', nom: 'Célia Borré', email: 'celia.borre@mairie-seyssins.fr', role: 'ELU', fonction: 'Référente, Accessibilité' },
  { key: 'gilabert', nom: 'François Gilabert', email: 'francois.gilabert@mairie-seyssins.fr', role: 'ELU', fonction: 'Référent, Laïcité' },
  { key: 'ivars', nom: 'Ilona Ivars', email: 'ilona.ivars@mairie-seyssins.fr', role: 'ELU', fonction: 'Référente, Partenariats sportifs' },
]
