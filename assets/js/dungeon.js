const dungeonActivity = document.querySelector("#dungeonActivity");
const dungeonAction = document.querySelector("#dungeonAction");
const dungeonTime = document.querySelector("#dungeonTime");
const floorCount = document.querySelector("#floorCount");
const roomCount = document.querySelector("#roomCount");

let dungeon = {
    rating: 500,
    grade: "E",
    progress: {
        floor: 1,
        room: 1,
        floorLimit: 100,
        roomLimit: 5,
    },
    settings: {
        enemyBaseLvl: 1,
        enemyLvlGap: 5,
        enemyBaseStats: 1,
        enemyScaling: 1.1,
    },
    status: {
        exploring: false,
        paused: true,
        event: false,
    },
    statistics: {
        kills: 0,
        runtime: 0,
    },
    backlog: [],
    action: 0,
};

// ===== Dungeon Setup =====
// Enables start and pause on button click
dungeonActivity.addEventListener('click', function () {
    dungeonStartPause();
});

// Sets up the initial dungeon
const initialDungeonLoad = () => {
    // Add collapsible functionality to stat boxes
    addCollapsibleStatPanels();
    
    if (localStorage.getItem("dungeonData") !== null) {
        dungeon = JSON.parse(localStorage.getItem("dungeonData"));
        dungeon.status = {
            exploring: true,
            paused: false,
            event: false,
        };
        updateDungeonLog();
    } else {
        dungeon.status.exploring = true;
        dungeon.status.paused = false;
        
        // Add welcome message when player first enters the dungeon
        addDungeonLog(`<span class="Legendary">${getPlayerName()} began their quest!</span>`);
    }
    
    loadDungeonProgress();
    dungeonTime.innerHTML = new Date(dungeon.statistics.runtime * 1000).toISOString().slice(11, 19);
    dungeonAction.innerHTML = "Exploring...";
    
    // Set the correct text and style for the dungeonActivity button
    if (dungeon.status.paused) {
        dungeonActivity.innerHTML = `<i class="fas fa-play"></i> Explore`;
        dungeonActivity.style.backgroundColor = '';
    } else {
        dungeonActivity.innerHTML = `<i class="fas fa-pause"></i> Rest`;
        dungeonActivity.style.backgroundColor = '#2ecc71';
    }
    
    dungeonTime.innerHTML = "00:00:00";
    
    // Start the dungeon event timer and play timer
    dungeonTimer = setInterval(dungeonEvent, 1000);
    playTimer = setInterval(dungeonCounter, 1000);
    
    // Initialize rest healing if paused, otherwise start auto action
    if (dungeon.status.paused) {
        startRestHealing();
    } else {
        stopRestHealing();
        
        // Reset the auto action progress
        autoActionProgress = 0;
        
        // We don't start auto action immediately since there's no event yet
        // The dungeonEvent function will trigger startAutoAction when needed
    }
}

// Start and Pause Functionality
const dungeonStartPause = () => {
    if (!dungeon.status.paused) {
        sfxPause.play();

        dungeonAction.innerHTML = "Resting...";
        dungeonActivity.innerHTML = `<i class="fas fa-play"></i> Explore`;
        dungeonActivity.style.backgroundColor = ''; // Remove green background
        dungeon.status.exploring = false;
        dungeon.status.paused = true;
        
        // Start HP regeneration while resting
        startRestHealing();
        
        // Pause auto action progress
        if (autoActionTimer) {
            clearInterval(autoActionTimer);
        }
    } else {
        sfxUnpause.play();

        dungeonAction.innerHTML = "Exploring...";
        dungeonActivity.innerHTML = `<i class="fas fa-pause"></i> Rest`;
        dungeonActivity.style.backgroundColor = '#2ecc71'; // Green background when active
        dungeon.status.exploring = true;
        dungeon.status.paused = false;
        
        // Stop HP regeneration while exploring
        stopRestHealing();
        
        // Start auto action progress only if there's an event requiring user input
        if (dungeon.status.event) {
            startAutoAction();
        }
    }
}

// Counts the total time for the current run and total playtime
const dungeonCounter = () => {
    player.playtime++;
    dungeon.statistics.runtime++;
    dungeonTime.innerHTML = new Date(dungeon.statistics.runtime * 1000).toISOString().slice(11, 19);
    saveData();
}

