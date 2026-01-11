# Guide de Configuration

## 1. Configuration de Supabase

L'application nécessite un projet Supabase pour fonctionner. Voici comment configurer votre projet :

### Étape 1 : Créer un projet Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Créez un nouveau projet
4. Notez l'URL du projet et la clé API anonyme (anon key)

### Étape 2 : Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet et ajoutez :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici
```

Vous trouverez ces informations dans :
- Dashboard Supabase > Settings > API

### Étape 3 : Base de données

La base de données est déjà configurée automatiquement avec les migrations suivantes :

#### Tables créées :
1. **rooms** - Informations sur les salles
   - `room_id` : Identifiant de la salle
   - `capacity` : Capacité maximale
   - `type` : Type de salle (TD, TP, Amphi)

2. **teachers** - Informations sur les professeurs
   - `teacher_id` : Identifiant du professeur
   - `name` : Nom du professeur

3. **courses** - Informations sur les cours
   - `course_id` : Identifiant du cours
   - `subject` : Matière enseignée
   - `teacher_id` : Professeur assigné
   - `group_id` : Groupe d'étudiants
   - `group_size` : Nombre d'étudiants
   - `room_type_req` : Type de salle requis

4. **schedules** - Emplois du temps générés
   - `name` : Nom de l'emploi du temps
   - `assignments` : Affectations (JSON)
   - `fitness` : Score de qualité
   - `hard_violations` : Nombre de violations de contraintes dures
   - `soft_score` : Score des contraintes souples

### Étape 4 : Edge Function

Une Edge Function `optimize-schedule` a été déployée automatiquement. Elle contient l'algorithme d'optimisation (GA + Tabu Search).

## 2. Lancement de l'application

### Installation
```bash
npm install
```

### Développement
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Production
```bash
npm run build
npm run preview
```

## 3. Test de l'application

1. Ouvrez l'application dans votre navigateur
2. Uploadez les fichiers CSV d'exemple disponibles dans `example-data/`
3. Cliquez sur "Générer l'Emploi du Temps Optimal"
4. Attendez 10-30 secondes pendant l'optimisation
5. Visualisez les résultats

## Dépannage

### Erreur : "Missing Supabase environment variables"
- Vérifiez que votre fichier `.env` existe et contient les bonnes variables
- Redémarrez le serveur de développement après avoir créé le `.env`

### Erreur lors de la génération
- Vérifiez que tous les fichiers CSV sont bien formatés
- Assurez-vous que les données sont cohérentes (ex: les teacher_id dans courses doivent exister dans teachers)

### L'application ne se connecte pas à Supabase
- Vérifiez que l'URL et la clé API sont correctes
- Vérifiez que votre projet Supabase est actif
- Vérifiez que les migrations de base de données ont été appliquées

## Support

Pour toute question ou problème, consultez :
- Documentation Supabase : [https://supabase.com/docs](https://supabase.com/docs)
- Documentation Vite : [https://vitejs.dev](https://vitejs.dev)
