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

let pID; // player ID (1 or 2)
let rpsSel; // player's current RPS selection

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
database.ref(refPlayers).on("child_removed", function(snapshot) {
  const playerID = snapshot.val().id;
  console.log(`Player ${playerID} has left`);
  $(`#player${playerID}-name`).text('Player ' + playerID);
  $(`.player${playerID}-form`).show();
});

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
  playerEntry(1);
  pID = 1;
});

// player 2 joins by entering a name
$('#player2-join').click(function () {
  const playerName = $('#player2-entry').val().trim();
  console.log("player2 name: " + playerName);
  playerEntry(2);
  pID = 2;
});

//
// Update when a player enters into the game play
//
database.ref(refPlayers).on('child_added', function (childSnapshot) {
  const player = childSnapshot.val();

  $(`#player${player.id}-name`).text(player.name);
  $(`.player${player.id}-form`).hide();
  console.log(`${player.name} is added.`);
});


$(".rps").on("click", function (event) {
  event.preventDefault();

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
    // 
    if (!/^Go/.test($(`#player${pID}-ready`).text())) {
      const goButton = $('<button>');
      goButton.text('Go!');
      goButton.addClass('btn btn-primary');
      goButton.attr('id', `player${pID}-ready`);
      goButton.attr('type', 'submit');
      goButton.bind("click", rpsSelect);
      goButton.insertAfter($(`#player${pID}`));
    }
    $(`#player${pID}-result`).text("");
  }

  rpsSel = selection;
});

function rpsSelect() {
  const data = {};
  data[`player${pID}`] = rpsSel;
  database.ref(refGame).update(data);
  $(`#player${pID}-ready`).text('Go! (waiting the opponent)');
}


database.ref(refGame).on('value', (snapshot) => {
  let selections = snapshot.val();
  console.log("Selections: " + selections);

  // Both players made selections
  if (selections && Object.values(selections).length === 2) {
    let result = rpsMatch(selections);
    updateStats(result);
    database.ref(refGame).remove();
    $(`#player${pID}-ready`).remove();
    $('.rps').animate({ opacity: 1.0 }, "normal");
  }
});

function updateStats(result) {
  let data = {};
  const mapID = {};

  database.ref(refPlayers).orderByKey().on("value", function(player) {
    console.log(`player.key = ${player.key}`);
    data = player.val();
    const connIDs = Object.keys(data);

    connIDs.forEach(cKey => {
      mapID[data[cKey].id] = cKey;
    });;
  });

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

function rpsMatch(rpsData) {
  let rps = new RPS();

  rps.player1 = rpsData.player1;
  rps.player2 = rpsData.player2;
  result = rps.rpsResult();

  if (result === 1) {
    $('#player1-result').text("Won!");
    $('#player2-result').text("Lost :-(");
   } else if (result === 2) {
    $('#player1-result').text("Lost :-(");
    $('#player2-result').text("Won!");
   } else if (result === 3) {
    $('#player1-result').text("tie");
    $('#player2-result').text("tie");
   }

   return result;
}

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