// Loads the floor and room count
const loadDungeonProgress = () => {
    if (dungeon.progress.room > dungeon.progress.roomLimit) {
        dungeon.progress.room = 1;
        dungeon.progress.floor++;
    }
    floorCount.innerHTML = `Floor ${dungeon.progress.floor}`;
    roomCount.innerHTML = `Room ${dungeon.progress.room}/${dungeon.progress.roomLimit}`;
}

// ========== Events in the Dungeon ==========
const dungeonEvent = () => {
    if (dungeon.status.exploring && !dungeon.status.event) {
        dungeon.action++;
        let choices;
        let eventRoll;
        let eventTypes = ["blessing", "curse", "treasure", "enemy", "enemy", "nothing", "nothing", "nothing", "nothing", "monarch"];
        if (dungeon.action > 2 && dungeon.action < 6) {
            eventTypes.push("nextroom");
        } else if (dungeon.action > 5) {
            eventTypes = ["nextroom"];
        }
        const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];

        switch (event) {
            case "nextroom":
                dungeon.status.event = true;
                choices = `
                    <div class="decision-panel">
                        <button id="choice1" class="enter-button btn-with-progress"><i class="fa fa-door-open"></i> Enter</button>
                        <button id="choice2"><i class="fa fa-times"></i> Ignore</button>
                    </div>`;
                if (dungeon.progress.room == dungeon.progress.roomLimit) {
                    addDungeonLog(`<span class="Heirloom">You found the door to the boss room.</span>`, choices);
                } else {
                    addDungeonLog("You found a door.", choices);
                }
                document.querySelector("#choice1").onclick = function () {
                    sfxConfirm.play();
                    if (dungeon.progress.room == dungeon.progress.roomLimit) {
                        guardianBattle();
                    } else {
                        eventRoll = randomizeNum(1, 3);
                        if (eventRoll == 1) {
                            incrementRoom();
                            mimicBattle("door");
                            addDungeonLog("You moved to the next floor.");
                        } else if (eventRoll == 2) {
                            incrementRoom();
                            choices = `
                                <div class="decision-panel">
                                    <button id="choice1" class="btn-with-progress"><i class="fa fa-box-open"></i> Open the chest</button>
                                    <button id="choice2"><i class="fa fa-times"></i> Ignore</button>
                                </div>`;
                            addDungeonLog(`You moved to the next room and found a treasure chamber. There's a chest inside.`, choices);
                            
                            // Add onclick handler with a slight delay to ensure it's properly attached
                            setTimeout(() => {
                                const chestButton = document.querySelector("#choice1");
                                if (chestButton) {
                                    chestButton.onclick = function() {
                                        chestEvent();
                                    };
                                }
                                
                                const ignoreButton = document.querySelector("#choice2");
                                if (ignoreButton) {
                                    ignoreButton.onclick = function() {
                                        dungeon.action = 0;
                                        ignoreEvent();
                                    };
                                }
                            }, 50);
                        } else {
                            dungeon.status.event = false;
                            incrementRoom();
                            addDungeonLog("You moved to the next room.");
                        }
                    }
                };
                document.querySelector("#choice2").onclick = function () {
                    dungeon.action = 0;
                    ignoreEvent();
                };
                
                // Start auto action timer when there's an event requiring user input
                if (!dungeon.status.paused) {
                    startAutoAction();
                }
                break;
            case "treasure":
                dungeon.status.event = true;
                choices = `
                    <div class="decision-panel">
                        <button id="choice1" class="btn-with-progress"><i class="fa fa-box-open"></i> Open the chest</button>
                        <button id="choice2"><i class="fa fa-times"></i> Ignore</button>
                    </div>`;
                addDungeonLog(`You found a treasure chamber. There's a chest inside.`, choices);
                
                // Add onclick handler with a slight delay to ensure it's properly attached
                setTimeout(() => {
                    const chestButton = document.querySelector("#choice1");
                    if (chestButton) {
                        chestButton.onclick = function() {
                            chestEvent();
                        };
                    }
                    
                    const ignoreButton = document.querySelector("#choice2");
                    if (ignoreButton) {
                        ignoreButton.onclick = function() {
                            ignoreEvent();
                        };
                    }
                }, 50);
                
                // Start auto action timer when there's an event requiring user input
                if (!dungeon.status.paused) {
                    startAutoAction();
                }
                break;
            case "nothing":
                nothingEvent();
                break;
            case "enemy":
                dungeon.status.event = true;
                choices = `
                    <div class="decision-panel">
                        <button id="choice1" class="btn-with-progress"><i class="ra ra-crossed-swords"></i> Battle</button>
                        <button id="choice2"><i class="fa fa-running"></i> Flee</button>
                    </div>`;
                generateRandomEnemy();
                addDungeonLog(`You encountered ${enemy.name}.`, choices);
                player.inCombat = true;
                document.querySelector("#choice1").onclick = function () {
                    engageBattle();
                }
                document.querySelector("#choice2").onclick = function () {
                    fleeBattle();
                }
                
                // Start auto action timer when there's an event requiring user input
                if (!dungeon.status.paused) {
                    startAutoAction();
                }
                break;
            case "blessing":
                eventRoll = randomizeNum(1, 2);
                if (eventRoll == 1) {
                    dungeon.status.event = true;
                    blessingValidation();
                    let cost = player.blessing * (500 * (player.blessing * 0.5)) + 750;
                    choices = `
                        <div class="decision-panel">
                            <button id="choice1" class="offer-button btn-with-progress"><i class="fa fa-hand-holding-usd"></i> Offer</button>
                            <button id="choice2"><i class="fa fa-times"></i> Ignore</button>
                        </div>`;
                    addDungeonLog(`<span class="Legendary">You found a Statue of Blessing. Do you want to offer <i class="fas fa-coins" style="color: #FFD700;"></i><span class="Common">${nFormatter(cost)}</span> to gain blessings? (Blessing Lv.${player.blessing})</span>`, choices);
                    document.querySelector("#choice1").onclick = function () {
                        if (player.gold < cost) {
                            sfxDeny.play();
                            addDungeonLog("You don't have enough gold.");
                        } else {
                            player.gold -= cost;
                            sfxConfirm.play();
                            statBlessing();
                        }
                        dungeon.status.event = false;
                    }
                    document.querySelector("#choice2").onclick = function () {
                        ignoreEvent();
                    };
                    
                    // Start auto action timer when there's an event requiring user input
                    if (!dungeon.status.paused) {
                        startAutoAction();
                    }
                } else {
                    nothingEvent();
                }
                break;
            case "curse":
                eventRoll = randomizeNum(1, 3);
                if (eventRoll == 1) {
                    dungeon.status.event = true;
                    let curseLvl = Math.round((dungeon.settings.enemyScaling - 1) * 10);
                    let cost = curseLvl * (10000 * (curseLvl * 0.5)) + 5000;
                    choices = `
                            <div class="decision-panel">
                                <button id="choice1" class="btn-with-progress"><i class="fa fa-hand-holding-usd"></i> Offer</button>
                                <button id="choice2"><i class="fa fa-times"></i> Ignore</button>
                            </div>`;
                    addDungeonLog(`<span class="Heirloom">You found a Cursed Totem. Do you want to offer <i class="fas fa-coins" style="color: #FFD700;"></i><span class="Common">${nFormatter(cost)}</span>? This will strengthen the monsters but will also improve the loot quality. (Curse Lv.${curseLvl})</span>`, choices);
                    document.querySelector("#choice1").onclick = function () {
                        if (player.gold < cost) {
                            sfxDeny.play();
                            addDungeonLog("You don't have enough gold.");
                        } else {
                            player.gold -= cost;
                            sfxConfirm.play();
                            cursedTotem(curseLvl);
                        }
                        dungeon.status.event = false;
                    }
                    document.querySelector("#choice2").onclick = function () {
                        ignoreEvent();
                    };
                    
                    // Start auto action timer when there's an event requiring user input
                    if (!dungeon.status.paused) {
                        startAutoAction();
                    }
                } else {
                    nothingEvent();
                }
                break;
            case "monarch":
                eventRoll = randomizeNum(1, 7);
                if (eventRoll == 1) {
                    dungeon.status.event = true;
                    choices = `
                            <div class="decision-panel">
                                <button id="choice1" class="enter-button btn-with-progress"><i class="fa fa-door-open"></i> Enter</button>
                                <button id="choice2"><i class="fa fa-times"></i> Ignore</button>
                            </div>`;
                    addDungeonLog(`<span class="Heirloom">You found a mysterious chamber. It seems like there is something sleeping inside.</span>`, choices);
                    document.querySelector("#choice1").onclick = function () {
                        specialBossBattle();
                    }
                    document.querySelector("#choice2").onclick = function () {
                        ignoreEvent();
                    };
                    
                    // Start auto action timer when there's an event requiring user input
                    if (!dungeon.status.paused) {
                        startAutoAction();
                    }
                } else {
                    nothingEvent();
                }
        }
    }
}

