//
// Initialize Firebase
//
var config = {
  apiKey: "AIzaSyDwvBpma7NmJQ0hNkJHo9SQDGjW25dwzDU",
  authDomain: "rps-multiplayer-39486.firebaseapp.com",
  databaseURL: "https://rps-multiplayer-39486.firebaseio.com",
  projectId: "rps-multiplayer-39486",
  storageBucket: "rps-multiplayer-39486.appspot.com",
  messagingSenderId: "5790856791"
};

firebase.initializeApp(config);

//
// Variables for Firebase Reference names
//
const refConn = 'connection'; // all connected users
const refPlayers = 'players'; // current 2 players 
const refGame = 'game';       // game data
const refChat = 'chat';       // chat messages

//
// Variables for referencing database connections
//
const database = firebase.database();
const connectionsRef = database.ref(refConn);
const connectedRef = database.ref('.info/connected');
const chatRef = database.ref(refChat);

let pID;    // player ID (1 or 2)
let rpsSel; // player's current RPS selection


function opponentID(myID = pID) {
  return (myID == 1) ? 2 : 1;
}

//
// Keep track of each user connection
// Each user's connection key is stored locally before joining a game.
//
connectedRef.on("value", function (snap) {
  if (snap.val()) {
    const conn = connectionsRef.push(true);

    // save the connection key before joining the game(i.e. enter a name)
    sessionStorage.setItem(refConn, conn.key);
    conn.onDisconnect().remove();
  }
});

//
// Clean up when a player is disconnected.
//
connectionsRef.on("child_removed", function(snapshot) {
  prunePlayersRef();
});

//
// Firebase connection and/or reference event trigger are flaky sometimes,
// leaving entries of already exited players. So, clean up extra entries if any.
//
function prunePlayersRef() {
  let connectionIDs;
  let playerIDs = [];

  database.ref(refPlayers).orderByKey().on("value", function(snapshot) {
    if (snapshot.val()) {
      playerIDs = Object.keys(snapshot.val());
    }
  });
  connectionsRef.orderByKey().on("value", function(snapshot) {
    connectionIDs = Object.keys(snapshot.val());
  });

  playerIDs.forEach((id) => {
    if (!connectionIDs.includes(id)) {
      console.log(`${id} does not appear to be connected. Removing.`);
      database.ref(refPlayers + '/' + id).remove();
    }
  });
}

//
// When a player leaves, update the web UI to re-open for a new player entry
//
database.ref(refPlayers).on("child_removed", function(snapshot) {
  const playerID = snapshot.val().id;
  console.log(`Player ${playerID} has left`);
  console.log(`*** pID = ${pID} playerID = ${playerID} ***`);
  
  resetPlayerUI(playerID);
  if (pID !== playerID) {
    if (/make your selection|Read and wait/.test($(`#player${opponentID()}-msg`).text())) {
      $(`#player${opponentID()}-msg`).text('The opponent left!');
    }
    const opponentEntry = $(`#player${opponentID()}-entry`);
    opponentEntry.show();
    opponentEntry.attr('disabled', '');
    opponentEntry.attr('placeholder', 'Awaiting for another player to join');
  }
  
  $(`#player${playerID}-msg`).text("");
  $(`#player${opponentID()}-msg`).text("");
});

//
// Reset when a player leaves the game
//
function resetPlayerUI(playerID) {
  $(`#player${playerID}-name`).text('Player ' + playerID);
  $(`#player${playerID}-entry`).attr('placeholder', 'Enter your name to play');
  $(`#player${playerID}-entry`).attr('enabled', '');
  $(`#player${playerID}-join`).attr('enabled', '');
}

//
// Update the web UI with a player stats
//
database.ref(refPlayers).on("child_changed", function(snapshot) {
  const player = snapshot.val();

  console.log(`Update stats for player ${player.id}`);
  $(`#player${player.id}-win-score`).text(player.win);
  $(`#player${player.id}-loss-score`).text(player.loss);
  $(`#player${player.id}-tie-score`).text(player.tie);
});

