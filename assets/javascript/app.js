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
// Variables for Firebase
//
const database = firebase.database();
const connectionsRef = database.ref('connection');
const connectedRef = database.ref('.info/connected');

//
//
//
let player1, player2;

//
// Keep track of each user connection
// Also, each user's unique connection is stored locally before joining a game.
//
connectedRef.on("value", function (snap) {
  if (snap.val()) {
    var con = connectionsRef.push(true);
    // save the initial key before the client join the game(i.e. enter a name)
    sessionStorage.setItem('connKey', con.key);
    con.onDisconnect().remove();
  }
});

//
// Clean up when a player is disconnected.
//
connectionsRef.on("child_removed", function (snapshot) {
  let userRef = database.ref('users/' + snapshot.key);
  let playerID;

  userRef.once('value', (snap) => {
    if (snap.val()) {
      playerID = snap.val().playerID;
    }
  });

  userRef.remove().then(function () {
      console.log(`${playerID} removed successfully`);
      $(`#${playerID}-name`).text(playerID);
      $(`.${playerID}-form`).show();
    })
    .catch(function (error) {
      console.log("Remove failed: " + error.message);
    });
});

class RPSPlayer {
  constructor(playerID, name) {
    this.playerID = playerID;
    this.playerName = name;
    this.userID = sessionStorage.getItem('connKey');
    this.win = 0;
    this.loss = 0;
    this.tie = 0;
  }

  addToDatabase() {
    database.ref('users/' + this.userID).set({
      name: this.playerName,
      playerID: this.playerID,
      win: 0,
      loss: 0,
      tie: 0
    });
  }
}

//
//
//
$('#player1-join').click(function () {
  let player1Name = $('#player1-entry').val().trim();
  console.log("player1 name: " + player1Name);

  player1 = new RPSPlayer('player1', player1Name);
  player1.addToDatabase();

  if (!player2) {
    $('#player2-entry').attr('placeholder', 'Awaiting for a player to join');
    $('#player2-entry').attr('disabled', '');
  }
  $(document).keyup(userInput);
});

$('#player2-join').click(function () {
  let player2Name = $('#player2-entry').val().trim();
  console.log("player2 name: " + player2Name);

  player2 = new RPSPlayer('player2', player2Name);
  player2.addToDatabase();

  if (!player1) {
    $('#player1-entry').attr('placeholder', 'Awaiting for a player to join');
    $('#player1-entry').attr('disabled', '');
  }
  $(document).keyup(userInput);
});

database.ref('users').on("child_added", function (childSnapshot) {
  let snap = childSnapshot.val();
  joinTheGame(snap.playerID, snap.name);
});

function joinTheGame(playerID, playerName) {
  $(`#${playerID}-name`).text(playerName);
  $(`.${playerID}-form`).hide();
}

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