// ========= Dungeon Choice Events ==========
// Starts the battle
const engageBattle = () => {
    // Pause auto action progress when entering combat
    if (autoActionTimer) {
        clearInterval(autoActionTimer);
    }
    
    showCombatInfo();
    startCombat(bgmBattleMain);
    addCombatLog(`You encountered ${enemy.name}.`);
    updateDungeonLog();
}

// Mimic encounter
const mimicBattle = (type) => {
    generateRandomEnemy(type);
    showCombatInfo();
    startCombat(bgmBattleMain);
    addCombatLog(`You encountered ${enemy.name}.`);
    addDungeonLog(`You encountered ${enemy.name}.`);
}

// Guardian boss fight
const guardianBattle = () => {
    incrementRoom();
    generateRandomEnemy("guardian");
    
    // Set the boss battle flag if that function exists
    if (typeof setBossBattleState === 'function') {
        setBossBattleState(true);
    }
    
    showCombatInfo();
    startCombat(bgmBattleGuardian);
    addCombatLog(`Floor Guardian ${enemy.name} is blocking your way.`);
    addDungeonLog("You moved to the next floor.");
}

// Special boss fight (Dungeon Monarch)
const specialBossBattle = () => {
    generateRandomEnemy("sboss");
    
    // Set the boss battle flag if that function exists
    if (typeof setBossBattleState === 'function') {
        setBossBattleState(true);
    }
    
    showCombatInfo();
    startCombat(bgmBattleBoss);
    addCombatLog(`Dungeon Monarch ${enemy.name} has awoken.`);
    addDungeonLog(`Dungeon Monarch ${enemy.name} has awoken.`);
}

