const combatPanel = document.querySelector("#combatPanel")
let enemyDead = false;
let playerDead = false;
let hasTriedToRun = false;
let inBossBattle = false; // Flag to track if we're in a boss battle

// ========== Validation ==========
const hpValidation = () => {
    // Prioritizes player death before the enemy
    if (player.stats.hp < 1) {
        player.stats.hp = 0;
        playerDead = true;
        player.deaths++;
        addCombatLog(`You died!`);
        
        // Show death summary
        showDeathSummary();
        
        // Hide the run button container when player dies
        const runButtonContainer = document.querySelector("#run-button-container");
        if (runButtonContainer) {
            runButtonContainer.style.display = "none";
        }
        
        endCombat();
    } else if (enemy.stats.hp < 1) {
        // Gives out all the reward and show the claim button
        enemy.stats.hp = 0;
        enemyDead = true;
        player.kills++;
        dungeon.statistics.kills++;
        
        // Update enemy HP bar to show 0 HP
        const enemyHpBar = document.querySelector("#enemy-hp-battle");
        const enemyHpDamageElement = document.querySelector("#enemy-hp-dmg");
        
        if (enemyHpBar) {
            enemyHpBar.style.width = "0%";
            enemyHpBar.style.opacity = "0.5"; // Fade the HP bar
            enemy.stats.hpPercent = 0;
        }
        
        // Reset the damage indicator bar
        if (enemyHpDamageElement) {
            enemyHpDamageElement.style.width = "0%";
            enemyHpDamageElement.style.opacity = "0.5"; // Fade the damage bar
        }
        
        // Stop the attack timer and reset it to 0
        const enemyAttackTimer = document.querySelector("#enemy-attack-timer");
        if (enemyAttackTimer) {
            enemyAttackTimer.style.transition = "none";
            enemyAttackTimer.style.width = "0%";
            enemyAttackTimer.style.opacity = "0.5"; // Fade the attack timer
        }
        
        // Apply dead enemy effect (grayscale and opacity)
        const enemySprite = document.querySelector("#enemy-sprite");
        if (enemySprite) {
            enemySprite.classList.add("enemy-dead");
            
            // Add red X overlay
            const enemyPanel = document.querySelector("#enemyPanel");
            const xOverlay = document.createElement("div");
            xOverlay.className = "enemy-dead-x";
            xOverlay.innerHTML = '<i class="fas fa-times"></i>';
            enemyPanel.appendChild(xOverlay);
            
            // Make X visible after a short delay
            setTimeout(() => {
                xOverlay.classList.add("visible");
            }, 100);
        }
        
        // Change run button to claim/equip button
        const runButtonContainer = document.querySelector("#run-button-container");
        if (runButtonContainer) {
            if (enemy.rewards.drop) {
                runButtonContainer.innerHTML = `
                    <button id="claimButton" class="btn-with-progress">
                        <div class="linear-progress-container">
                            <div class="linear-progress-bar"></div>
                        </div>
                        Done
                    </button>
                `;
            } else {
                runButtonContainer.innerHTML = `
                    <button id="claimButton" class="btn-with-progress">
                        <div class="linear-progress-container">
                            <div class="linear-progress-bar"></div>
                        </div>
                        Done
                    </button>
                `;
            }
            
            // Add event listener for the claim button
            const claimButton = document.querySelector("#claimButton");
            if (claimButton) {
                // Start auto-dismiss timer
                let autoDismissProgress = 0;
                const autoDismissDuration = 5000; // 5 seconds before auto-dismissing
                const autoDismissInterval = 100; // Update every 100ms
                const progressBar = claimButton.querySelector(".linear-progress-bar");
                
                // Variable to track if timer is paused
                let isTimerPaused = false;
                
                // Create a function to check for level up screen
                const checkForLevelUp = () => {
                    const lvlupPanelVisible = lvlupPanel && lvlupPanel.style.display === "flex";
                    
                    // If level up panel is visible, pause the timer
                    if (lvlupPanelVisible && !isTimerPaused) {
                        isTimerPaused = true;
                        console.log("Auto-dismiss timer paused due to level up screen");
                    }
                    
                    // If level up panel is hidden, resume the timer
                    if (!lvlupPanelVisible && isTimerPaused) {
                        isTimerPaused = false;
                        console.log("Auto-dismiss timer resumed");
                    }
                    
                    return isTimerPaused;
                };
                
                const autoDismissTimer = setInterval(() => {
                    // Check if we should pause the timer
                    if (checkForLevelUp()) {
                        return; // Don't increment progress while paused
                    }
                    
                    autoDismissProgress += autoDismissInterval;
                    
                    // Update progress bar
                    if (progressBar) {
                        const progressPercent = (autoDismissProgress / autoDismissDuration) * 100;
                        progressBar.style.width = `${progressPercent}%`;
                    }
                    
                    // When progress reaches 100%, auto-dismiss
                    if (autoDismissProgress >= autoDismissDuration) {
                        clearInterval(autoDismissTimer);
                        
                        sfxConfirm.play();
                        
                        // Clear combat backlog and transition to dungeon exploration
                        let dimDungeon = document.querySelector('#dungeon-main');
                        dimDungeon.style.filter = "brightness(100%)";
                        safelyPlayDungeonMusic();
                        
                        dungeon.status.event = false;
                        combatPanel.style.display = "none";
                        enemyDead = false;
                        combatBacklog.length = 0;
                    }
                }, autoDismissInterval);
                
                // Manual click still works
                claimButton.addEventListener("click", function() {
                    clearInterval(autoDismissTimer);
                    
                    sfxConfirm.play();
                    
                    // Clear combat backlog and transition to dungeon exploration
                    let dimDungeon = document.querySelector('#dungeon-main');
                    dimDungeon.style.filter = "brightness(100%)";
                    safelyPlayDungeonMusic();
                    
                    dungeon.status.event = false;
                    combatPanel.style.display = "none";
                    enemyDead = false;
                    combatBacklog.length = 0;
                });
            }
        }
        
        addCombatLog(`${enemy.name} died! 💀 (${new Date(combatSeconds * 1000).toISOString().substring(14, 19)})`);
        addCombatLog(`You earned ${nFormatter(enemy.rewards.exp)} exp.`)
        playerExpGain();
        addCombatLog(`${enemy.name} dropped <i class="fas fa-coins" style="color: #FFD700;"></i>${nFormatter(enemy.rewards.gold)} gold.`)
        player.gold += enemy.rewards.gold;
        playerLoadStats();
        if (enemy.rewards.drop) {
            createEquipmentPrint("combat");
        }

        // Recover 20% of players health
        player.stats.hp += Math.round((player.stats.hpMax * 20) / 100);
        playerLoadStats();

        // Remove any existing event listeners on the battle button first
        const battleButton = document.querySelector("#battleButton");
        if (battleButton) {
            // Clone the button to remove all event listeners
            const newBattleButton = battleButton.cloneNode(true);
            battleButton.parentNode.replaceChild(newBattleButton, battleButton);
            
            // Add the event listener to the new button
            newBattleButton.addEventListener("click", function () {
                sfxConfirm.play();

                // Clear combat backlog and transition to dungeon exploration
                let dimDungeon = document.querySelector('#dungeon-main');
                dimDungeon.style.filter = "brightness(100%)";
                safelyPlayDungeonMusic();
                
                dungeon.status.event = false;
                combatPanel.style.display = "none";
                enemyDead = false;
                combatBacklog.length = 0;
            });
        }
        endCombat();
    }
    
    // Update HP progress bar
    if (typeof updateHpProgressBar === 'function') {
        updateHpProgressBar();
    }
    
    // Update player HP bar color
    updatePlayerHpBarColor();
}