//
// Add a player to the Firebase.ref(<refPlayers>)
//
// PARAMS:
// name = user entered name
// playerID = 1 or 2 (left or right side of the web UI)
//
function addPlayer(name, playerID) {
  const userID = sessionStorage.getItem(refConn);
  database.ref(`${refPlayers}/${userID}`).set({
    name: name,
    id: playerID,
    win: 0,
    loss: 0,
    tie: 0
  });
}

//
// The number of players currently in <refPlayers>
//
function numOfPlayers() {
  let playersRef = database.ref(refPlayers);
  let num = 0;

  prunePlayersRef(); // clean up any extra before counting

  playersRef.orderByKey().on("value", function (snapshot) {
    if (snapshot.val()) {
      num = Object.keys(snapshot.val()).length;
    }
  });
  console.log('# of players = ' + num);

  return num;
}

//
// Update the web page as a player enters his/her name
//
function playerEntry(playerNum) {
  const playerName = $(`#player${playerNum}-entry`).val().trim();
  console.log(`Entry for player${playerNum}: ${playerName}`);
  addPlayer(playerName, playerNum);

  if (numOfPlayers() < 2) {
    // const num = (playerNum === 1) ? 2 : 1;
    const opponentNum = opponentID(playerNum);
    const opponentEntry = $(`#player${opponentNum}-entry`);
    
    opponentEntry.attr('placeholder', 'Awaiting for another player to join');
    opponentEntry.attr('disabled', '');
    $(`#player${opponentNum}-join`).attr('disabled', '');
    $(`#player${playerNum}-join`).attr('disabled', '');
    $(`#player${playerNum}-entry`).attr('disabled', '');
  }
}

// player 1 joins by entering a name
$("#player1-form").submit(function(event) {
  event.preventDefault();
  player1Entry();
});

// player 1 joins by entering a name, clicking the Join button
$('#player1-join').click(function () {
  event.preventDefault();
  player1Entry();
});

// player 2 joins by entering a name
$("#player2-form").submit(function(event) {
  event.preventDefault();
  player2Entry();
});

// player 2 joins by entering a name, clicking the Join button
$('#player2-join').click(function () {
  event.preventDefault();
  player2Entry();
});

function player1Entry() {
  const playerName = $('#player1-entry').val().trim();
  console.log("player1 name: " + playerName);
  playerEntry(1);
  pID = 1;
  addExitButton();
}

function player2Entry() {
  const playerName = $('#player2-entry').val().trim();
  console.log("player2 name: " + playerName);
  playerEntry(2);
  pID = 2;
  addExitButton();
}

//
// Add a leave(exit) button for a player to get out of the game
//
function addExitButton() {
  const exitButton = $('<button>');
  exitButton.text('leave');
  exitButton.addClass('btn btn-sm btn-outline-primary');
  exitButton.attr('id', `player${pID}-exit`);
  exitButton.attr('type', 'submit');
  exitButton.bind("click", leaveGame);
  exitButton.insertAfter($(`#player${pID}-stat`));
}

// Remove the reference for this player to exit the game
function leaveGame() {
  const userID = sessionStorage.getItem(refConn);
  
  database.ref(`${refPlayers}/${userID}`).remove();
  database.ref(`${refGame}/player${pID}`).remove();
  resetPlayerUI(pID);
  $(`#player${pID}-exit`).remove();
  $(`#player${pID}-msg`).text("");
  $(`#player${opponentID()}-msg`).text("");
  $(`#player${pID}-ready`).remove();
  location.reload();
}

