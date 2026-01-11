# Optimiseur d'Emploi du Temps

Application web moderne pour générer automatiquement des emplois du temps optimaux en utilisant des algorithmes génétiques (GA) et la recherche Tabu.

## Fonctionnalités

- **Upload de données CSV** : Interface intuitive avec drag-and-drop pour importer vos données
- **Optimisation automatique** : Utilise des algorithmes génétiques combinés avec la recherche Tabu
- **Visualisation multiple** : Affichage par groupes d'étudiants, professeurs ou salles
- **Contraintes respectées** :
  - Contraintes dures : capacité des salles, conflits d'horaires
  - Contraintes souples : réduction des trous dans les emplois du temps, équilibrage des journées

## Technologies

- **Frontend** : React, TypeScript, Tailwind CSS, Vite
- **Backend** : Supabase (Base de données PostgreSQL + Edge Functions)
- **Algorithmes** : Algorithmes Génétiques + Recherche Tabu

## Installation

1. Installez les dépendances :
```bash
npm install
```

2. Configurez les variables d'environnement :
Créez un fichier `.env` à la racine du projet :
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Lancez l'application en mode développement :
```bash
npm run dev
```

## Format des fichiers CSV

### fstm_rooms.csv
```csv
room_id,capacity,type
A101,30,TD
B201,50,Amphi
C301,20,TP
```

### fstm_teachers.csv
```csv
teacher_id,name
T001,Prof. Martin
T002,Dr. Dubois
```

### fstm_courses.csv
```csv
course_id,subject,teacher_id,group_id,group_size,room_type_req
C001,Math,T001,G1,25,TD
C002,Physique,T002,G1,25,Amphi
```

## Données d'exemple

Des fichiers CSV d'exemple sont disponibles dans le dossier `example-data/` pour tester l'application.

## Algorithme d'optimisation

L'application utilise une approche hybride en deux phases :

1. **Phase GA (Algorithme Génétique)** :
   - Population de 200 individus
   - 100 générations
   - Taux de mutation adaptatif (0.3, doublé en cas de stagnation)
   - Sélection par tournoi
   - Élitisme (top 15)

2. **Phase Tabu Search** :
   - Affine la meilleure solution du GA
   - 200 itérations maximum
   - Liste tabu de taille 50
   - S'arrête si aucune contrainte dure n'est violée

### Fonction de fitness

```
Fitness = (Violations_Dures × 10000) + Score_Soft
```

Où :
- **Violations Dures** : conflits d'horaires, capacités dépassées
- **Score Soft** : trous dans les emplois du temps + déséquilibre des journées

## Utilisation

1. Uploadez vos trois fichiers CSV (salles, professeurs, cours)
2. Cliquez sur "Générer l'Emploi du Temps Optimal"
3. Visualisez les résultats avec les statistiques de performance
4. Basculez entre les vues : Groupes / Professeurs / Salles

## Architecture

```
src/
├── components/
│   ├── CSVUpload.tsx       # Composant d'upload de fichiers
│   └── ScheduleView.tsx    # Visualisation de l'emploi du temps
├── lib/
│   └── supabase.ts         # Client Supabase
├── types/
│   └── index.ts            # Types TypeScript
└── App.tsx                 # Composant principal

supabase/functions/
└── optimize-schedule/      # Edge Function d'optimisation
    └── index.ts
```

## Performances

- Temps moyen d'optimisation : 10-30 secondes
- Génération de solutions quasi-optimales
- Réduction significative des conflits d'horaires

## License

MIT