// Show death summary with run statistics
const showDeathSummary = () => {
    const runTime = new Date(dungeon.statistics.runtime * 1000).toISOString().slice(11, 19);
    
    // Get player name using the helper function if available
    const playerName = typeof getPlayerName === 'function' ? getPlayerName() : (player.name || "Hero");
    
    // Get hero image
    const heroImage = player.heroImage || "1p.png"; // Default image if none set
    
    // Random death quotes
    const deathQuotes = [
        "Life is temporary, but so is death in video games.",
        "Death is just a minor inconvenience for heroes like you.",
        "Even the best adventurers take dirt naps sometimes.",
        "Heroes never die... they just respawn at the title screen.",
        "You fought bravely. The enemies were just luckier.",
        "Death is nature's way of telling you to try a different strategy.",
        "That's going to leave a mark... on your ego.",
        "The good news is: you can't die twice!",
        "Remember: what doesn't kill you... oh wait, never mind.",
        "Don't feel bad, everyone dies eventually. You just did it sooner.",
        "Death: the ultimate power nap.",
        "Game over? More like game pause!",
        "Well, at least you don't have to pay taxes anymore.",
        "Your adventure has been temporarily interrupted by mortality."
    ];
    
    // Select a random quote
    const randomQuote = deathQuotes[Math.floor(Math.random() * deathQuotes.length)];
    
    // Create overlay with run summary
    const deathSummaryOverlay = document.createElement('div');
    deathSummaryOverlay.className = 'death-summary-overlay';
    deathSummaryOverlay.innerHTML = `
        <div class="death-summary">
            <img src="./assets/sprites/heros/${heroImage}" class="death-hero-portrait" alt="${playerName}">
            <h2>${playerName} Died!</h2>
            <p class="death-quote">"${randomQuote}"</p>
            <div class="death-stats">
                <p><i class="fas fa-skull"></i> Floor Reached: ${dungeon.progress.floor}</p>
                <p><i class="fas fa-clock"></i> Run Time: ${runTime}</p>
                <p><i class="fas fa-dragon"></i> Enemies Slain: ${dungeon.statistics.kills}</p>
                <p><i class="fas fa-coins"></i> Gold Collected: ${nFormatter(player.gold)}</p>
            </div>
            <button id="continue-after-death">Continue</button>
        </div>
    `;
    
    // Add to combat panel
    const combatPanel = document.querySelector('#combatPanel');
    if (combatPanel) {
        combatPanel.appendChild(deathSummaryOverlay);
        
        // Add event listener to continue button
        const continueButton = document.querySelector('#continue-after-death');
        if (continueButton) {
            continueButton.addEventListener('click', function() {
                // Remove overlay
                deathSummaryOverlay.remove();
                
                // Return to character picker screen
                let dimDungeon = document.querySelector('#dungeon-main');
                dimDungeon.style.filter = "brightness(100%)";
                dimDungeon.style.display = "none";
                combatPanel.style.display = "none";
                
                // Reset player data
                player = {
                    name: player.name || "", // Preserve player name
                    lvl: 1,
                    heroImage: player.heroImage || "1p.png", // Preserve hero image
                    stats: {
                        hp: null,
                        hpMax: null,
                        atk: null,
                        def: null,
                        pen: null,
                        atkSpd: null,
                        vamp: null,
                        critRate: null,
                        critDmg: null
                    },
                    baseStats: {
                        hp: 500,
                        atk: 100,
                        def: 50,
                        pen: 0,
                        atkSpd: 0.6,
                        vamp: 0,
                        critRate: 0,
                        critDmg: 50
                    },
                    equippedStats: {
                        hp: 0,
                        atk: 0,
                        def: 0,
                        pen: 0,
                        atkSpd: 0,
                        vamp: 0,
                        critRate: 0,
                        critDmg: 0,
                        hpPct: 0,
                        atkPct: 0,
                        defPct: 0,
                        penPct: 0,
                    },
                    bonusStats: {
                        hp: 0,
                        atk: 0,
                        def: 0,
                        atkSpd: 0,
                        vamp: 0,
                        critRate: 0,
                        critDmg: 0
                    },
                    exp: {
                        expCurr: 0,
                        expMax: 100,
                        expCurrLvl: 0,
                        expMaxLvl: 100,
                        lvlGained: 0
                    },
                    inventory: {
                        consumables: [],
                        equipment: []
                    },
                    equipped: [],
                    gold: 0,
                    playtime: 0,
                    kills: 0,
                    deaths: 0,
                    inCombat: false
                };
                
                // Save the reset player data
                saveData();
                
                // Go to character picker
                clearInterval(dungeonTimer);
                clearInterval(playTimer);
                progressReset();
                characterRandomizer();
            });
        }
    }
}