//
// Boolean whether a player w/ the userID is one of two players
//
function isPlaying(userID = sessionStorage.getItem(refConn)) {
  let found = false;

  console.log(`checking ${userID} is in the players ref`);
  database.ref(refPlayers).orderByKey().on("value", function(players) {
    console.log(`players  = ${JSON.stringify(players)}`);
    if (JSON.stringify(players) !== 'null') {
      if (Object.keys(players.val()).includes(userID)) {
        console.log(`${userID} is found in the players ref`);
        found = true;
      }
    }
    else {
      console.log(`User ${userID} is NOT found in the players ref`);
    }
  });

  return found;
}

//
// Update when a player enters into the game play
//
database.ref(refPlayers).on('child_added', function(childSnapshot) {
  const player = childSnapshot.val();

  $(`#player${player.id}-name`).text(player.name);
  $(`#player${player.id}-form`).hide();
  console.log(`${player.name} is added.`);
});

//
// A player clicks on one of rock/paper/scissors image
//
$(".rps").on("click", function(event) {
  event.preventDefault();

  if (!isPlaying()) {
    return;
  }

  const selection = $(this).attr('id');
  const player = $(this).parent().attr('id');
  console.log(`player[${player}] pID[${pID}]`);

  if (player == `player${pID}`) {
    if (selection === 'rock') {
      $(`#${player} > #rock`).animate({ opacity: 1.0 }, "normal");
      $(`#${player} > #paper`).animate({ opacity: 0.3 }, "normal");
      $(`#${player} > #scissors`).animate({ opacity: 0.3 }, "normal");
    }
    else if (selection === 'paper') {
      $(`#${player} > #rock`).animate({ opacity: 0.3 }, "normal");
      $(`#${player} > #paper`).animate({ opacity: 1.0 }, "normal");
      $(`#${player} > #scissors`).animate({ opacity: 0.3 }, "normal");
    }
    else if (selection === 'scissors') {
      $(`#${player} > #rock`).animate({ opacity: 0.3 }, "normal");
      $(`#${player} > #paper`).animate({ opacity: 0.3 }, "normal");
      $(`#${player} > #scissors`).animate({ opacity: 1.0 }, "normal");
    }

    // Add "Go!" button below the RPS images to finalize the selection
    if (!/^Go/.test($(`#player${pID}-ready`).text())) {
      const goButton = $('<button>');
      goButton.text('Go!');
      goButton.addClass('btn btn-primary');
      goButton.attr('id', `player${pID}-ready`);
      goButton.attr('type', 'submit');
      goButton.bind("click", rpsSelect);
      goButton.insertAfter($(`#player${pID}`));
    }
    $(`#player${pID}-msg`).text("");
  }

  rpsSel = selection;
});

//
// Update "refGame" reference with a player's selection of rock/paper/scissors
//
function rpsSelect() {
  const data = {};
  data[`player${pID}`] = rpsSel;
  database.ref(refGame).update(data);
  $(`#player${pID}-ready`).text('Go! (waiting the opponent)');
}

//
// Polls the "refGame" reference for both players inputs
//
database.ref(refGame).on('value', (snapshot) => {
  let selections = snapshot.val();
  console.log("Selections: " + JSON.stringify(selections));

  // Both players made selections
  if (selections) {
    const selectionLength = Object.values(selections).length;
    if (selectionLength === 2) {
      let result = rpsMatch(selections);
      updateStats(result);
      database.ref(refGame).remove();
      $(`#player${pID}-ready`).remove();
      $('.rps').animate({ opacity: 1.0 }, "normal");
    }
    else if (selectionLength === 1) {
      const numP = numOfPlayers();
      
      if (numOfPlayers() == 2) {
        const  msg = "Please make your selection. Your opponent is waiting!";
        if (`player${pID}` in selections) {
          $(`#player${opponentID()}-msg`).text(msg);
        } else {
          $(`#player${pID}-msg`).text(msg);
          $(`#player${opponentID()}-msg`).text("Ready and waiting");
        }      
      } else {
        if (`player${pID}` in selections) {
          $(`#player${opponentID()}-msg`).text("Awaiting another player to join...");
        } else {
          $(`#player${pID}-msg`).text("");
        }
      }
    }
  }
});

