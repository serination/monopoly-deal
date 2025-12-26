const state = {
  isHost: false,
  playerId: null,
  playerName: "",
  hostId: null,
  hostGame: null,
  viewGame: null,
  peer: null,
  conn: null,
  peers: new Map(),
};

const ui = {
  connectionStatus: document.getElementById("connectionStatus"),
  notice: document.getElementById("notice"),
  appRoot: document.getElementById("appRoot"),
  connectionPanel: document.getElementById("connectionPanel"),
  hostCard: document.getElementById("hostCard"),
  joinCard: document.getElementById("joinCard"),
  lobbyPanel: document.getElementById("lobbyPanel"),
  hostControls: document.getElementById("hostControls"),
  gamePanel: document.getElementById("gamePanel"),
  hostName: document.getElementById("hostName"),
  hostGame: document.getElementById("hostGame"),
  hostInviteLink: document.getElementById("hostInviteLink"),
  inviteRow: document.getElementById("inviteRow"),
  copyInvite: document.getElementById("copyInvite"),
  joinName: document.getElementById("joinName"),
  joinCode: document.getElementById("joinCode"),
  joinGame: document.getElementById("joinGame"),
  playerList: document.getElementById("playerList"),
  startGame: document.getElementById("startGame"),
  tableArea: document.getElementById("tableArea"),
  handArea: document.getElementById("handArea"),
  actionArea: document.getElementById("actionArea"),
  actionsPanel: document.getElementById("actionsPanel"),
  logArea: document.getElementById("logArea"),
  turnLabel: document.getElementById("turnLabel"),
  playsLeft: document.getElementById("playsLeft"),
  handTurnIndicator: document.getElementById("handTurnIndicator"),
  endTurn: document.getElementById("endTurn"),
  discardExtras: document.getElementById("discardExtras"),
  modal: document.getElementById("modal"),
  modalTitle: document.getElementById("modalTitle"),
  modalBody: document.getElementById("modalBody"),
  modalCancel: document.getElementById("modalCancel"),
  modalConfirm: document.getElementById("modalConfirm"),
  resultOverlay: document.getElementById("resultOverlay"),
  resultCard: document.getElementById("resultCard"),
  resultTitle: document.getElementById("resultTitle"),
  resultSubtitle: document.getElementById("resultSubtitle"),
  resultClose: document.getElementById("resultClose"),
};

let resultTimer = null;

const PROPERTY_SETS = {
  brown: { label: "Brown", size: 2, rent: [1, 2], value: 1 },
  lightBlue: { label: "Light Blue", size: 3, rent: [1, 2, 3], value: 1 },
  pink: { label: "Pink", size: 3, rent: [1, 2, 4], value: 2 },
  orange: { label: "Orange", size: 3, rent: [1, 3, 5], value: 2 },
  red: { label: "Red", size: 3, rent: [2, 3, 6], value: 3 },
  yellow: { label: "Yellow", size: 3, rent: [2, 4, 6], value: 3 },
  green: { label: "Green", size: 3, rent: [2, 4, 7], value: 4 },
  darkBlue: { label: "Dark Blue", size: 2, rent: [3, 8], value: 4 },
  railroads: { label: "Railroads", size: 4, rent: [1, 2, 3, 4], value: 2 },
  utilities: { label: "Utilities", size: 2, rent: [1, 2], value: 2 },
};

const PROPERTY_COLOR_HEX = {
  brown: "#8c5a3c",
  lightBlue: "#8dc6e9",
  pink: "#d670ad",
  orange: "#f28c2d",
  red: "#cf2f2f",
  yellow: "#f2d23c",
  green: "#2f8b57",
  darkBlue: "#2b3d8f",
  railroads: "#222222",
  utilities: "#8c8c8c",
};

const ACTION_VALUES = {
  "pass-go": 1,
  birthday: 2,
  "debt-collector": 3,
  rent: 1,
  "rent-any": 3,
  "double-rent": 1,
  "sly-deal": 3,
  "forced-deal": 3,
  "deal-breaker": 5,
  "just-say-no": 4,
  house: 3,
  hotel: 4,
};

let cardIdCounter = 1;

function createCard(base) {
  return { id: `c${cardIdCounter++}`, ...base };
}

function createDeck() {
  const deck = [];
  const addMoney = (value, count) => {
    for (let i = 0; i < count; i += 1) {
      deck.push(createCard({ type: "money", value, name: `$${value}M` }));
    }
  };
  addMoney(1, 6);
  addMoney(2, 5);
  addMoney(3, 3);
  addMoney(4, 3);
  addMoney(5, 2);
  addMoney(10, 1);

  const addProperty = (color, count) => {
    for (let i = 0; i < count; i += 1) {
      deck.push(
        createCard({
          type: "property",
          color,
          colors: [color],
          value: PROPERTY_SETS[color].value,
          name: PROPERTY_SETS[color].label,
        }),
      );
    }
  };

  addProperty("brown", 2);
  addProperty("lightBlue", 3);
  addProperty("pink", 3);
  addProperty("orange", 3);
  addProperty("red", 3);
  addProperty("yellow", 3);
  addProperty("green", 3);
  addProperty("darkBlue", 2);
  addProperty("railroads", 4);
  addProperty("utilities", 2);

  const addWild = (colors, count, value = 2) => {
    for (let i = 0; i < count; i += 1) {
      deck.push(
        createCard({
          type: "wild",
          colors,
          value,
          name: `${colors.map((c) => PROPERTY_SETS[c].label).join(" / ")}`,
        }),
      );
    }
  };

  addWild(["brown", "lightBlue"], 2, 1);
  addWild(["pink", "orange"], 2, 2);
  addWild(["red", "yellow"], 2, 3);
  addWild(["green", "darkBlue"], 2, 4);
  addWild(["railroads", "utilities"], 2, 2);
  addWild(Object.keys(PROPERTY_SETS), 2, 3);

  const addAction = (action, count) => {
    for (let i = 0; i < count; i += 1) {
      deck.push(
        createCard({
          type: "action",
          action,
          value: ACTION_VALUES[action],
          name: formatActionName(action),
        }),
      );
    }
  };

  addAction("pass-go", 10);
  addAction("birthday", 3);
  addAction("debt-collector", 3);
  addAction("double-rent", 2);
  addAction("sly-deal", 3);
  addAction("forced-deal", 3);
  addAction("deal-breaker", 2);
  addAction("just-say-no", 3);
  addAction("house", 3);
  addAction("hotel", 2);

  const addRent = (colors, count, action = "rent") => {
    for (let i = 0; i < count; i += 1) {
      deck.push(
        createCard({
          type: "rent",
          action,
          colors,
          value: ACTION_VALUES[action],
          name: `${action === "rent-any" ? "Wild Rent" : "Rent"} (${colors
            .map((c) => PROPERTY_SETS[c].label)
            .join(" / ")})`,
        }),
      );
    }
  };

  addRent(["brown", "lightBlue"], 2);
  addRent(["pink", "orange"], 2);
  addRent(["red", "yellow"], 2);
  addRent(["green", "darkBlue"], 2);
  addRent(["railroads", "utilities"], 2);
  addRent(Object.keys(PROPERTY_SETS), 3, "rent-any");

  return deck;
}