// Flee from the monster
const fleeBattle = () => {
    let eventRoll = randomizeNum(1, 2);
    if (eventRoll == 1) {
        sfxConfirm.play();
        addDungeonLog(`You managed to flee.`);
        player.inCombat = false;
        dungeon.status.event = false;
    } else {
        addDungeonLog(`You failed to escape!`);
        showCombatInfo();
        startCombat(bgmBattleMain);
        addCombatLog(`You encountered ${enemy.name}.`);
        addCombatLog(`You failed to escape!`);
    }
}

// Chest event randomizer
const chestEvent = () => {
    sfxConfirm.play();
    let eventRoll = randomizeNum(1, 4);
    if (eventRoll == 1) {
        mimicBattle("chest");
    } else if (eventRoll == 2) {
        if (dungeon.progress.floor == 1) {
            goldDrop();
        } else {
            createEquipmentPrint("dungeon");
        }
        dungeon.status.event = false;
    } else if (eventRoll == 3) {
        goldDrop();
        dungeon.status.event = false;
    } else {
        addDungeonLog("The chest is empty.");
        dungeon.status.event = false;
    }
}

// Non choices dungeon event messages
const nothingEvent = () => {
    let eventRoll = randomizeNum(1, 5);
    if (eventRoll == 1) {
        addDungeonLog("You explored and found nothing.");
    } else if (eventRoll == 2) {
        addDungeonLog("You found an <span class='text-gray'>empty chest</span>.");
    } else if (eventRoll == 3) {
        // 30% chance to find monster meat
        if (Math.random() < 0.3) {
            addDungeonLog("You found a <span class='text-green'>monster corpse</span> and collected some <span class='text-food'>monster meat</span>.");
            if (!player.inventory.consumables) {
                player.inventory.consumables = [];
            }
            player.inventory.consumables.push("monster meat");
            saveData();
        } else {
            addDungeonLog("You found a <span class='text-green'>monster corpse</span>.");
        }
    } else if (eventRoll == 4) {
        addDungeonLog("You found a <span class='text-green'>corpse</span>.");
    } else if (eventRoll == 5) {
        addDungeonLog("There is <span class='text-gray'>nothing</span> in this area.");
    }
}

// Calculates Gold Drop
const goldDrop = () => {
    sfxSell.play();
    let goldValue = randomizeNum(50, 500) * dungeon.progress.floor;
    addDungeonLog(`You found <i class="fas fa-coins" style="color: #FFD700;"></i><span class="text-gold">${nFormatter(goldValue)}</span>.`);
    player.gold += goldValue;
    playerLoadStats();
}