// ========== Attack Functions ==========
const playerAttack = () => {
    if (!player.inCombat) {
        return;
    }
    if (player.inCombat) {
        sfxAttack.play();
    }

    // Reset and animate the attack timer bar
    const attackTimerBar = document.querySelector("#player-attack-timer");
    if (attackTimerBar) {
        attackTimerBar.style.width = "0%";
        attackTimerBar.style.transition = "none";
        
        // Force a reflow to ensure the transition is reset
        void attackTimerBar.offsetWidth;
    }

    // Calculates the damage and attacks the enemy
    let crit;
    let damage = player.stats.atk * (player.stats.atk / (player.stats.atk + enemy.stats.def));
    // Randomizes the damage by 90% - 110%
    let dmgRange = 0.9 + Math.random() * 0.2;
    damage = damage * dmgRange;
    // Check if the attack is a critical hit
    if (Math.floor(Math.random() * 100) < player.stats.critRate) {
        crit = true;
        dmgtype = "crit damage";
        damage = Math.round(damage * (1 + (player.stats.critDmg / 100)));
    } else {
        crit = false;
        dmgtype = "damage";
        damage = Math.round(damage);
    }

    // Skill effects
    objectValidation();
    if (player.skills.includes("Remnant Razor")) {
        // Attacks deal extra 8% of enemies' current health on hit
        damage += Math.round((8 * enemy.stats.hp) / 100);
    }
    if (player.skills.includes("Titan's Will")) {
        // Attacks deal extra 5% of your maximum health on hit
        damage += Math.round((5 * player.stats.hpMax) / 100);
    }
    if (player.skills.includes("Devastator")) {
        // Deal 30% more damage but you lose 30% base attack speed
        damage = Math.round(damage + ((30 * damage) / 100));
    }
    if (player.skills.includes("Rampager")) {
        // Increase base attack by 5 after each hit. Stack resets after battle.
        player.baseStats.atk += 5;
        objectValidation();
        player.tempStats.atk += 5;
        saveData();
    }
    if (player.skills.includes("Blade Dance")) {
        // Gain increased attack speed after each hit. Stack resets after battle
        player.baseStats.atkSpd += 0.01;
        objectValidation();
        player.tempStats.atkSpd += 0.01;
        saveData();
    }

    // Lifesteal formula
    let lifesteal = Math.round(damage * (player.stats.vamp / 100));

    // Apply the calculations to combat
    enemy.stats.hp -= damage;
    enemy.stats.hpPercent = Number((enemy.stats.hp / enemy.stats.hpMax) * 100).toFixed(2);
    player.stats.hp += lifesteal;
    addCombatLog(`${player.name} dealt ` + nFormatter(damage) + ` ${dmgtype} to ${enemy.name}.`);
    hpValidation();
    playerLoadStats();
    enemyLoadStats();

    // Update HP progress bar
    if (typeof updateHpProgressBar === 'function') {
        updateHpProgressBar();
    }
    
    // Update player HP bar color
    updatePlayerHpBarColor();

    // Damage effect and hit animation
    let enemySprite = document.querySelector("#enemy-sprite");
    if (enemySprite) {
        // Force remove any existing animations first
        enemySprite.classList.remove("animation-shake");
        enemySprite.classList.remove("enemy-hit");
        
        // Force a reflow to ensure animations restart properly
        void enemySprite.offsetWidth;
        
        // Apply the hit effect
        enemySprite.classList.add("enemy-hit");
        
        // Apply shake animation with a slight delay to ensure it works
        setTimeout(() => {
            enemySprite.classList.add("animation-shake");
        }, 10);
        
        // Remove effects after the animation completes
        setTimeout(() => {
            enemySprite.classList.remove("animation-shake");
            enemySprite.classList.remove("enemy-hit");
        }, 500); // Increased from 400ms to 500ms
    }

    // Damage numbers
    const dmgContainer = document.querySelector("#dmg-container");
    const dmgNumber = document.createElement("p");
    dmgNumber.classList.add("dmg-numbers");
    if (crit) {
        dmgNumber.style.color = "gold";
        dmgNumber.innerHTML = nFormatter(damage) + "!";
    } else {
        dmgNumber.innerHTML = nFormatter(damage);
    }
    dmgContainer.appendChild(dmgNumber);
    setTimeout(() => {
        dmgContainer.removeChild(dmgContainer.lastElementChild);
    }, 370);

    // Attack Timer
    if (player.inCombat) {
        // Set the new transition and animate to 100%
        if (attackTimerBar) {
            const attackTime = 1000 / player.stats.atkSpd;
            attackTimerBar.style.transition = `width ${attackTime}ms linear`;
            attackTimerBar.style.width = "100%";
            
            // Update the timer text
            const attackTimerText = document.querySelector("#player-attack-timer-text");
            if (attackTimerText) {
                attackTimerText.textContent = `${(attackTime / 1000).toFixed(1)}s`;
            }
        }
        
        setTimeout(() => {
            if (player.inCombat) {
                playerAttack();
            }
        }, (1000 / player.stats.atkSpd));
    }
}

