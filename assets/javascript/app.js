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
const refGame = 'game'; // game data

//
// Variables for referencing database connections
//
const database = firebase.database();
const connectionsRef = database.ref(refConn);
const connectedRef = database.ref('.info/connected');

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
connectionsRef.on("child_removed", function (snapshot) {
  const connID = snapshot.key;
  const playerRef = database.ref(`${refPlayers}/${connID}`);

  if (playerRef) {
    console.log("Removing player ID:" + connID);

    playerRef.remove().then(function () {
        console.log(`${connID} removed successfully`);
      })
      .catch(function (error) {
        console.log("Remove failed: " + error.message);
      });
  } else {
    console.log("No such player to remove:" + connID);
  }
});

//
// When a player leaves, update the web UI to re-open for a new player entry
//
database.ref(refPlayers).on("child_removed", function (snapshot) {
  const playerID = snapshot.val().id;
  console.log(`Player ${playerID} has left`);
  $(`#player${playerID}-name`).text('Player ' + playerID);
  $(`.player${playerID}-form`).show();
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

  playersRef.orderByKey().on("value", function (snapshot) {
    console.log("numOfPlayers " + snapshot.val());
    num++;
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
    const num = (playerNum === 1) ? 2 : 1;
    const entryID = $(`#player${num}-entry`);
    entryID.attr('placeholder', 'Awaiting for another player to join');
    entryID.attr('disabled', '');
  }
}

// player 1 joins by entering a name 
$('#player1-join').click(function () {
  const playerName = $('#player1-entry').val().trim();
  console.log("player1 name: " + playerName);
  addPlayer(playerName, 1);
  playerEntry(1);
});

// player 2 joins by entering a name
$('#player2-join').click(function () {
  const playerName = $('#player2-entry').val().trim();
  console.log("player2 name: " + playerName);
  addPlayer(playerName, 2);
  playerEntry(2);
});

//
// Update when a player enters into the game play
//
database.ref(refPlayers).on('child_added', function (childSnapshot) {
  const snap = childSnapshot.val();
  
  $(`#player${snap.id}-name`).text(snap.name);
  $(`.player${snap.id}-form`).hide();
  console.log(`${snap.name} is added.`);
});

function userInput(event) {
  let userGuess = event.key;
  let player = (player1) ? player1 : player2;
  let data = {};
  data[player.playerID] = userGuess;
  database.ref('rps').update(data);
}

database.ref('rps').on('value', (snapshot) => {
  let selections = snapshot.val();
  console.log("Selections: " + selections);

  // Both players made selections
  if (selections && Object.values(selections).length === 2) {
    rpsMatch(selections);
    // database.ref('rps').remove();
  }
});

class RPS {
  constructor() {
    this.player1 = null;
    this.player2 = null;
    this.winCombo = this.winningCombinations();
    this.toRPS = {
      'r': 'rock',
      'p': 'paper',
      's': 'scissors'
    }
  }

  charToRPS(rpsChar) {
    return this.toRPS[rpsChar.toLowerCase()]
  }

  winningCombinations() {
    return {
      'rock': 'scissors',
      'paper': 'rock',
      'scissors': 'paper'
    }
  }

  winOrLose() {
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


// This function is run whenever the user presses a key.
function rpsMatch(rpsData) {
  let rps = new RPS();
  let player = (player1) ? player1 : player2;

  rps.player1 = rps.charToRPS(rpsData.player1);
  rps.player2 = rps.charToRPS(rpsData.player2);
  winloss = rps.winOrLose();

  if (winloss === 1) {
    $('#player1-result').text("Won!");
    player.win++;
  } else if (winloss === 2) {
    $('#player1-result').text("Lost :-(");
    player.loss++;
  } else if (winloss === 3) {
    $('#player1-result').text("tie");
    player.tie++;
  }
  $(`#${player.playerID}-text`).text(rps.player1);
  $(`#${player.playerID}-win-score`).text(player.win);
  $(`#${player.playerID}-loss-score`).text(player.loss);
  $(`#${player.playerID}-tie-score`).text(player.tie);
}