// Random stat buff
const statBlessing = () => {
    sfxBuff.play();
    let stats = ["hp", "atk", "def", "atkSpd", "vamp", "critRate", "critDmg"];
    let buff = stats[Math.floor(Math.random() * stats.length)];
    let value;
    switch (buff) {
        case "hp":
            value = 10;
            player.bonusStats.hp += value;
            break;
        case "atk":
            value = 8;
            player.bonusStats.atk += value;
            break;
        case "def":
            value = 8;
            player.bonusStats.def += value;
            break;
        case "atkSpd":
            value = 3;
            player.bonusStats.atkSpd += value;
            break;
        case "vamp":
            value = 0.5;
            player.bonusStats.vamp += value;
            break;
        case "critRate":
            value = 1;
            player.bonusStats.critRate += value;
            break;
        case "critDmg":
            value = 6;
            player.bonusStats.critDmg += value;
            break;
    }
    addDungeonLog(`You gained ${value}% bonus ${buff.replace(/([A-Z])/g, ".$1").replace(/crit/g, "c").toUpperCase()} from the blessing. (Blessing Lv.${player.blessing} > Blessing Lv.${player.blessing + 1})`);
    blessingUp();
    playerLoadStats();
    saveData();
}

// Cursed totem offering
const cursedTotem = (curseLvl) => {
    sfxBuff.play();
    dungeon.settings.enemyScaling += 0.1;
    addDungeonLog(`The monsters in the dungeon became stronger and the loot quality improved. (Curse Lv.${curseLvl} > Curse Lv.${curseLvl + 1})`);
    saveData();
}

// Ignore event and proceed exploring
const ignoreEvent = () => {
    sfxConfirm.play();
    dungeon.status.event = false;
    addDungeonLog("You ignored it and decided to move on.");
    
    // Restart auto action system if player is not resting
    if (!dungeon.status.paused) {
        setTimeout(startAutoAction, 500);
    }
}

// Increase room or floor accordingly
const incrementRoom = () => {
    dungeon.progress.room++;
    dungeon.action = 0;
    loadDungeonProgress();
}

// Increases player total blessing
const blessingUp = () => {
    blessingValidation();
    player.blessing++;
}

// Validates whether blessing exists or not
const blessingValidation = () => {
    if (player.blessing == undefined) {
        player.blessing = 1;
    }
}

// ========= Dungeon Backlog ==========
// Displays every dungeon activity
const updateDungeonLog = (choices) => {
    let dungeonLog = document.querySelector("#dungeonLog");
    dungeonLog.innerHTML = "";

    // Display the recent 50 dungeon logs
    for (let message of dungeon.backlog.slice(-50)) {
        let logElement = document.createElement("p");
        logElement.innerHTML = message;
        dungeonLog.appendChild(logElement);
    }

    // If the event has choices, display it
    if (typeof choices !== 'undefined') {
        let eventChoices = document.createElement("div");
        eventChoices.innerHTML = choices;
        dungeonLog.appendChild(eventChoices);
        
        // Add styling classes to buttons after they're added to the DOM
        const choice1Button = document.querySelector("#choice1");
        const choice2Button = document.querySelector("#choice2");
        
        if (choice1Button) {
            // Add classes based on button content
            if (choice1Button.innerHTML.includes("fa-door-open")) {
                choice1Button.classList.add("enter-button");
            } 
            else if (choice1Button.innerHTML.includes("fa-hand-holding-usd")) {
                choice1Button.classList.add("offer-button");
            }
            else if (choice1Button.innerHTML.includes("ra-crossed-swords")) {
                // Already has the green style from CSS
            }
        }
    }

    dungeonLog.scrollTop = dungeonLog.scrollHeight;
}

