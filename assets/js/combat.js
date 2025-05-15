const combatPanel = document.querySelector("#combatPanel")
let enemyDead = false;
let playerDead = false;
let hasTriedToRun = false;

// ========== Validation ==========
const hpValidation = () => {
    // Prioritizes player death before the enemy
    if (player.stats.hp < 1) {
        player.stats.hp = 0;
        playerDead = true;
        player.deaths++;
        addCombatLog(`You died!`);
        
        // Change run button to "Back to Menu" button
        const runButtonContainer = document.querySelector("#run-button-container");
        if (runButtonContainer) {
            runButtonContainer.innerHTML = `<button id="backToMenuButton"><i class="fa fa-home"></i> Back to Menu</button>`;
            
            // Add event listener for the back to menu button
            const backToMenuButton = document.querySelector("#backToMenuButton");
            if (backToMenuButton) {
                backToMenuButton.addEventListener("click", function() {
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
                    <button id="claimButton">Done</button>
                    <button id="equipNowButton2"><i class="ra ra-sword"></i> Equip Now</button>
                `;
                
                // Add event listeners for the new buttons
                const equipNowButton = document.querySelector("#equipNowButton2");
                if (equipNowButton) {
                    equipNowButton.addEventListener("click", function() {
                        sfxConfirm.play();
                        showLastDroppedEquipment();
                        
                        // Clear combat backlog and transition to dungeon exploration
                        let dimDungeon = document.querySelector('#dungeon-main');
                        dimDungeon.style.filter = "brightness(100%)";
                        bgmDungeon.play();
                        
                        dungeon.status.event = false;
                        combatPanel.style.display = "none";
                        enemyDead = false;
                        combatBacklog.length = 0;
                    });
                }
            } else {
                runButtonContainer.innerHTML = `<button id="claimButton">Done</button>`;
            }
            
            // Add event listener for the claim button
            const claimButton = document.querySelector("#claimButton");
            if (claimButton) {
                claimButton.addEventListener("click", function() {
                    sfxConfirm.play();
                    
                    // Clear combat backlog and transition to dungeon exploration
                    let dimDungeon = document.querySelector('#dungeon-main');
                    dimDungeon.style.filter = "brightness(100%)";
                    bgmDungeon.play();
                    
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
                bgmDungeon.play();
                
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

    // Damage effect
    let enemySprite = document.querySelector("#enemy-sprite");
    enemySprite.classList.add("animation-shake");
    setTimeout(() => {
        enemySprite.classList.remove("animation-shake");
    }, 200);

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

    // Damage effect
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

    // We no longer need to add claim buttons here since they're in the action panel
    // Just add the equip button if there's an equipment drop and enemy is dead
    if (enemyDead && enemy.rewards.drop) {
        let buttonContainer = document.createElement("div");
        buttonContainer.className = "decision-panel";
        buttonContainer.innerHTML = `<button id="equipNowButton"><i class="ra ra-sword"></i> Equip Now</button>`;
        
        combatLogBox.appendChild(buttonContainer);
        
        // Add event listener for the equip now button
        const equipNowButton = document.querySelector("#equipNowButton");
        if (equipNowButton) {
            equipNowButton.addEventListener("click", function() {
                sfxConfirm.play();
                showLastDroppedEquipment();
                
                // Clear combat backlog and transition to dungeon exploration
                let dimDungeon = document.querySelector('#dungeon-main');
                dimDungeon.style.filter = "brightness(100%)";
                bgmDungeon.play();
                
                dungeon.status.event = false;
                combatPanel.style.display = "none";
                enemyDead = false;
                combatBacklog.length = 0;
            });
        }
    }

    if (playerDead) {
        let button = document.createElement("div");
        button.className = "decision-panel";
        button.innerHTML = `<button id="battleButton"><i class="fa fa-home"></i> Back to Menu</button>`;
        combatLogBox.appendChild(button);
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
    bgmDungeon.pause();
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
}

const combatCounter = () => {
    combatSeconds++;
}

const showCombatInfo = () => {
    document.querySelector('#combatPanel').innerHTML = `
    <div class="content">
        <div class="battle-info-panel center" id="enemyPanel">
            <p>${enemy.name} Lv.${enemy.lvl}</p>
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
            </div>
            <div class="attack-timer-text" id="enemy-attack-timer-text">${(1000 / enemy.stats.atkSpd / 1000).toFixed(1)}s</div>
            <div id="dmg-container"></div>
            <img src="./assets/sprites/${enemy.image.name}${enemy.image.type}" alt="${enemy.name}" width="${enemy.image.size}" id="enemy-sprite">
        </div>
        <div class="battle-info-panel primary-panel" id="playerPanel">
            <p id="player-combat-info"></p>
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
            </div>
            <div class="attack-timer-text" id="player-attack-timer-text">${(1000 / player.stats.atkSpd / 1000).toFixed(1)}s</div>
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
                    bgmDungeon.play();
                    
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
    
    // Clear combat backlog and transition to dungeon exploration
    let dimDungeon = document.querySelector('#dungeon-main');
    dimDungeon.style.filter = "brightness(100%)";
    bgmDungeon.play();
    
    dungeon.status.event = false;
    combatPanel.style.display = "none";
    enemyDead = false;
    combatBacklog.length = 0;
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