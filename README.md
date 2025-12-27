# GL02_A25_Andouillettes

Outil de gestion et de suivi d'occupation des salles de cours utilisant l'emploi du temps au format CRU avec génération d'iCalendar pour les utilisateurs.


## Objectifs du projet

- Vérifier la validité de fichiers CRU
- Analyser l’occupation des salles de cours
- Identifier les conflits et chevauchements
- Exporter les données vers des formats exploitables (iCalendar, SVG)
- Fournir des indicateurs d’usage des salles (sous-utilisation / sur-utilisation)

Ce projet a été réalisé dans le cadre du module **GL02**.

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

```
node caporalCli sort-room-capacity <chemin/vers/un/fichier.cru>
```
Donne un affichage du nom des salles avec leur capacité trié par ordre croissant

```
node caporalCli room-occupancy <chemin/vers/un/fichier.cru> <nom d'une salle>
```
Donne un affichage des moments où une salle est utilisée durant la semaine
```
node caporalCli available-rooms <chemin/vers/un/fichier.cru> <D HH:MM>
```
Donne un affichage des salles disponibles à un temps donné

```
node caporalCli room-usage <chemin/vers/un/fichier.cru>
```
Affiche les salles sous-utilisées et les salles sur-utilisées

```
node caporalCli verify <chemin/vers/un/fichier.cru>
```
Vérifie les chevauchements de salles dans les données

## Dépendances

* [Caporal.js](https://github.com/mattallty/Caporal.js) - Framework de construction d'application en lignes de commandes
* [Jasmine](https://jasmine.github.io/index.html) - Framework de test unitaire
* [Vega-lite](https://vega.github.io/vega-lite/) - Outil de visualisation de données

## Auteurs

- Alec BASSET _alias_ [@Eylexander](https://github.com/Eylexander) joignable via alec.basset@utt.fr
- Lancelot ROGER _alias_ [@39soup](https://github.com/39soup) joignable via lancelot.roger@utt.fr
- Antoine NERET _alias_ [@AntoineNeret](https://github.com/AntoineNeret) joignable via antoine.neret@utt.fr

## Révision et maintenance

- Jérémie RICHARD _alias_ [@RJ-45-1](https://github.com/RJ-45-1) joignable jeremie.richard@utt.fr  
- Gabin CEYRAS _alias_ [@gabincrs](https://github.com/gabincrs)  joignable gabin.ceyras@utt.fr  
- Gurvan CABIOCH _alias_ [@GurvanCab](https://github.com/GurvanCab)  joignable gurvan.cabioch@utt.fr  

## Licence

Ce projet est sous licence ``MIT License`` - voir sur [choosealicense.com](https://choosealicense.com/licenses/mit/)