// Add a log to the dungeon backlog
const addDungeonLog = (message, choices) => {
    // Heal player by 1 HP for non-combat moves (if not already at max HP)
    // Don't heal if the message contains combat-related text or player is in combat
    if (player && player.stats && 
        player.stats.hp < player.stats.hpMax && 
        !player.inCombat &&
        !message.includes("encountered") &&
        !message.includes("battle") &&
        !message.includes("combat") &&
        !message.includes("died")) {
        
        player.stats.hp = Math.min(player.stats.hp + 1, player.stats.hpMax);
        playerLoadStats();
        
        // Update HP progress bar if it exists
        if (typeof updateHpProgressBar === 'function') {
            updateHpProgressBar();
        }
        
        // Update player HP bar color
        if (typeof updatePlayerHpBarColor === 'function') {
            updatePlayerHpBarColor();
        }
    }
    
    // Ensure proper formatting for the "nothing in this area" message
    if (message.includes("nothing") && message.includes("in this area")) {
        message = message.replace(/There is (.*?)in this area/, 'There is $1 in this area');
    }
    
    // Ensure proper formatting for "corpse" text
    if (message.includes("corpse")) {
        message = message.replace(/found a(corpse)/, 'found a $1');
    }
    
    // Add spaces around colored text spans
    message = message.replace(/<span class=['"](.*?)['"]>(.*?)<\/span>/g, function(match, className, content) {
        // Don't add spaces if the span is legendary/common/etc class for hero names
        if (["Legendary", "Common", "Uncommon", "Rare", "Epic", "Heirloom"].includes(className)) {
            return match;
        }
        // Already has padding via CSS, just make sure there's a space before/after if needed
        if (content.trim() === content) {
            // Check if the span is at the beginning of the message
            const isAtStart = message.indexOf(match) === 0;
            // Check if the span is at the end of the message
            const isAtEnd = message.indexOf(match) + match.length === message.length;
            
            // Add spaces only where needed
            if (isAtStart && isAtEnd) {
                return match; // No spaces needed if it's the entire message
            } else if (isAtStart) {
                return match + ' '; // Add space after if at start
            } else if (isAtEnd) {
                return ' ' + match; // Add space before if at end
            } else {
                return ' ' + match + ' '; // Add spaces on both sides
            }
        }
        return match;
    }).replace(/\s{3,}/g, " ").trim(); // Fix any triple spaces that might occur

    // Add relevant icon based on message content
    let iconMessage = addIconToLogMessage(message);
    
    dungeon.backlog.push(iconMessage);
    updateDungeonLog(choices);
}

// Add an appropriate icon based on the message content
const addIconToLogMessage = (message) => {
    // Check for special colored messages first (they already have styling)
    if (message.includes("<span class=")) {
        if (message.includes("Legendary") && !message.includes("<i class=")) {
            // Blessing statue message
            return message.replace("You found a Statue of Blessing", "<i class=\"ra ra-angel-wings\" style=\"color: #ffd700;\"></i> You found a Statue of Blessing");
        } else if (message.includes("Heirloom") && !message.includes("<i class=")) {
            if (message.includes("boss room")) {
                // Boss room message
                return message.replace("You found the door to the boss room", "<i class=\"ra ra-monster-skull\" style=\"color: #e30b5c;\"></i> You found the door to the boss room");
            } else if (message.includes("Cursed Totem")) {
                // Cursed totem message
                return message.replace("You found a Cursed Totem", "<i class=\"ra ra-burning-skull\" style=\"color: #e30b5c;\"></i> You found a Cursed Totem");
            } else if (message.includes("mysterious chamber")) {
                // Special boss message
                return message.replace("You found a mysterious chamber", "<i class=\"ra ra-dragon\" style=\"color: #e30b5c;\"></i> You found a mysterious chamber");
            }
        }
        return message; // Return unchanged if it's a special message but we don't have a specific icon
    }

    // Regular messages
    if (message.includes("encountered") || message.includes("failed to escape")) {
        return `<i class="ra ra-crossed-swords" style="color: #e74c3c;"></i> ${message}`; // Combat
    } else if (message.includes("door")) {
        return `<i class="fa fa-door-open" style="color: #3498db;"></i> ${message}`; // Door/room
    } else if (message.includes("treasure") || message.includes("Chest")) {
        return `<i class="fa fa-box-open" style="color: #f1c40f;"></i> ${message}`; // Treasure/chest
    } else if (message.includes("empty chest")) {
        return `<i class="fa fa-box-open" style="color: #95a5a6;"></i> ${message}`; // Empty chest
    } else if (message.includes("moved to the next")) {
        return `<i class="fa fa-hiking" style="color: #3498db;"></i> ${message}`; // Moving to next room/floor
    } else if (message.includes("coin")) {
        return message; // Already has a coin icon
    } else if (message.includes("found nothing") || message.includes("nothing in this area")) {
        return `<i class="fa fa-question-circle" style="color: #95a5a6;"></i> ${message}`; // Nothing found
    } else if (message.includes("monster corpse")) {
        return `<i class="ra ra-skull" style="color: #2ecc71;"></i> ${message}`; // Monster corpse
    } else if (message.includes("corpse")) {
        return `<i class="fa fa-skull-crossbones" style="color: #2ecc71;"></i> ${message}`; // Corpse
    } else if (message.includes("monster meat")) {
        return `<i class="ra ra-meat" style="color: #e67e22;"></i> ${message}`; // Monster meat
    } else if (message.includes("ignored it")) {
        return `<i class="fa fa-times-circle" style="color: #95a5a6;"></i> ${message}`; // Ignored
    } else if (message.includes("blessing")) {
        return `<i class="ra ra-star-swirl" style="color: #ffd700;"></i> ${message}`; // Blessing
    } else if (message.includes("monsters") && message.includes("stronger")) {
        return `<i class="ra ra-burning-skull" style="color: #e30b5c;"></i> ${message}`; // Curse
    } else if (message.includes("Resting")) {
        return `<i class="fa fa-bed" style="color: #3498db;"></i> ${message}`; // Resting
    } else if (message.includes("Exploring")) {
        return `<i class="fa fa-compass" style="color: #3498db;"></i> ${message}`; // Exploring
    } else if (message.includes("managed to flee")) {
        return `<i class="fa fa-running" style="color: #3498db;"></i> ${message}`; // Fleeing
    } else if (message.includes("empty")) {
        return `<i class="fa fa-times-circle" style="color: #95a5a6;"></i> ${message}`; // Empty
    } else if (message.includes("ate") && message.includes("monster meat")) {
        return `<i class="ra ra-meat" style="color: #e67e22;"></i> ${message}`; // Eating meat
    } else if (message.includes("began their quest")) {
        return `<i class="ra ra-player" style="color: #ffd700;"></i> ${message}`; // Beginning quest
    }

    // Default for any other messages
    return `<i class="fa fa-scroll" style="color: #bdc3c7;"></i> ${message}`;
}

