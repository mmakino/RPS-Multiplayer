# RPS-Multiplayer
Rock Paper Scissors game

### Overview
Online multi-player Rock-Paper-Scissors game written in javascript. Firebase is used in the backend to help sync inputs and display of multiple users.
* https://mmakino.github.io/RPS-Multiplayer/
* No longer functional due to the firebase policy change

### Tools Used
* Firebase
* javascript / jQuery
* Bootstrap
* Moment.js

### Game Description
  * Only two users can play at the same time.
    * hint: you can use two tabs/windows to play both players.
  * Enter your name into available player's textbox; Player 1 or Player 2.
  * You do not see a text box when there are already two players. You can still watch the game, while waiting for a spot to become available.
  * Once you enter your name, start playing by selecting one of Rock, Paper, Scissors picture.
  * When you decided on your selection, press "Go!" button. You may change your selection while awaiting the other player's selection.
  * After Win, Loss, or Tie is determined, you can click on one of Rock, Paper, and Scissors image to continue playing.
  * To leave the game, click on "leave" button or simply close the tab/window. __No game stats will be saved__ after leaving the game.
    * In fact, you can play with blank name! __no logging, just for FUN!__
  * _Chat messages will be saved (until I decide to delete them manually)_.

##### Comment
  * This has been my first multi-user game development, and honestly this opportunity made me think in different views in order to handle the interface for multiple users. It was hard but I enjoyed. I still know weak points of this app as I can think of a couple of ways I break this app. So, if you see some embarrassing behavior, please try reloading or let me know.

### Repository
```
+--- assets
|   +--- css
|   |   +--- reset.css
|   |   +--- style.css
|   +--- image
|   |   +--- 600x400_RockPaperScissor.jpg
|   |   +--- paper.png
|   |   +--- rock.png
|   |   +--- scissors.png
|   +--- javascript
|   |   +--- app.js
+--- Homework_RPS_Activity_Challenge.md
+--- index.html
+--- README.md
```