function formatActionName(action) {
  return action
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function shuffle(cards) {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function createPlayer(name) {
  return {
    id: `p${Math.random().toString(36).slice(2, 9)}`,
    name,
    hand: [],
    bank: [],
    properties: {},
    buildings: {},
  };
}

function initialGame(hostPlayer) {
  return {
    phase: "lobby",
    players: [hostPlayer],
    deck: shuffle(createDeck()),
    discard: [],
    currentPlayerId: null,
    turn: { playsLeft: 0, rentMultiplier: 1, drew: false },
    pending: null,
    winnerId: null,
    log: ["Game created."],
  };
}

function getPlayer(game, playerId) {
  return game.players.find((player) => player.id === playerId);
}

function logGame(game, message) {
  game.log.unshift(message);
  if (game.log.length > 50) {
    game.log.pop();
  }
}

function drawCards(game, playerId, count) {
  const player = getPlayer(game, playerId);
  for (let i = 0; i < count; i += 1) {
    if (game.deck.length === 0) {
      game.deck = shuffle(game.discard);
      game.discard = [];
    }
    const card = game.deck.shift();
    if (card) {
      player.hand.push(card);
    }
  }
}

function ensureSet(game, playerId, color) {
  const player = getPlayer(game, playerId);
  if (!player.properties[color]) {
    player.properties[color] = [];
  }
  return player.properties[color];
}

function currentPlayer(game) {
  return getPlayer(game, game.currentPlayerId);
}

function completeSetCount(game, playerId) {
  const player = getPlayer(game, playerId);
  return Object.entries(player.properties).reduce((count, [color, cards]) => {
    const size = PROPERTY_SETS[color]?.size || 0;
    return count + (cards.length >= size ? 1 : 0);
  }, 0);
}

function checkWin(game) {
  for (const player of game.players) {
    if (completeSetCount(game, player.id) >= 3) {
      game.phase = "ended";
      game.winnerId = player.id;
      logGame(game, `${player.name} wins with 3 complete sets!`);
      return player;
    }
  }
  return null;
}

function startTurn(game, playerId) {
  game.currentPlayerId = playerId;
  game.turn = { playsLeft: 3, rentMultiplier: 1, drew: true };
  drawCards(game, playerId, 2);
  logGame(game, `${getPlayer(game, playerId).name} draws 2 cards.`);
}

function advanceTurn(game) {
  const currentIndex = game.players.findIndex(
    (player) => player.id === game.currentPlayerId,
  );
  const nextIndex = (currentIndex + 1) % game.players.length;
  startTurn(game, game.players[nextIndex].id);
}

function getRentForSet(game, playerId, color) {
  const set = ensureSet(game, playerId, color);
  const definition = PROPERTY_SETS[color];
  if (!definition) return 0;
  const base =
    definition.rent[Math.min(set.length, definition.rent.length) - 1] || 0;
  const hasHouse = game.players
    .find((player) => player.id === playerId)
    .buildings[color]?.house;
  const hasHotel = game.players
    .find((player) => player.id === playerId)
    .buildings[color]?.hotel;
  return base + (hasHouse ? 3 : 0) + (hasHotel ? 4 : 0);
}

function findCard(player, cardId) {
  return player.hand.find((card) => card.id === cardId);
}

function removeCardFromHand(player, cardId) {
  const index = player.hand.findIndex((card) => card.id === cardId);
  if (index >= 0) {
    return player.hand.splice(index, 1)[0];
  }
  return null;
}

function removeCardFromSet(player, cardId) {
  for (const [color, cards] of Object.entries(player.properties)) {
    const index = cards.findIndex((card) => card.id === cardId);
    if (index >= 0) {
      const [card] = cards.splice(index, 1);
      if (cards.length === 0) {
        delete player.properties[color];
      }
      return { card, color };
    }
  }
  return null;
}

function addToBank(player, card) {
  player.bank.push(card);
}

function addPropertyCard(player, card, color) {
  const set = player.properties[color] || [];
  set.push({ ...card, assignedColor: color });
  player.properties[color] = set;
}

function assignProperty(game, playerId, card, color) {
  addPropertyCard(getPlayer(game, playerId), card, color);
}

function actionRequiresResponse(action) {
  return [
    "debt-collector",
    "birthday",
    "rent",
    "rent-any",
    "sly-deal",
    "forced-deal",
    "deal-breaker",
  ].includes(action.actionType);
}

function setPendingResponse(game, action, targetId) {
  const eligibleResponders = targetId
    ? [targetId]
    : game.players.filter((player) => player.id !== action.playerId).map((player) => player.id);
  game.pending = {
    type: "response",
    action,
    targetId: targetId || null,
    responderId: targetId || null,
    eligibleResponders,
    jsnChain: [],
  };
}

function resolveActionAfterResponse(game, action) {
  if (action.actionType === "pass-go") {
    drawCards(game, action.playerId, 2);
    logGame(game, `${getPlayer(game, action.playerId).name} plays Pass Go.`);
    return;
  }

  if (action.actionType === "double-rent") {
    game.turn.rentMultiplier *= 2;
    logGame(game, `${getPlayer(game, action.playerId).name} doubles rent.`);
    return;
  }

  if (action.actionType === "house") {
    const player = getPlayer(game, action.playerId);
    player.buildings[action.color] = {
      ...player.buildings[action.color],
      house: true,
    };
    logGame(game, `${player.name} adds a house to ${action.color}.`);
    return;
  }

  if (action.actionType === "hotel") {
    const player = getPlayer(game, action.playerId);
    player.buildings[action.color] = {
      ...player.buildings[action.color],
      hotel: true,
    };
    logGame(game, `${player.name} adds a hotel to ${action.color}.`);
    return;
  }

  if (action.actionType === "birthday") {
    game.pending = {
      type: "payment",
      fromIds: game.players
        .filter((player) => player.id !== action.playerId)
        .map((player) => player.id),
      toId: action.playerId,
      amount: 2,
      reason: "Birthday",
      currentIndex: 0,
    };
    return;
  }

  if (action.actionType === "debt-collector") {
    game.pending = {
      type: "payment",
      fromIds: [action.targetId],
      toId: action.playerId,
      amount: 5,
      reason: "Debt Collector",
      currentIndex: 0,
    };
    return;
  }

  if (action.actionType === "rent" || action.actionType === "rent-any") {
    const rent = getRentForSet(game, action.playerId, action.color);
    const amount = rent * game.turn.rentMultiplier;
    game.turn.rentMultiplier = 1;
    game.pending = {
      type: "payment",
      fromIds: [action.targetId],
      toId: action.playerId,
      amount,
      reason: `Rent (${PROPERTY_SETS[action.color].label})`,
      currentIndex: 0,
    };
    return;
  }

  if (action.actionType === "sly-deal") {
    const target = getPlayer(game, action.targetId);
    const selection = removeCardFromSet(target, action.propertyId);
    if (selection) {
      addPropertyCard(
        getPlayer(game, action.playerId),
        selection.card,
        selection.card.assignedColor || selection.color,
      );
      logGame(
        game,
        `${getPlayer(game, action.playerId).name} steals a property from ${
          target.name
        }.`,
      );
    }
    return;
  }

  if (action.actionType === "forced-deal") {
    const player = getPlayer(game, action.playerId);
    const target = getPlayer(game, action.targetId);
    const playerPick = removeCardFromSet(player, action.playerCardId);
    const targetPick = removeCardFromSet(target, action.targetCardId);
    if (playerPick && targetPick) {
      addPropertyCard(
        player,
        targetPick.card,
        targetPick.card.assignedColor || targetPick.color,
      );
      addPropertyCard(
        target,
        playerPick.card,
        playerPick.card.assignedColor || playerPick.color,
      );
      logGame(game, `${player.name} swaps properties with ${target.name}.`);
    }
    return;
  }

  if (action.actionType === "deal-breaker") {
    const target = getPlayer(game, action.targetId);
    const setCards = target.properties[action.color] || [];
    delete target.properties[action.color];
    const player = getPlayer(game, action.playerId);
    player.properties[action.color] = setCards;
    logGame(
      game,
      `${player.name} takes a full set from ${target.name}.`,
    );
  }
}

function playCardAction(game, action) {
  const player = getPlayer(game, action.playerId);
  if (!player || game.phase !== "playing") return;
  if (game.pending) return;
  if (game.currentPlayerId !== action.playerId) return;
  if (game.turn.playsLeft <= 0) return;

  const card = removeCardFromHand(player, action.cardId);
  if (!card) return;

  if (action.playAs === "bank") {
    addToBank(player, card);
    logGame(game, `${player.name} banks ${card.name}.`);
    game.turn.playsLeft -= 1;
    return;
  }

  if (action.playAs === "property") {
    assignProperty(game, action.playerId, card, action.color);
    logGame(game, `${player.name} adds ${card.name} to a set.`);
    game.turn.playsLeft -= 1;
    return;
  }

  if (action.playAs === "action") {
    if (card.action === "just-say-no") {
      player.hand.push(card);
      return;
    }
    game.discard.push(card);
    game.turn.playsLeft -= 1;
    const resolvedAction = { ...action, actionType: card.action || card.actionType };
    if (card.type === "rent") {
      resolvedAction.actionType = card.action;
    }
    if (actionRequiresResponse(resolvedAction)) {
      setPendingResponse(game, resolvedAction, action.targetId);
      return;
    }
    resolveActionAfterResponse(game, resolvedAction);
  }
}

function applyResponse(game, response) {
  if (!game.pending || game.pending.type !== "response") return;
  const pending = game.pending;
  if (pending.responderId && response.playerId !== pending.responderId) return;
  if (!pending.responderId && !pending.eligibleResponders.includes(response.playerId)) return;
  if (!pending.responderId) {
    pending.responderId = response.playerId;
    pending.targetId = response.playerId;
  }
  const responder = getPlayer(game, pending.responderId);
  if (!responder) return;

  if (response.response === "no-jsn") {
    if (pending.responderId === pending.targetId) {
      game.pending = null;
      resolveActionAfterResponse(game, pending.action);
      return;
    }
    if (pending.responderId === pending.action.playerId) {
      logGame(game, `${getPlayer(game, pending.action.playerId).name}'s action is canceled.`);
      if (pending.action.actionType === "rent" || pending.action.actionType === "rent-any") {
        game.turn.rentMultiplier = 1;
      }
      game.pending = null;
    }
    return;
  }

  if (response.response === "play-jsn") {
    const card = removeCardFromHand(responder, response.cardId);
    if (!card || card.action !== "just-say-no") return;
    game.discard.push(card);
    pending.jsnChain.push(responder.id);
    if (pending.responderId === pending.targetId) {
      pending.responderId = pending.action.playerId;
      pending.eligibleResponders = [pending.action.playerId];
    } else {
      pending.responderId = pending.targetId;
      pending.eligibleResponders = [pending.targetId];
    }
    logGame(game, `${responder.name} plays Just Say No.`);
  }
}

function applyPaymentResponse(game, response) {
  if (!game.pending || game.pending.type !== "payment") return;
  const pending = game.pending;
  const fromId = pending.fromIds[pending.currentIndex];
  if (response.playerId !== fromId) return;

  const fromPlayer = getPlayer(game, fromId);
  const toPlayer = getPlayer(game, pending.toId);
  const total = response.cards.reduce((sum, item) => sum + item.value, 0);
  const availableCount =
    fromPlayer.bank.length +
    Object.values(fromPlayer.properties).reduce((sum, cards) => sum + cards.length, 0);
  if (total < pending.amount && response.cards.length < availableCount) return;

  response.cards.forEach((item) => {
    if (item.source === "bank") {
      const index = fromPlayer.bank.findIndex((card) => card.id === item.cardId);
      if (index >= 0) {
        const [card] = fromPlayer.bank.splice(index, 1);
        toPlayer.bank.push(card);
      }
    } else if (item.source === "property") {
      const removed = removeCardFromSet(fromPlayer, item.cardId);
      if (removed) {
        addPropertyCard(
          toPlayer,
          removed.card,
          removed.card.assignedColor || removed.color,
        );
      }
    }
  });

  logGame(
    game,
    `${fromPlayer.name} pays ${pending.amount}M to ${toPlayer.name}.`,
  );

  pending.currentIndex += 1;
  if (pending.currentIndex >= pending.fromIds.length) {
    game.pending = null;
    checkWin(game);
  }
}

function applyDiscardResponse(game, response) {
  if (!game.pending || game.pending.type !== "discard") return;
  if (response.playerId !== game.pending.playerId) return;

  const player = getPlayer(game, response.playerId);
  if (player.hand.length - response.cardIds.length > 7) return;
  response.cardIds.forEach((cardId) => {
    const card = removeCardFromHand(player, cardId);
    if (card) {
      game.discard.push(card);
    }
  });
  game.pending = null;
  logGame(game, `${player.name} discards down to 7 cards.`);
  advanceTurn(game);
}

function endTurn(game, playerId) {
  if (game.pending) return;
  if (game.currentPlayerId !== playerId) return;
  const player = getPlayer(game, playerId);
  if (player.hand.length > 7) {
    game.pending = { type: "discard", playerId };
    return;
  }
  advanceTurn(game);
}

function applyAction(game, action) {
  if (action.type === "play-card") {
    playCardAction(game, action);
    checkWin(game);
    return;
  }
  if (action.type === "end-turn") {
    endTurn(game, action.playerId);
    return;
  }
  if (action.type === "respond") {
    if (action.responseType === "payment") {
      applyPaymentResponse(game, action);
    } else if (action.responseType === "discard") {
      applyDiscardResponse(game, action);
    } else {
      applyResponse(game, action);
    }
    return;
  }
  if (action.type === "move-wild") {
    if (game.currentPlayerId !== action.playerId || game.pending) return;
    const player = getPlayer(game, action.playerId);
    const removed = removeCardFromSet(player, action.cardId);
    if (removed) {
      addPropertyCard(player, removed.card, action.newColor);
      logGame(game, `${player.name} reassigns a wild card.`);
      checkWin(game);
    }
  }
}

function setStatus(text) {
  ui.connectionStatus.textContent = text;
}

function showPanel(panel) {
  ui.connectionPanel.hidden = !state.isHost && !!state.playerId;
  ui.lobbyPanel.hidden = panel !== "lobby";
  ui.gamePanel.hidden = panel !== "game";
}

function updateLobbyView() {
  if (!state.viewGame) return;
  ui.hostControls.hidden = !state.isHost;
  const lobbySubtitle = ui.lobbyPanel.querySelector(".panel-header p");
  if (lobbySubtitle) {
    lobbySubtitle.textContent = state.isHost
      ? "Wait for everyone to connect, then start the game."
      : "Waiting for the host to start the game.";
  }
  ui.playerList.innerHTML = "";
  state.viewGame.players.forEach((player) => {
    const li = document.createElement("li");
    li.className = "player-pill";
    li.textContent = player.name;
    if (player.id === state.playerId) {
      const span = document.createElement("span");
      span.textContent = "You";
      li.appendChild(span);
    }
    ui.playerList.appendChild(li);
  });
  ui.startGame.disabled = !state.isHost || state.viewGame.players.length < 2;
}

function renderTable() {
  const game = state.viewGame;
  ui.tableArea.innerHTML = "";
  if (!game) return;
  game.players.forEach((player) => {
    const area = document.createElement("div");
    area.className = "player-area";
    if (player.id === game.currentPlayerId && game.phase === "playing") {
      area.classList.add("current-turn");
    }
    const header = document.createElement("div");
    header.className = "player-header";
    const name = document.createElement("strong");
    name.textContent = player.name;
    header.appendChild(name);
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent =
      player.id === game.currentPlayerId
        ? "Current Turn"
        : `Hand ${player.handCount ?? player.hand.length}`;
    header.appendChild(badge);
    area.appendChild(header);

    const bank = document.createElement("div");
    bank.className = "stack";
    bank.innerHTML = `<span class="label">Bank</span>`;
    const bankCards = document.createElement("div");
    bankCards.className = "card-strip";
    player.bank.forEach((card) => {
      bankCards.appendChild(makeMiniCard(card));
    });
    bank.appendChild(bankCards);
    area.appendChild(bank);

    const properties = document.createElement("div");
    properties.className = "stack";
    properties.innerHTML = `<span class="label">Properties</span>`;
    Object.entries(player.properties).forEach(([color, cards]) => {
      const set = document.createElement("div");
      set.className = "property-set";
      const label = PROPERTY_SETS[color]?.label || color;
      const building = player.buildings?.[color];
      const heading = document.createElement("div");
      heading.className = "set-heading";
      const title = document.createElement("span");
      title.textContent = label;
      heading.appendChild(title);
      const addons = [];
      if (building?.house) addons.push("House");
      if (building?.hotel) addons.push("Hotel");
      if (addons.length) {
        const tag = document.createElement("span");
        tag.className = "set-addons";
        tag.textContent = addons.join(" + ");
        heading.appendChild(tag);
      }
      set.appendChild(heading);
      const strip = document.createElement("div");
      strip.className = "card-strip";
      cards.forEach((card) => {
        strip.appendChild(makeMiniCard(card));
      });
      set.appendChild(strip);
      properties.appendChild(set);
    });
    area.appendChild(properties);
    ui.tableArea.appendChild(area);
  });
}

function makeMiniCard(card) {
  const mini = makeCardToken(card, { interactive: false });
  mini.classList.add("mini");
  return mini;
}

function renderHand() {
  const game = state.viewGame;
  ui.handArea.innerHTML = "";
  if (!game) return;
  const player = getPlayer(game, state.playerId);
  if (!player) return;
  player.hand.forEach((card) => {
    ui.handArea.appendChild(makeCardToken(card, { interactive: true }));
  });
}

function renderActions() {
  ui.actionArea.innerHTML = "";
  const game = state.viewGame;
  if (!game) return;
  const waiting =
    (game.pending?.type === "response" &&
      (game.pending.responderId === state.playerId ||
        (!game.pending.responderId &&
          game.pending.eligibleResponders?.includes(state.playerId)))) ||
    (game.pending?.type === "payment" &&
      game.pending.fromIds[game.pending.currentIndex] === state.playerId) ||
    (game.pending?.type === "discard" &&
      game.pending.playerId === state.playerId);
  ui.actionsPanel.classList.toggle("action-pulse", waiting);

  if (
    game.pending?.type === "response" &&
    (game.pending.responderId === state.playerId ||
      (!game.pending.responderId &&
        game.pending.eligibleResponders?.includes(state.playerId)))
  ) {
    const card = document.createElement("div");
    card.className = "note";
    card.textContent = "Respond with Just Say No or allow the action.";
    ui.actionArea.appendChild(card);
    const jsnCards = getPlayer(game, state.playerId).hand.filter(
      (item) => item.action === "just-say-no",
    );
    if (jsnCards.length === 0) {
      requestAnimationFrame(() => {
        sendAction({
          type: "respond",
          responseType: "jsn",
          response: "no-jsn",
          playerId: state.playerId,
        });
      });
      return;
    }
    jsnCards.forEach((jsn) => {
      const btn = document.createElement("button");
      btn.className = "ghost";
      btn.textContent = `Play ${jsn.name}`;
      btn.onclick = () =>
        sendAction({
          type: "respond",
          responseType: "jsn",
          response: "play-jsn",
          cardId: jsn.id,
          playerId: state.playerId,
        });
      ui.actionArea.appendChild(btn);
    });
    return;
  }

  if (game.pending?.type === "payment") {
    const pendingId = game.pending.fromIds[game.pending.currentIndex];
    if (pendingId === state.playerId) {
      const btn = document.createElement("button");
      btn.className = "primary";
      btn.textContent = `Pay ${game.pending.amount}M (${game.pending.reason})`;
      btn.onclick = () => openPaymentModal(game);
      ui.actionArea.appendChild(btn);
      return;
    }
  }

  if (game.pending?.type === "discard" && game.pending.playerId === state.playerId) {
    const btn = document.createElement("button");
    btn.className = "primary";
    btn.textContent = "Discard to 7";
    btn.onclick = () => openDiscardModal(game);
    ui.actionArea.appendChild(btn);
    return;
  }

  if (game.currentPlayerId === state.playerId && game.phase === "playing") {
    const hint = document.createElement("div");
    hint.className = "note";
    hint.textContent = "Play up to three cards this turn.";
    ui.actionArea.appendChild(hint);
    const reorder = document.createElement("button");
    reorder.className = "ghost";
    reorder.textContent = "Reassign Wild Card";
    reorder.onclick = () => openWildModal(game);
    ui.actionArea.appendChild(reorder);
  }
}

function renderLog() {
  ui.logArea.innerHTML = "";
  const game = state.viewGame;
  if (!game) return;
  game.log.forEach((line) => {
    const div = document.createElement("div");
    div.className = "log-line";
    div.textContent = line;
    ui.logArea.appendChild(div);
  });
}

function updateTurnInfo() {
  const game = state.viewGame;
  if (!game) {
    ui.handTurnIndicator.classList.remove("show");
    ui.endTurn.hidden = true;
    return;
  }
  const current = getPlayer(game, game.currentPlayerId);
  ui.turnLabel.textContent =
    game.phase === "ended"
      ? "Game over"
      : current
        ? `Turn: ${current.name}`
        : "Waiting for host...";
  ui.playsLeft.textContent = `Plays: ${game.turn?.playsLeft ?? 0}`;
  const isYourTurn =
    game.phase === "playing" &&
    game.currentPlayerId === state.playerId &&
    !game.pending;
  const shouldShowTurnChip = isYourTurn && game.currentPlayerId === state.playerId;
  ui.handTurnIndicator.classList.toggle("show", shouldShowTurnChip);
  ui.endTurn.hidden = !shouldShowTurnChip;
  ui.endTurn.disabled =
    !game ||
    game.phase !== "playing" ||
    game.currentPlayerId !== state.playerId ||
    game.pending;
  ui.discardExtras.disabled = !(
    game.pending?.type === "discard" && game.pending.playerId === state.playerId
  );
}

function updateResultOverlay() {
  const game = state.viewGame;
  if (!game || game.phase !== "ended") {
    ui.resultOverlay.hidden = true;
    return;
  }
  const winner = game.players.find((player) => player.id === game.winnerId);
  const isWinner = game.winnerId === state.playerId;
  ui.resultCard.classList.toggle("win", isWinner);
  ui.resultCard.classList.toggle("lose", !isWinner);
  ui.resultTitle.textContent = isWinner ? "You Win!" : "You Lose";
  ui.resultSubtitle.textContent = isWinner
    ? "You completed three full sets first."
    : `${winner?.name || "Another player"} completed three full sets first.`;
  ui.resultOverlay.hidden = false;
  if (resultTimer) {
    clearTimeout(resultTimer);
  }
  resultTimer = setTimeout(() => {
    ui.resultOverlay.hidden = true;
  }, 4000);
  if (isWinner) {
    launchConfetti();
  }
}

function render() {
  if (!state.viewGame) return;
  ui.appRoot.classList.toggle("in-game", state.viewGame.phase === "playing");
  showPanel(state.viewGame.phase === "lobby" ? "lobby" : "game");
  if (state.viewGame.phase === "playing") {
    const gamePanel = ui.gamePanel;
    const connectionPanel = ui.connectionPanel;
    const lobbyPanel = ui.lobbyPanel;
    const handCard = gamePanel.querySelector(".hand-card");
    if (ui.actionsPanel) {
      ui.appRoot.insertBefore(ui.actionsPanel, ui.appRoot.firstChild);
    }
    if (handCard) {
      ui.appRoot.insertBefore(handCard, ui.actionsPanel?.nextSibling || gamePanel);
    }
    ui.appRoot.appendChild(gamePanel);
    ui.appRoot.appendChild(connectionPanel);
    ui.appRoot.appendChild(lobbyPanel);
  } else {
    if (ui.actionsPanel && !ui.gamePanel.contains(ui.actionsPanel)) {
      ui.gamePanel.querySelector(".sidebar")?.prepend(ui.actionsPanel);
    }
    const handCard = ui.appRoot.querySelector(".hand-card");
    if (handCard && !ui.gamePanel.contains(handCard)) {
      ui.gamePanel.appendChild(handCard);
    }
  }
  ui.hostCard.hidden = !state.isHost;
  ui.joinCard.hidden = state.isHost || !!state.playerId;
  if (!state.isHost) {
    ui.inviteRow.hidden = true;
  }
  updateLobbyView();
  renderTable();
  renderHand();
  renderActions();
  renderLog();
  updateTurnInfo();
  updateResultOverlay();
}

function makeCardToken(card, options = {}) {
  const { interactive = false } = options;
  const cardEl = document.createElement("div");
  cardEl.className = `card-token ${card.type}`;
  const frame = document.createElement("div");
  frame.className = "card-frame";
  cardEl.appendChild(frame);

  const top = document.createElement("div");
  top.className = "card-top";
  frame.appendChild(top);

  const typeLabel = document.createElement("div");
  typeLabel.className = "card-type";
  typeLabel.textContent =
    card.type === "money"
      ? "Money"
      : card.type === "rent"
        ? "Action Card"
        : card.type === "action"
          ? "Action Card"
          : card.type === "wild"
            ? "Property"
            : "Property";
  top.appendChild(typeLabel);

  const coin = document.createElement("div");
  coin.className = "card-coin";
  coin.textContent = `${card.value}M`;
  top.appendChild(coin);

  if (card.type === "property" || card.type === "wild") {
    const banner = document.createElement("div");
    banner.className = "card-banner";
    const colors = card.colors || [card.color];
    const background = makeColorGradient(colors);
    banner.style.background = background;
    if (isDarkPalette(colors)) {
      banner.classList.add("dark");
    }
    banner.textContent =
      card.type === "wild" ? "Property Wild Card" : card.name;
    frame.appendChild(banner);
    const rentTable = buildRentTable(card, colors);
    if (rentTable) {
      frame.appendChild(rentTable);
    }
  }

  if (card.type === "action" || card.type === "rent") {
    const emblem = document.createElement("div");
    emblem.className = "card-emblem";
    emblem.textContent = card.type === "rent" ? "Rent" : formatActionName(card.action);
    frame.appendChild(emblem);
    if (card.type === "rent") {
      const stripe = document.createElement("div");
      stripe.className = "rent-stripe";
      stripe.style.background = makeRentStripe(card.colors);
      frame.appendChild(stripe);
    }
  }

  if (card.type === "money") {
    const banner = document.createElement("div");
    banner.className = "card-banner";
    banner.style.background = "#e3f2d7";
    banner.textContent = `${card.value}M`;
    frame.appendChild(banner);
  }

  const footer = document.createElement("div");
  footer.className = "card-footer";
  footer.textContent =
    card.type === "action"
      ? "Play into center to use."
      : card.type === "rent"
        ? "Collect rent for owned properties."
        : card.type === "money"
          ? "Bank to pay debts."
          : "Play into your property area.";
  frame.appendChild(footer);

  if (
    interactive &&
    state.viewGame.phase === "playing" &&
    state.viewGame.currentPlayerId === state.playerId &&
    !state.viewGame.pending &&
    state.viewGame.turn?.playsLeft > 0
  ) {
    const actions = document.createElement("div");
    actions.className = "hand-actions";
    const bankBtn = document.createElement("button");
    bankBtn.className = "ghost";
    bankBtn.textContent = "Bank";
    bankBtn.onclick = () => sendPlay(card, "bank");
    actions.appendChild(bankBtn);

    if (card.type === "property" || card.type === "wild") {
      const propBtn = document.createElement("button");
      propBtn.className = "ghost";
      propBtn.textContent = "Property";
      propBtn.onclick = () => sendPlay(card, "property");
      actions.appendChild(propBtn);
    }

    if (
      (card.type === "action" && card.action !== "just-say-no") ||
      card.type === "rent"
    ) {
      const actionBtn = document.createElement("button");
      actionBtn.className = "ghost";
      actionBtn.textContent = "Play";
      actionBtn.onclick = () => sendPlay(card, "action");
      actions.appendChild(actionBtn);
    }

    cardEl.appendChild(actions);
  }

  return cardEl;
}

function makeColorGradient(colors) {
  const palette = colors
    .map((color) => PROPERTY_COLOR_HEX[color] || "#d7d7d7");
  if (palette.length === 1) return palette[0];
  return `linear-gradient(90deg, ${palette[0]} 0%, ${palette[0]} 50%, ${palette[1]} 50%, ${palette[1]} 100%)`;
}

function makeRentStripe(colors = []) {
  const palette = colors.map((color) => PROPERTY_COLOR_HEX[color] || "#d7d7d7");
  if (palette.length === 0) return "#d7d7d7";
  const step = 100 / palette.length;
  const stops = palette
    .map((color, index) => {
      const start = (step * index).toFixed(2);
      const end = (step * (index + 1)).toFixed(2);
      return `${color} ${start}%, ${color} ${end}%`;
    })
    .join(", ");
  return `linear-gradient(90deg, ${stops})`;
}

function isDarkPalette(colors) {
  const palette = colors
    .map((color) => PROPERTY_COLOR_HEX[color] || "#d7d7d7");
  const avg = palette.reduce((sum, hex) => sum + luminance(hex), 0) / palette.length;
  return avg < 0.5;
}

function luminance(hex) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function buildRentTable(card, colors) {
  if (!colors || colors.length === 0) return null;
  const color = colors[0];
  const definition = PROPERTY_SETS[color];
  if (!definition) return null;
  const wrap = document.createElement("div");
  wrap.className = "rent-table";
  const title = document.createElement("div");
  title.className = "rent-title";
  title.textContent = "Rent";
  wrap.appendChild(title);
  const rows = document.createElement("div");
  rows.className = "rent-rows";
  definition.rent.forEach((value, index) => {
    const row = document.createElement("div");
    row.className = "rent-row";
    row.textContent = `${index + 1} • ${value}M${index + 1 >= definition.size ? " (Full set)" : ""}`;
    rows.appendChild(row);
  });
  wrap.appendChild(rows);
  return wrap;
}

function sendPlay(card, playAs) {
  if (playAs === "property") {
    if (card.colors && card.colors.length > 1) {
      openSelectModal(
        "Choose Property Set",
        card.colors.map((color) => ({
          label: PROPERTY_SETS[color].label,
          value: color,
        })),
        (color) =>
          sendAction({
            type: "play-card",
            playerId: state.playerId,
            cardId: card.id,
            playAs,
            color,
          }),
      );
      return;
    }
    sendAction({
      type: "play-card",
      playerId: state.playerId,
      cardId: card.id,
      playAs,
      color: card.color || card.colors?.[0],
    });
    return;
  }

  if (playAs === "action") {
    const actionType = card.action || card.actionType;
    if (actionType === "debt-collector") {
      return openTargetModal(card, (targetId) =>
        sendAction({
          type: "play-card",
          playerId: state.playerId,
          cardId: card.id,
          playAs,
          actionType,
          targetId,
        }),
      );
    }
    if (actionType === "birthday") {
      return sendAction({
        type: "play-card",
        playerId: state.playerId,
        cardId: card.id,
        playAs,
        actionType,
      });
    }
    if (actionType === "pass-go" || actionType === "double-rent") {
      return sendAction({
        type: "play-card",
        playerId: state.playerId,
        cardId: card.id,
        playAs,
        actionType,
      });
    }
    if (actionType === "house" || actionType === "hotel") {
      return openSetModal(actionType, (color) =>
        sendAction({
          type: "play-card",
          playerId: state.playerId,
          cardId: card.id,
          playAs,
          actionType,
          color,
        }),
      );
    }
    if (actionType === "sly-deal") {
      return openSlyDealModal((targetId, cardId) =>
        sendAction({
          type: "play-card",
          playerId: state.playerId,
          cardId: card.id,
          playAs,
          actionType,
          targetId,
          propertyId: cardId,
        }),
      );
    }
    if (actionType === "forced-deal") {
      return openForcedDealModal((targetId, yourCardId, targetCardId) =>
        sendAction({
          type: "play-card",
          playerId: state.playerId,
          cardId: card.id,
          playAs,
          actionType,
          targetId,
          playerCardId: yourCardId,
          targetCardId,
        }),
      );
    }
    if (actionType === "deal-breaker") {
      return openDealBreakerModal((targetId, color) =>
        sendAction({
          type: "play-card",
          playerId: state.playerId,
          cardId: card.id,
          playAs,
          actionType,
          targetId,
          color,
        }),
      );
    }
  }

  if (card.type === "rent") {
    return openRentModal(card, (color, targetId) =>
      sendAction({
        type: "play-card",
        playerId: state.playerId,
        cardId: card.id,
        playAs,
        actionType: card.action,
        color,
        targetId,
      }),
    );
  }

  sendAction({
    type: "play-card",
    playerId: state.playerId,
    cardId: card.id,
    playAs,
    actionType: card.action,
  });
}

function openModal(title, body, onConfirm, onCancel) {
  ui.modalTitle.textContent = title;
  ui.modalBody.innerHTML = "";
  ui.modalBody.appendChild(body);
  ui.modal.hidden = false;
  ui.modalConfirm.onclick = () => {
    ui.modal.hidden = true;
    onConfirm?.();
  };
  ui.modalCancel.onclick = () => {
    ui.modal.hidden = true;
    onCancel?.();
  };
}

let noticeTimer = null;

function showNotice(message) {
  ui.notice.textContent = message;
  ui.notice.hidden = false;
  if (noticeTimer) {
    clearTimeout(noticeTimer);
  }
  noticeTimer = setTimeout(() => {
    ui.notice.hidden = true;
  }, 2500);
}

function openSelectModal(title, options, onConfirm) {
  let selected = options[0]?.value ?? null;
  const list = document.createElement("div");
  list.className = "select-list";
  options.forEach((option) => {
    const item = document.createElement("div");
    item.className = "select-item";
    item.textContent = option.label;
    item.onclick = () => {
      selected = option.value;
      Array.from(list.children).forEach((child) =>
        child.classList.remove("selected"),
      );
      item.classList.add("selected");
    };
    list.appendChild(item);
  });
  if (list.firstChild) list.firstChild.classList.add("selected");
  openModal(title, list, () => onConfirm(selected));
}

function openTargetModal(card, onConfirm) {
  const game = state.viewGame;
  const options = game.players
    .filter((player) => player.id !== state.playerId)
    .map((player) => ({ label: player.name, value: player.id }));
  if (options.length === 0) {
    const body = document.createElement("div");
    body.className = "note";
    body.textContent = "No other players available.";
    return openModal("No Targets", body);
  }
  openSelectModal(`Choose target for ${card.name}`, options, onConfirm);
}

function openRentModal(card, onConfirm) {
  const game = state.viewGame;
  const player = getPlayer(game, state.playerId);
  const ownedColors = Object.keys(player.properties).filter(
    (color) => player.properties[color].length > 0,
  );
  const availableColors = card.colors.filter((color) =>
    ownedColors.includes(color),
  );
  if (availableColors.length === 0) {
    const body = document.createElement("div");
    body.className = "note";
    body.textContent = "You do not own a matching property set for this rent card.";
    return openModal("No Valid Rent Set", body);
  }
  openSelectModal(
    "Choose rent set",
    availableColors.map((color) => ({
      label: PROPERTY_SETS[color].label,
      value: color,
    })),
    (color) => openTargetModal(card, (targetId) => onConfirm(color, targetId)),
  );
}

function openSetModal(actionType, onConfirm) {
  const game = state.viewGame;
  const player = getPlayer(game, state.playerId);
  const options = Object.entries(player.properties)
    .filter(([color, cards]) => cards.length >= PROPERTY_SETS[color].size)
    .filter(([color]) => {
      const building = player.buildings?.[color];
      return actionType === "house"
        ? !building?.house
        : building?.house && !building?.hotel;
    })
    .map(([color]) => ({
      label: PROPERTY_SETS[color].label,
      value: color,
    }));
  if (options.length === 0) {
    const body = document.createElement("div");
    body.className = "note";
    body.textContent = "No eligible sets available.";
    return openModal("No Eligible Sets", body);
  }
  openSelectModal(
    `Choose set for ${formatActionName(actionType)}`,
    options,
    onConfirm,
  );
}

function openSlyDealModal(onConfirm) {
  const game = state.viewGame;
  const targetOptions = [];
  game.players.forEach((player) => {
    if (player.id === state.playerId) return;
    Object.entries(player.properties).forEach(([color, cards]) => {
      if (cards.length >= PROPERTY_SETS[color].size) return;
      cards.forEach((card) => {
        targetOptions.push({
          label: `${player.name} • ${PROPERTY_SETS[color].label}`,
          value: { targetId: player.id, cardId: card.id },
        });
      });
    });
  });
  if (targetOptions.length === 0) {
    const body = document.createElement("div");
    body.className = "note";
    body.textContent = "No eligible properties to steal.";
    return openModal("No Eligible Properties", body);
  }
  openSelectModal("Choose a property to steal", targetOptions, (value) =>
    onConfirm(value.targetId, value.cardId),
  );
}

function openForcedDealModal(onConfirm) {
  const game = state.viewGame;
  const player = getPlayer(game, state.playerId);
  const yourOptions = [];
  Object.entries(player.properties).forEach(([color, cards]) => {
    if (cards.length >= PROPERTY_SETS[color].size) return;
    cards.forEach((card) => {
      yourOptions.push({
        label: `${PROPERTY_SETS[color].label}`,
        value: card.id,
      });
    });
  });
  if (yourOptions.length === 0) {
    const body = document.createElement("div");
    body.className = "note";
    body.textContent = "You have no eligible properties to trade.";
    return openModal("No Eligible Properties", body);
  }
  openSelectModal("Choose your property to trade", yourOptions, (yourCardId) => {
    const targetOptions = [];
    game.players.forEach((target) => {
      if (target.id === state.playerId) return;
      Object.entries(target.properties).forEach(([color, cards]) => {
        if (cards.length >= PROPERTY_SETS[color].size) return;
        cards.forEach((card) => {
          targetOptions.push({
            label: `${target.name} • ${PROPERTY_SETS[color].label}`,
            value: { targetId: target.id, cardId: card.id },
          });
        });
      });
    });
    if (targetOptions.length === 0) {
      const body = document.createElement("div");
      body.className = "note";
      body.textContent = "Opponents have no eligible properties to trade.";
      return openModal("No Eligible Properties", body);
    }
    openSelectModal("Choose target property", targetOptions, (value) =>
      onConfirm(value.targetId, yourCardId, value.cardId),
    );
  });
}

function openDealBreakerModal(onConfirm) {
  const game = state.viewGame;
  const options = [];
  game.players.forEach((player) => {
    if (player.id === state.playerId) return;
    Object.entries(player.properties).forEach(([color, cards]) => {
      if (cards.length >= PROPERTY_SETS[color].size) {
        options.push({
          label: `${player.name} • ${PROPERTY_SETS[color].label}`,
          value: { targetId: player.id, color },
        });
      }
    });
  });
  if (options.length === 0) {
    const body = document.createElement("div");
    body.className = "note";
    body.textContent = "No complete sets available to take.";
    return openModal("No Complete Sets", body);
  }
  openSelectModal("Choose set to take", options, (value) =>
    onConfirm(value.targetId, value.color),
  );
}

function openPaymentModal(game) {
  const player = getPlayer(game, state.playerId);
  const available = [
    ...player.bank.map((card) => ({
      label: `Bank • ${card.name} (${card.value}M)`,
      value: { cardId: card.id, value: card.value, source: "bank" },
    })),
    ...Object.entries(player.properties).flatMap(([color, cards]) =>
      cards.map((card) => ({
        label: `Property • ${PROPERTY_SETS[color].label} (${card.value}M)`,
        value: { cardId: card.id, value: card.value, source: "property" },
      })),
    ),
  ];
  const selected = new Set();
  const list = document.createElement("div");
  list.className = "select-list";
  available.forEach((option) => {
    const item = document.createElement("div");
    item.className = "select-item";
    item.textContent = option.label;
    item.onclick = () => {
      if (selected.has(option)) {
        selected.delete(option);
        item.classList.remove("selected");
      } else {
        selected.add(option);
        item.classList.add("selected");
      }
    };
    list.appendChild(item);
  });
  openModal(`Pay ${game.pending.amount}M`, list, () => {
    sendAction({
      type: "respond",
      responseType: "payment",
      playerId: state.playerId,
      cards: Array.from(selected).map((option) => option.value),
    });
  });
}

function openDiscardModal(game) {
  const player = getPlayer(game, state.playerId);
  const excess = player.hand.length - 7;
  const selected = new Set();
  const list = document.createElement("div");
  list.className = "select-list";
  player.hand.forEach((card) => {
    const item = document.createElement("div");
    item.className = "select-item";
    item.textContent = `${card.name} (${card.value}M)`;
    item.onclick = () => {
      if (selected.has(card.id)) {
        selected.delete(card.id);
        item.classList.remove("selected");
      } else {
        selected.add(card.id);
        item.classList.add("selected");
      }
    };
    list.appendChild(item);
  });
  openModal(`Discard ${excess} card(s)`, list, () => {
    sendAction({
      type: "respond",
      responseType: "discard",
      playerId: state.playerId,
      cardIds: Array.from(selected).slice(0, excess),
    });
  });
}

function openWildModal(game) {
  const player = getPlayer(game, state.playerId);
  const wilds = [];
  Object.entries(player.properties).forEach(([color, cards]) => {
    cards.forEach((card) => {
      if (card.colors && card.colors.length > 1) {
        wilds.push({ card, color });
      }
    });
  });
  if (wilds.length === 0) {
    const body = document.createElement("div");
    body.className = "note";
    body.textContent = "You have no wild cards in play.";
    return openModal("No Wild Cards", body);
  }
  const options = wilds.map((entry) => ({
    label: `${entry.card.name} (${PROPERTY_SETS[entry.color].label})`,
    value: entry,
  }));
  openSelectModal("Choose wild to reassign", options, (choice) => {
    const targets = choice.card.colors.filter((color) => color !== choice.color);
    openSelectModal(
      "Move to set",
      targets.map((color) => ({
        label: PROPERTY_SETS[color].label,
        value: color,
      })),
      (newColor) =>
        sendAction({
          type: "move-wild",
          playerId: state.playerId,
          cardId: choice.card.id,
          newColor,
        }),
    );
  });
}

function sendAction(action) {
  if (state.isHost) {
    applyAction(state.hostGame, action);
    broadcastState();
    return;
  }
  state.conn?.send(JSON.stringify({ type: "action", action }));
}

function createViewState(game, viewerId) {
  return {
    ...game,
    players: game.players.map((player) => {
      if (player.id === viewerId) return player;
      return { ...player, hand: [], handCount: player.hand.length };
    }),
  };
}

function broadcastState() {
  state.viewGame = createViewState(state.hostGame, state.playerId);
  render();
  state.peers.forEach((channel, playerId) => {
    const isOpen =
      typeof channel.open === "boolean" ? channel.open : channel.readyState === "open";
    if (isOpen) {
      const payload = {
        type: "state",
        game: createViewState(state.hostGame, playerId),
      };
      channel.send(JSON.stringify(payload));
    }
  });
}

function setupHost(name) {
  state.isHost = true;
  const player = createPlayer(name || "Host");
  state.playerId = player.id;
  state.playerName = player.name;
  state.hostGame = initialGame(player);
  state.viewGame = createViewState(state.hostGame, state.playerId);
  ui.hostInviteLink.href = "#";
  ui.hostInviteLink.textContent = "Invite link";
  ui.inviteRow.hidden = true;
  setStatus("Hosting...");
  showPanel("lobby");
  initializeHostPeer();
  render();
}

function initializeHostPeer() {
  const createPeerWithCode = (code) => {
    const peer = new Peer(code);
    state.peer = peer;
    state.hostId = code;
    peer.on("open", (id) => {
      const inviteUrl = buildInviteUrl(id);
      ui.hostInviteLink.href = inviteUrl;
      ui.hostInviteLink.textContent = inviteUrl;
      ui.inviteRow.hidden = false;
      setStatus("Hosting");
      copyInviteUrl(inviteUrl);
    });
    peer.on("connection", (conn) => {
      setupHostConnection(conn);
    });
    peer.on("error", () => {
      if (code.startsWith("deal-")) {
        createPeerWithCode(generateGameCode());
      } else {
        showNotice("Failed to create a host connection.");
      }
    });
  };
  createPeerWithCode(generateGameCode());
}

function setupHostConnection(conn) {
  conn.on("data", (data) => handleHostMessage(data, conn));
  conn.on("close", () => handleDisconnect(conn));
}

function handleHostMessage(data, conn) {
  const message = JSON.parse(data);
  if (message.type === "join-request") {
    const player = createPlayer(message.name);
    state.hostGame.players.push(player);
    conn.playerId = player.id;
    state.peers.set(player.id, conn);
    conn.send(
      JSON.stringify({
        type: "join-accept",
        playerId: player.id,
        game: createViewState(state.hostGame, player.id),
      }),
    );
    logGame(state.hostGame, `${player.name} joined the lobby.`);
    broadcastState();
  }
  if (message.type === "action") {
    if (conn.playerId !== message.action.playerId) return;
    applyAction(state.hostGame, message.action);
    broadcastState();
  }
}

function handleClientMessage(data) {
  const message = JSON.parse(data);
  if (message.type === "state") {
    state.viewGame = message.game;
    render();
    showPanel(message.game.phase === "lobby" ? "lobby" : "game");
    setStatus("Connected");
  }
  if (message.type === "join-accept") {
    state.playerId = message.playerId;
    if (!state.viewGame || state.viewGame.phase === "lobby") {
      state.viewGame = message.game;
      showPanel("lobby");
    }
    render();
    setStatus("Connected");
  }
}

function joinGame(code) {
  if (!code) {
    showNotice("Enter a host game code to join.");
    return;
  }
  const peer = new Peer();
  state.peer = peer;
  setStatus("Connecting...");
  peer.on("open", () => {
    const conn = peer.connect(code);
    state.conn = conn;
    conn.on("open", () => {
      conn.send(
        JSON.stringify({ type: "join-request", name: state.playerName || "Player" }),
      );
    });
    conn.on("data", (data) => handleClientMessage(data));
    conn.on("close", () => setStatus("Disconnected"));
    conn.on("error", () => setStatus("Connection error"));
  });
  peer.on("error", () => {
    showNotice("Unable to reach the host.");
    setStatus("Offline");
  });
}

function generateGameCode() {
  return `deal-${Math.random().toString(36).slice(2, 8)}`;
}

function buildInviteUrl(code) {
  const url = new URL(window.location.href);
  url.searchParams.set("game", code);
  return url.toString();
}

function handleDisconnect(conn) {
  if (!state.isHost || !conn.playerId || !state.hostGame) return;
  const playerIndex = state.hostGame.players.findIndex(
    (player) => player.id === conn.playerId,
  );
  if (playerIndex >= 0) {
    const [player] = state.hostGame.players.splice(playerIndex, 1);
    state.peers.delete(conn.playerId);
    logGame(state.hostGame, `${player.name} disconnected.`);
    broadcastState();
  }
}

ui.hostGame.onclick = () => setupHost(ui.hostName.value.trim());
ui.joinGame.onclick = () => {
  state.playerName = ui.joinName.value.trim() || "Player";
  joinGame(ui.joinCode.value.trim());
};

async function copyInviteUrl(inviteUrl) {
  if (!inviteUrl) return;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showNotice("Invite URL copied.");
      return;
    } catch {
      // Fall through to manual copy notice.
    }
  }
  showNotice("Select the invite URL and copy it manually.");
}