// Evaluate a dungeon difficulty
const evaluateDungeon = () => {
    let base = 500;
    // Work in Progress
}

// Rest healing variables
let restHealingTimer;
const restHealingRate = 0.02; // 2% of max HP per second

// Start HP regeneration while resting
const startRestHealing = () => {
    // Clear any existing timer
    if (restHealingTimer) {
        clearInterval(restHealingTimer);
    }
    
    // Start healing at regular intervals
    restHealingTimer = setInterval(() => {
        if (player.stats.hp < player.stats.hpMax) {
            // Heal 2% of max HP per second
            const healAmount = Math.ceil(player.stats.hpMax * restHealingRate);
            player.stats.hp = Math.min(player.stats.hp + healAmount, player.stats.hpMax);
            playerLoadStats();
            
            // Update HP progress bar if it exists
            if (typeof updateHpProgressBar === 'function') {
                updateHpProgressBar();
            }
            
            // Update player HP bar color
            if (typeof updatePlayerHpBarColor === 'function') {
                updatePlayerHpBarColor();
            }
        }
    }, 1000);
}

// Stop HP regeneration
const stopRestHealing = () => {
    if (restHealingTimer) {
        clearInterval(restHealingTimer);
        restHealingTimer = null;
    }
}

// Auto action variables
let autoActionTimer;
let autoActionProgress = 0;
const autoActionDuration = 5000; // 5 seconds for auto actions (changed from 3000)