const enemyAttack = () => {
    if (!player.inCombat) {
        return;
    }
    if (player.inCombat) {
        sfxAttack.play();
    }

    // Reset and animate the attack timer bar
    const attackTimerBar = document.querySelector("#enemy-attack-timer");
    if (attackTimerBar) {
        attackTimerBar.style.width = "0%";
        attackTimerBar.style.transition = "none";
        
        // Force a reflow to ensure the transition is reset
        void attackTimerBar.offsetWidth;
    }

    // Calculates the damage and attacks the player
    let damage = enemy.stats.atk * (enemy.stats.atk / (enemy.stats.atk + player.stats.def));
    let lifesteal = Math.round(enemy.stats.atk * (enemy.stats.vamp / 100));
    // Randomizes the damage by 90% - 110%
    let dmgRange = 0.9 + Math.random() * 0.2;
    damage = damage * dmgRange;
    // Check if the attack is a critical hit
    if (Math.floor(Math.random() * 100) < enemy.stats.critRate) {
        dmgtype = "crit damage";
        damage = Math.round(damage * (1 + (enemy.stats.critDmg / 100)));
    } else {
        dmgtype = "damage";
        damage = Math.round(damage);
    }

    // Skill effects
    if (player.skills.includes("Paladin's Heart")) {
        // You receive 25% less damage
        damage = Math.round(damage - ((25 * damage) / 100));
    }

    // Apply the calculations
    player.stats.hp -= damage;
    // Aegis Thorns skill
    objectValidation();
    if (player.skills.includes("Aegis Thorns")) {
        // Enemies receive 15% of the damage they dealt
        enemy.stats.hp -= Math.round((15 * damage) / 100);
    }
    enemy.stats.hp += lifesteal;
    addCombatLog(`${enemy.name} dealt ` + nFormatter(damage) + ` ${dmgtype} to ${player.name}.`);
    hpValidation();
    playerLoadStats();
    enemyLoadStats();

    // Update HP progress bar
    if (typeof updateHpProgressBar === 'function') {
        updateHpProgressBar();
    }
    
    // Update player HP bar color
    updatePlayerHpBarColor();

    // Damage effect and hit animation
    let playerPanel = document.querySelector('#playerPanel');
    playerPanel.classList.add("animation-shake");
    setTimeout(() => {
        playerPanel.classList.remove("animation-shake");
    }, 200);

    // Attack Timer
    if (player.inCombat) {
        // Set the new transition and animate to 100%
        if (attackTimerBar) {
            const attackTime = 1000 / enemy.stats.atkSpd;
            attackTimerBar.style.transition = `width ${attackTime}ms linear`;
            attackTimerBar.style.width = "100%";
            
            // Update the timer text
            const attackTimerText = document.querySelector("#enemy-attack-timer-text");
            if (attackTimerText) {
                attackTimerText.textContent = `${(attackTime / 1000).toFixed(1)}s`;
            }
        }
        
        setTimeout(() => {
            if (player.inCombat) {
                enemyAttack();
            }
        }, (1000 / enemy.stats.atkSpd));
    }
}