//
// Win/Loss/Tie stats update and display
// Data of both players will be updated all together
//
function updateStats(result) {
  let data = {};
  const mapID = {}; // reverse lookup { playerID(1 or 2) => connID(hash) }

  database.ref(refPlayers).orderByKey().on("value", function(player) {
    console.log(`player.key = ${player.key}`);
    data = player.val();
    if (!data) {
      return;
    }
    const connIDs = Object.keys(data);

    connIDs.forEach(cKey => {
      mapID[data[cKey].id] = cKey;
    });;
  });

  if (Object.keys(mapID).length !== 2) {
    return;
  }

  if (result === 1) { // player 1 won
    data[mapID[1]].win += 1;
    data[mapID[2]].loss += 1;
  }
  else if (result === 2) { // player 2 won
    data[mapID[1]].loss += 1;
    data[mapID[2]].win += 1;
  }
  else if (result === 3) { // tie
    data[mapID[1]].tie += 1;
    data[mapID[2]].tie += 1;
  }
  else {
    console.log("NOTHING is updated. Result = " + result);
  }
  console.log(JSON.stringify(data));
  console.log(JSON.stringify(mapID));
  database.ref(refPlayers).update(data);
}

//
// A simple, small class for checking win/loss/tie
//
class RPS {
  constructor() {
    this.player1 = null;
    this.player2 = null;
    this.winCombo = this.winningCombinations();
  }

  winningCombinations() {
    return {
      'rock': 'scissors',
      'paper': 'rock',
      'scissors': 'paper'
    }
  }

  //
  // RETURN:
  //  * undefined == missing either/both players' inputs
  //  * 1 == player1 won
  //  * 2 == player2 won
  //  * 3 == tie
  //
  rpsResult() {
    console.log(`1: ${this.player1}, 2: ${this.player2}`);
    if (!this.player1 || !this.player2) {
      return undefined;
    }

    if (this.player1 === this.player2) {
      return 3;
    }

    return (this.winCombo[this.player1] === this.player2) ? 1 : 2;
  }
}

//
// Takes r/p/s inputs of two players and update the result display
//
// PARAMS:
//  * rpsData = { player1: rock/paper/scissors,
//                player2: rock/paper/scissors }
//
function rpsMatch(rpsData) {
  let rps = new RPS();

  rps.player1 = rpsData.player1;
  rps.player2 = rpsData.player2;
  result = rps.rpsResult();

  if (result === 1) {
    $('#player1-msg').text("Won!");
    $('#player2-msg').text("Lost :-(");
   } else if (result === 2) {
    $('#player1-msg').text("Lost :-(");
    $('#player2-msg').text("Won!");
   } else if (result === 3) {
    $('#player1-msg').text("tie");
    $('#player2-msg').text("tie");
   }

   return result;
}

//
// A very basic chat feature
// Chat name, message, and date are stored in Firebase
// in order to sync the chat data among multiple users.
//
$('#chat-btn').click(function(event) {
  event.preventDefault();
  let player = $(`#player${pID}-name`).text();

  if (!player) {
    player = 'anonymous';
  }

  chatRef.push({
    name: player,
    msg: $('#chat-text').val(),
    dateAdded: moment().format('MM/DD/YYYY LT')
  });

  $('#chat-text').val("");  
});

//
// Upon a new chat message, update the display on the web page
//
chatRef.on("child_added", function(snapshot) {
  const sender = snapshot.val();
  const msg = $('<p>');
  const name = $('<strong>');

  name.append(sender.name);
  msg.append(name);
  msg.append(sender.dateAdded);
  msg.append('<br>');
  msg.append(sender.msg);
  $('#chat-board').append(msg);
  $('#chat-board').animate({
    scrollTop: $('#chat-board')[0].scrollHeight
  }, 1200);
});