// Start auto action progress
const startAutoAction = () => {
    // Only start auto action if there's an event requiring user input
    if (!dungeon.status.event) {
        return;
    }
    
    // Clear any existing timer
    if (autoActionTimer) {
        clearInterval(autoActionTimer);
    }
    
    // Reset progress
    autoActionProgress = 0;
    
    // Find the main action button (first choice button)
    const mainActionButton = document.querySelector("#choice1");
    if (!mainActionButton) {
        console.warn("Main action button not found");
        return;
    }
    
    // Ensure the button has the btn-with-progress class
    if (!mainActionButton.classList.contains('btn-with-progress')) {
        mainActionButton.classList.add('btn-with-progress');
    }
    
    // Add linear progress if it doesn't exist
    let progressContainer = mainActionButton.querySelector('.linear-progress-container');
    if (!progressContainer) {
        // Create progress container
        progressContainer = document.createElement('div');
        progressContainer.className = 'linear-progress-container';
        
        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'linear-progress-bar';
        progressContainer.appendChild(progressBar);
        
        // Append to button
        mainActionButton.appendChild(progressContainer);
    }
    
    // Get the progress bar
    const progressBar = progressContainer.querySelector('.linear-progress-bar');
    if (!progressBar) {
        console.warn("Progress bar not found");
        return;
    }
    
    // Reset progress bar
    progressBar.style.width = "0%";
    
    // Start progress timer
    autoActionTimer = setInterval(() => {
        if (dungeon.status.paused) {
            // Don't progress while resting
            return;
        }
        
        autoActionProgress += 100;
        
        // Update the visual progress
        const progressPercent = (autoActionProgress / autoActionDuration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        
        // When progress reaches 100%, perform the action
        if (autoActionProgress >= autoActionDuration) {
            clearInterval(autoActionTimer);
            
            // If there's an event, click the first choice button
            if (dungeon.status.event && mainActionButton) {
                mainActionButton.click();
            }
            
            // Reset for the next action
            autoActionProgress = 0;
        }
    }, 100);
}

// Add collapsible functionality to stat panels
const addCollapsibleStatPanels = () => {
    // Get the stat boxes
    const statsBox = document.querySelector('.stat-panel .box:first-child');
    const bonusStatsBox = document.querySelector('#bonus-stats');
    
    // Add headers with toggle icons
    if (statsBox && !statsBox.querySelector('.box-head')) {
        const statsHeader = document.createElement('div');
        statsHeader.className = 'box-head';
        statsHeader.innerHTML = '<h4>Stats</h4><i class="fas fa-chevron-down toggle-icon"></i>';
        statsBox.insertBefore(statsHeader, statsBox.firstChild);
        
        // Move HP out of the collapsible area
        const hpElement = statsBox.querySelector('p:nth-child(2)'); // The HP element
        if (hpElement) {
            const hpContainer = document.createElement('div');
            hpContainer.className = 'hp-container';
            hpContainer.appendChild(hpElement.cloneNode(true));
            statsBox.parentNode.insertBefore(hpContainer, statsBox);
            
            // Add monster meat consumption button if there's meat in inventory
            updateMonsterMeatUI();
            
            // Remove the original HP element
            hpElement.remove();
        }
        
        // Add click event to toggle collapse
        statsHeader.addEventListener('click', () => {
            statsBox.classList.toggle('collapsed');
            statsHeader.querySelector('.toggle-icon').classList.toggle('collapsed');
        });
    }
    
    // Add header to bonus stats box
    if (bonusStatsBox && !bonusStatsBox.querySelector('.box-head')) {
        const bonusHeader = document.createElement('div');
        bonusHeader.className = 'box-head';
        bonusHeader.innerHTML = '<h4>Bonus Stats</h4><i class="fas fa-chevron-down toggle-icon"></i>';
        
        // Replace the existing h4 with our new header
        const existingHeader = bonusStatsBox.querySelector('h4');
        if (existingHeader) {
            bonusStatsBox.replaceChild(bonusHeader, existingHeader);
        } else {
            bonusStatsBox.insertBefore(bonusHeader, bonusStatsBox.firstChild);
        }
        
        // Add click event to toggle collapse
        bonusHeader.addEventListener('click', () => {
            bonusStatsBox.classList.toggle('collapsed');
            bonusHeader.querySelector('.toggle-icon').classList.toggle('collapsed');
        });
    }
}

// Update the monster meat UI (button and count)
const updateMonsterMeatUI = () => {
    // Find the HP container
    const hpContainer = document.querySelector('.hp-container');
    if (!hpContainer) return;
    
    // Remove any existing meat button
    const existingMeatUI = hpContainer.querySelector('.meat-ui');
    if (existingMeatUI) {
        existingMeatUI.remove();
    }
    
    // Check if player has monster meat
    if (player.inventory.consumables && player.inventory.consumables.includes("monster meat")) {
        // Count monster meat
        const meatCount = player.inventory.consumables.filter(item => item === "monster meat").length;
        
        // Create monster meat button and count UI
        const meatUI = document.createElement('div');
        meatUI.className = 'meat-ui';
        meatUI.innerHTML = `
            <button id="eat-meat-btn" class="meat-button"><i class="ra ra-meat"></i> Eat Meat (+25 HP)</button>
            <span class="meat-count"><span class="text-food">${meatCount}</span> meat</span>
        `;
        
        // Add to HP container
        hpContainer.appendChild(meatUI);
        
        // Add click event to eat meat button
        const eatMeatBtn = hpContainer.querySelector('#eat-meat-btn');
        if (eatMeatBtn) {
            eatMeatBtn.addEventListener('click', () => {
                eatMonsterMeat();
                // Update the UI after eating
                updateMonsterMeatUI();
            });
        }
    }
}