// ========== Combat Backlog ==========
const combatBacklog = [];

// Add a log to the combat backlog
const addCombatLog = (message) => {
    combatBacklog.push(message);
    updateCombatLog();
}

// Displays every combat activity
const updateCombatLog = () => {
    let combatLogBox = document.getElementById("combatLogBox");
    combatLogBox.innerHTML = "";

    for (let message of combatBacklog) {
        let logElement = document.createElement("p");
        logElement.innerHTML = message;
        combatLogBox.appendChild(logElement);
    }

    // Only add back to menu button if player is dead
    if (playerDead) {
        let button = document.createElement("div");
        button.className = "decision-panel";
        button.innerHTML = `<button id="battleButton"><i class="fa fa-home"></i> Back to Menu</button>`;
        combatLogBox.appendChild(button);
        
        // Add event listener for the back to menu button
        setTimeout(() => {
            const battleButton = document.querySelector("#battleButton");
            if (battleButton) {
                battleButton.addEventListener("click", function() {
                    sfxConfirm.play();
                    playerDead = false;

                    // Reset all the necessary stats and return to menu
                    let dimDungeon = document.querySelector('#dungeon-main');
                    dimDungeon.style.filter = "brightness(100%)";
                    dimDungeon.style.display = "none";
                    combatPanel.style.display = "none";
                    runLoad("title-screen", "flex");

                    clearInterval(dungeonTimer);
                    clearInterval(playTimer);
                    progressReset();
                });
            }
        }, 100);
    }
    
    combatLogBox.scrollTop = combatLogBox.scrollHeight;
}

