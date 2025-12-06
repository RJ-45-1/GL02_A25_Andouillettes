# GL02_A25_Andouillettes

Outil de gestion et de suivi d'occupation des salles de cours utilisant l'emploi du temps au format CRU avec génération d'iCalendar pour les utilisateurs.

## Pour commencer

### Pré-requis : installation de Node.js

Cet outil requiert l'installation de Node.js

- Site de Node.js : https://nodejs.org/fr
- Distributions binaires pour divers Linux : https://github.com/nodesource/distributions
- Image Docker officielle : https://hub.docker.com/_/node/

### Installation

Pour installer le projet, exécutez la commande ci-dessous dans un terminal:
```
git clone https://github.com/Eylexander/GL02_A25_Andouillettes.git
```
Puis une fois l'outil téléchargé, exécutez la commande suivante dans un terminal ouvert dans l'outil
```
npm install
```

### Exécution

Une fois l'installation terminée, vous êtes prêt à utiliser l'outil.
Vous avez la possibilité d'utiliser toutes les commandes ci-dessous:

```
node caporalCli check <chemin/vers/un/fichier.cru>
```
Vérifie que le fichier passé en paramètre est un fichier cru valide

```
node caporalCli readme
```
Affiche le fichier README du projet


```
node caporalCli search-rooms <chemin/vers/un/fichier.cru> <nom d'un cours>
```
Cherche les salles utilisées par certains cours

```
node caporalCli export <chemin/vers/un/fichier.cru> <fichier.ics> -sd|--startDate -ed|--endDate
```
Exporte les fichiers.cru en fichier.ics au format iCalendar

```
node caporalCli visualize-occupancy <chemin/vers/un/fichier.cru> <fichier.svg>
```
Produit un fichier.svg permettant de visualiser le taux d'occupation d'une salle

```
node caporalCli get-room-capacity <chemin/vers/un/fichier.cru> <nom d'une salle>
```
Donne la capacité maximale de la salle passée en paramètre

## Dépendances

* [Caporal.js](https://github.com/mattallty/Caporal.js) - Framework de construction d'application en lignes de commandes
* [Jasmine](https://jasmine.github.io/index.html) - Framework de test unitaire
* [Vega-lite](https://vega.github.io/vega-lite/) - Outil de visualisation de données

## Auteurs

- Alec BASSET _alias_ [@Eylexander](https://github.com/Eylexander) joignable via alec.basset@utt.fr
- Lancelot ROGER _alias_ [@39soup](https://github.com/39soup) joignable via lancelot.roger@utt.fr
- Antoine NERET _alias_ [@AntoineNeret](https://github.com/AntoineNeret) joignable via antoine.neret@utt.fr

## Licence

Ce projet est sous licence ``MIT License`` - voir sur [choosealicense.com](https://choosealicense.com/licenses/mit/)