ui.copyInvite.onclick = () => {
  const inviteUrl = ui.hostInviteLink.href;
  if (!inviteUrl || ui.inviteRow.hidden) return;
  copyInviteUrl(inviteUrl);
};

ui.resultClose.onclick = () => {
  ui.resultOverlay.hidden = true;
};

function launchConfetti() {
  const existing = document.querySelector(".confetti");
  if (existing) {
    existing.remove();
  }
  const confetti = document.createElement("div");
  confetti.className = "confetti";
  const colors = ["#f2d23c", "#cf2f2f", "#2f8b57", "#8dc6e9", "#d670ad"];
  for (let i = 0; i < 28; i += 1) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty("--x", `${(Math.random() - 0.5) * 100}px`);
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.transform = `rotate(${Math.random() * 180}deg)`;
    confetti.appendChild(piece);
  }
  document.body.appendChild(confetti);
  setTimeout(() => {
    confetti.remove();
  }, 3200);
}

ui.startGame.onclick = () => {
  if (!state.isHost) return;
  state.hostGame.phase = "playing";
  state.hostGame.players.forEach((player) => drawCards(state.hostGame, player.id, 5));
  startTurn(state.hostGame, state.hostGame.players[0].id);
  broadcastState();
};

ui.endTurn.onclick = () => sendAction({ type: "end-turn", playerId: state.playerId });
ui.discardExtras.onclick = () => openDiscardModal(state.viewGame);

setStatus("Offline");
showPanel("connection");

const params = new URLSearchParams(window.location.search);
const gameCode = params.get("game");
if (gameCode) {
  ui.joinCode.value = gameCode;
  ui.hostCard.hidden = true;
  ui.joinCard.hidden = false;
} else {
  ui.hostCard.hidden = false;
  ui.joinCard.hidden = true;
}
ui.inviteRow.hidden = true;