// Update player HP bar color based on percentage
const updatePlayerHpBarColor = () => {
    const playerHpBar = document.querySelector('#player-hp-battle');
    if (!playerHpBar) return;
    
    // Remove any existing color classes
    playerHpBar.classList.remove('hp-low', 'hp-critical');
    
    // Add appropriate class based on HP percentage
    const hpPercent = parseFloat(player.stats.hpPercent);
    if (hpPercent <= 10) {
        playerHpBar.classList.add('hp-critical');
    } else if (hpPercent <= 20) {
        playerHpBar.classList.add('hp-low');
    }
}

// Combat Timer
let combatSeconds = 0;

const startCombat = (battleMusic) => {
    hasTriedToRun = false;
    
    // Stop all music first to prevent overlapping
    if (bgmDungeon && bgmDungeon.playing()) bgmDungeon.stop();
    if (bgmBattleMain && bgmBattleMain.playing()) bgmBattleMain.stop();
    if (bgmBattleGuardian && bgmBattleGuardian.playing()) bgmBattleGuardian.stop();
    if (bgmBattleBoss && bgmBattleBoss.playing()) bgmBattleBoss.stop();
    
    sfxEncounter.play();
    battleMusic.play();
    player.inCombat = true;

    // Starts the timer for player and enemy attacks along with combat timer
    setTimeout(playerAttack, (1000 / player.stats.atkSpd));
    setTimeout(enemyAttack, (1000 / enemy.stats.atkSpd));
    let dimDungeon = document.querySelector('#dungeon-main');
    dimDungeon.style.filter = "brightness(50%)";

    playerLoadStats();
    enemyLoadStats();
    updatePlayerHpBarColor();

    dungeon.status.event = true;
    combatPanel.style.display = "flex";

    combatTimer = setInterval(combatCounter, 1000);
}

const endCombat = () => {
    // Stop all battle music
    if (bgmBattleMain && bgmBattleMain.playing()) bgmBattleMain.stop();
    if (bgmBattleGuardian && bgmBattleGuardian.playing()) bgmBattleGuardian.stop();
    if (bgmBattleBoss && bgmBattleBoss.playing()) bgmBattleBoss.stop();
    
    // Play combat end sound effect
    sfxCombatEnd.play();
    
    player.inCombat = false;
    
    // Skill validation
    if (player.skills.includes("Rampager")) {
        // Remove Rampager attack buff
        objectValidation();
        player.baseStats.atk -= player.tempStats.atk;
        player.tempStats.atk = 0;
        saveData();
    }
    if (player.skills.includes("Blade Dance")) {
        // Remove Blade Dance attack speed buff
        objectValidation();
        player.baseStats.atkSpd -= player.tempStats.atkSpd;
        player.tempStats.atkSpd = 0;
        saveData();
    }

    // Stops every timer in combat
    clearInterval(combatTimer);
    combatSeconds = 0;
    
    // Clear the combat backlog if player died to avoid residual messages when starting a new game
    if (playerDead) {
        combatBacklog.length = 0;
    }
    
    // Check if there's a pending level up to show
    if (player.pendingLevelUp) {
        player.pendingLevelUp = false;
        // Delay slightly to ensure combat panel is fully cleared
        setTimeout(() => {
            if (typeof showLevelUpChoices === 'function') {
                showLevelUpChoices();
            }
        }, 500);
    }
    
    // Restart auto action system if player is not resting
    if (!dungeon.status.paused && typeof startAutoAction === 'function') {
        setTimeout(startAutoAction, 1000);
    }
}

const combatCounter = () => {
    combatSeconds++;
}

// Function to set boss battle state
const setBossBattleState = (isBoss) => {
    inBossBattle = isBoss;
}

