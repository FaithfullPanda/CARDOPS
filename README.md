# CardOps

<img src="pictures/cardops_tr.png" alt="Project Logo" width="180">

> A 'gamified' way to store your CLI commands, manage them, AND get them in your clipboard ! 


## Overview

As a SysAdmin, my daily work often requires i use many CLI commands.
Most of the time, i remember them, but as time and experience grow, we have to know a lot of different commands in different contexts ! 
I used to have a txt file, then an excel, then a simple html page with a quick copy to clipboard button... but it wasn't really fun to use, eye-pleasing and easy to maintain as the number of commands continued to grow, and the number of subjects too. 

Then came the idea for CardOps: At first, i wanted to make it a simple html/js/css based command vault, nothing complicated. But then, i found this to be rather...bland. So i decided on adding funny elements; as i love video games and especially roguelikes/deckbuilder, i thought: why not ? 

Whether you're looking to use it directly, adapt it to your own environment, or contribute improvements, feedback and contributions are welcome, and i'd be really happy to hear if anyone thought the idea was a nice one ! 

## Features

* Offline only - no data sent to any cloud. 
* Basic HTML/JS/CSS app made to work on any computer , only requires a browser
* Uses INDEXEDB for data persistence: unless you clear everything (including the cache of your browser) you won't lose your data. 
* Download the Project, put it wherever you need, open index.html, and start playng around !
* Sorting (name, recently created, or by Elevation level ! )
* Card hand / Grid diplays
* default templates for commonly used commands available
* Ease of import/export: create (or use the templates) decks, imports them in the interface directly !
* Open booster packs to get selected cards for a specific topic !
* Booster pack Builder to make the json formatting easier: open booster-pack-creator.html, create your card deck, export it to json, and import it into cardops !
* Share you booster packs Jsons to colleagues, trainees, whoever needs them !

## Screenshots

CardOps : 

<img width="1419" height="803" alt="image" src="https://github.com/user-attachments/assets/7176166b-e560-4693-9fbe-632337bb2631" />

<img width="1414" height="811" alt="image" src="https://github.com/user-attachments/assets/56f1734c-2e73-4c79-b468-6e3389a1e045" />

<img width="1419" height="805" alt="image" src="https://github.com/user-attachments/assets/b5f993d0-70d9-4ce3-b276-1d0102a6a897" />

<img width="1417" height="810" alt="image" src="https://github.com/user-attachments/assets/c4d1c67b-8484-422b-998f-b68478fd56cd" />

<img width="1419" height="800" alt="image" src="https://github.com/user-attachments/assets/96100ac0-f7c0-43a6-bc09-d83640caafdc" />


Booster pack/deck generator: 

<img width="1503" height="771" alt="image" src="https://github.com/user-attachments/assets/1d5a9af1-548b-4756-abbf-b962c52d369d" />



## Disclaimer

I'm a systems administrator, not a professional software developer.
Most of the codebase was created with the assistance of modern AI coding tools and then reviewed, tested, and adapted to fit the project's requirements. While every effort has been made to ensure the project works reliably, there may be implementation choices that differ from what an experienced software engineer would produce.

If you spot issues, improvements, or better approaches, pull requests and constructive feedback are greatly appreciated, and i am open to discuss things ! 
This project is mainly an idea that I created thanks to AI tools and that i am happy to share, but it can still evolve / be better ! 


## Status

This project is actively maintained as time permits and is primarily developed to solve practical operational needs.

## Roadmap/Future Ideas

* Operation Decks: transform your procedures into card hands, play them with tutorial like explanation, step by step.
* PWA conversion 
* Mobile compatible app conversion
* Server mode?