const showCombatInfo = () => {
    // Get hero image
    const heroImage = player.heroImage || "1p.png"; // Default image if none set
    const playerName = getPlayerName(); // Get the player's name
    
    document.querySelector('#combatPanel').innerHTML = `
    <div class="content">
        <div class="battle-info-panel center" id="enemyPanel">
            <img src="./assets/sprites/${enemy.image.name}${enemy.image.type}" alt="${enemy.name}" width="${enemy.image.size}" id="enemy-sprite">
            <p style="text-align: left; width: 100%; margin-top: 10px;">${enemy.name} Lv.${enemy.lvl}</p>
            <div class="battle-stat-row">
                <div class="battle-bar empty-bar hp bb-hp">
                    <div class="battle-bar dmg bb-hp" id="enemy-hp-dmg"></div>
                    <div class="battle-bar current bb-hp" id="enemy-hp-battle"></div>
                </div>
                <div class="battle-stat-value" id="enemy-hp-value">${nFormatter(enemy.stats.hp)}/${nFormatter(enemy.stats.hpMax)}</div>
            </div>
            <div class="battle-stat-row">
                <div class="attack-timer-container">
                    <div class="attack-timer-bar" id="enemy-attack-timer"></div>
                </div>
                <span class="attack-timer-text" id="enemy-attack-timer-text">${(1000 / enemy.stats.atkSpd / 1000).toFixed(1)}s</span>
            </div>
            <div id="dmg-container"></div>
        </div>
        <div class="battle-info-panel primary-panel" id="playerPanel">
            <img src="./assets/sprites/heros/${heroImage}" id="player-portrait" alt="${playerName}">
            <div class="player-info-container">
                <p id="player-combat-info">${playerName} Lv.${player.lvl}</p>
                <div class="battle-stat-row">
                    <div class="battle-bar empty-bar bb-hp">
                        <div class="battle-bar dmg bb-hp" id="player-hp-dmg"></div>
                        <div class="battle-bar current bb-hp" id="player-hp-battle"></div>
                    </div>
                    <div class="battle-stat-value" id="player-hp-value">${nFormatter(player.stats.hp)}/${nFormatter(player.stats.hpMax)}</div>
                </div>
                <div class="battle-stat-row">
                    <div class="attack-timer-container">
                        <div class="attack-timer-bar" id="player-attack-timer"></div>
                    </div>
                    <span class="attack-timer-text" id="player-attack-timer-text">${(1000 / player.stats.atkSpd / 1000).toFixed(1)}s</span>
                </div>
            </div>
        </div>
        <div class="logBox primary-panel">
            <div id="combatLogBox"></div>
        </div>
        <div id="run-button-container" class="battle-action-panel">
            <button id="runButton" ${hasTriedToRun ? 'disabled style="opacity: 0.5;"' : ''}><i class="fa fa-running"></i> Run (ESC)</button>
        </div>
    </div>
    `;
    
    // Add event listener for the run button if it's not disabled
    const runButtonElement = document.querySelector("#runButton");
    if (runButtonElement && !hasTriedToRun) {
        runButtonElement.addEventListener("click", function() {
            sfxConfirm.play();
            runFromBattle();
        });
    }
}

// Run from battle with 50/50 chance and potential gold loss
const runFromBattle = () => {
    // If player has already tried to run once, show a message
    if (hasTriedToRun) {
        addCombatLog("You've already tried to run once! You must fight!");
        return;
    }
    
    hasTriedToRun = true;
    const escapeChance = Math.random() < 0.5; // 50% chance to escape
    
    if (escapeChance) {
        // Success - escape but may lose gold
        const goldLossChance = Math.random() < 0.7; // 70% chance to lose gold when running
        
        if (goldLossChance && player.gold > 0) {
            // Lose between 5-15% of gold
            const lossPercentage = 5 + Math.floor(Math.random() * 11);
            const goldLost = Math.floor((player.gold * lossPercentage) / 100);
            player.gold -= goldLost;
            
            addCombatLog(`You managed to escape, but dropped <i class="fas fa-coins" style="color: #FFD700;"></i>${nFormatter(goldLost)} gold while running!`);
        } else {
            addCombatLog("You managed to escape safely!");
        }
        
        // Change run button to close button
        const runButtonContainer = document.querySelector("#run-button-container");
        if (runButtonContainer) {
            runButtonContainer.innerHTML = `<button id="closeButton">Close</button>`;
            
            // Add event listener for the close button
            const closeButton = document.querySelector("#closeButton");
            if (closeButton) {
                closeButton.addEventListener("click", function() {
                    sfxConfirm.play();
                    
                    // Clear combat backlog and transition to dungeon exploration
                    let dimDungeon = document.querySelector('#dungeon-main');
                    dimDungeon.style.filter = "brightness(100%)";
                    safelyPlayDungeonMusic();
                    
                    dungeon.status.event = false;
                    combatPanel.style.display = "none";
                    enemyDead = false;
                    hasTriedToRun = false;
                    combatBacklog.length = 0;
                });
            }
        }
        
        endCombat();
    } else {
        // Failed to escape
        addCombatLog("You failed to escape! The enemy attacks!");
        
        // Enemy gets a free hit as penalty
        setTimeout(() => {
            if (player.inCombat) {
                enemyAttack();
            }
        }, 500);
    }
}

// Function to show the last dropped equipment for equipping
const showLastDroppedEquipment = () => {
    // Find the most recently dropped equipment
    const lastEquipmentString = player.inventory.equipment[player.inventory.equipment.length - 1];
    
    if (!lastEquipmentString) return;
    
    // Parse the JSON string to get the equipment object
    const lastEquipment = JSON.parse(lastEquipmentString);
    
    if (!lastEquipment) return;
    
    // Get the appropriate icon for the equipment
    const icon = equipmentIcon(lastEquipment.category);
    
    // Equip the item directly
    const index = player.inventory.equipment.length - 1;
    
    // Check if player already has an item of this type equipped
    let hasItemOfSameType = false;
    let existingItemIndex = -1;
    
    for (let j = 0; j < player.equipped.length; j++) {
        if (player.equipped[j].type === lastEquipment.type) {
            hasItemOfSameType = true;
            existingItemIndex = j;
            break;
        }
    }
    
    if (hasItemOfSameType) {
        // Unequip existing item of same type
        const existingItem = player.equipped[existingItemIndex];
        player.equipped.splice(existingItemIndex, 1);
        player.inventory.equipment.push(JSON.stringify(existingItem));
    }
    
    // Equip the new item
    player.inventory.equipment.splice(index, 1);
    player.equipped.push(lastEquipment);
    
    // Update player stats
    playerLoadStats();
    saveData();
    
    // Show a brief notification in the combat log
    addCombatLog(`You equipped ${lastEquipment.category}.`);
    
    // Find and fade out the equipment panel and remove buttons
    setTimeout(() => {
        const equipmentPanels = document.querySelectorAll('.equipment-panel');
        const actionButtons = document.querySelectorAll('.decision-panel');
        
        // Get the last equipment panel (most recently added)
        const lastPanel = equipmentPanels[equipmentPanels.length - 1];
        
        // Get the last action buttons panel (associated with the equipment)
        const lastButtons = actionButtons[actionButtons.length - 1];
        
        if (lastPanel) {
            // Add a fade-out class
            lastPanel.style.opacity = '0.5';
            lastPanel.style.filter = 'grayscale(100%)';
            lastPanel.style.transition = 'opacity 0.5s, filter 0.5s';
        }
        
        if (lastButtons) {
            // Remove the buttons
            lastButtons.style.display = 'none';
        }
    }, 100);
    
    // Clear combat backlog and transition to dungeon exploration
    setTimeout(() => {
        let dimDungeon = document.querySelector('#dungeon-main');
        dimDungeon.style.filter = "brightness(100%)";
        safelyPlayDungeonMusic();
        
        dungeon.status.event = false;
        combatPanel.style.display = "none";
        enemyDead = false;
        combatBacklog.length = 0;
    }, 1000); // Delay the transition to allow the fade effect to be seen
}

// Add keyboard event listener for Escape key to trigger Run button
document.addEventListener('keydown', function(event) {
    // Check if we're in combat and the run button is available
    if (player && player.inCombat && !playerDead && !enemyDead) {
        // Check if Escape key was pressed
        if (event.key === 'Escape') {
            const runButton = document.querySelector('#runButton');
            if (runButton && !hasTriedToRun) {
                sfxConfirm.play();
                runFromBattle();
            }
        }
    }
});

// Safely play dungeon music (prevent multiple instances)
const safelyPlayDungeonMusic = () => {
    // First stop any battle music that might be playing
    if (bgmBattleMain && bgmBattleMain.playing()) bgmBattleMain.stop();
    if (bgmBattleGuardian && bgmBattleGuardian.playing()) bgmBattleGuardian.stop();
    if (bgmBattleBoss && bgmBattleBoss.playing()) bgmBattleBoss.stop();
    
    // Then play dungeon music only if it's not already playing
    if (bgmDungeon && !bgmDungeon.playing()) {
        bgmDungeon.play();
    }
}