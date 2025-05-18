let player = JSON.parse(localStorage.getItem("playerData"));
let inventoryOpen = false;
let leveled = false;
const lvlupSelect = document.querySelector("#lvlupSelect");
const lvlupPanel = document.querySelector("#lvlupPanel");

const playerExpGain = () => {
    // Add debug log for XP gained
    console.log(`XP Gained: ${enemy.rewards.exp}, Current XP before: ${player.exp.expCurr}`);
    
    player.exp.expCurr += enemy.rewards.exp;
    player.exp.expCurrLvl += enemy.rewards.exp;

    // Log after adding XP
    console.log(`Current XP after: ${player.exp.expCurr}, XP for next level: ${player.exp.expMax}`);

    while (player.exp.expCurr >= player.exp.expMax) {
        playerLvlUp();
    }
    if (leveled) {
        lvlupPopup();
    }

    playerLoadStats();
}

// Levels up the player
const playerLvlUp = () => {
    leveled = true;

    // Calculates the excess exp and the new exp required to level up
    let expMaxIncrease = Math.floor(((player.exp.expMax * 1.1) + 100) - player.exp.expMax);
    if (player.lvl > 100) {
        expMaxIncrease = 1000000;
    }
    let excessExp = player.exp.expCurr - player.exp.expMax;
    player.exp.expCurrLvl = excessExp;
    player.exp.expMaxLvl = expMaxIncrease;

    // Increase player level and maximum exp
    player.lvl++;
    player.exp.lvlGained++;
    player.exp.expMax += expMaxIncrease;

    // Increase player bonus stats per level
    player.bonusStats.hp += 4;
    player.bonusStats.atk += 2;
    player.bonusStats.def += 2;
    player.bonusStats.atkSpd += 0.15;
    player.bonusStats.critRate += 0.1;
    player.bonusStats.critDmg += 0.25;
}

// Refresh the player stats
const playerLoadStats = () => {
    showEquipment();
    showInventory();
    applyEquipmentStats();

    let rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    if (player.stats.hp > player.stats.hpMax) {
        player.stats.hp = player.stats.hpMax;
    }
    player.stats.hpPercent = Number((player.stats.hp / player.stats.hpMax) * 100).toFixed(2).replace(rx, "$1");
    player.exp.expPercent = Number((player.exp.expCurrLvl / player.exp.expMaxLvl) * 100).toFixed(2).replace(rx, "$1");

    // Generate battle info for player if in combat
    if (player.inCombat || playerDead) {
        const playerCombatHpElement = document.querySelector('#player-hp-battle');
        const playerHpDamageElement = document.querySelector('#player-hp-dmg');
        const playerHpValueElement = document.querySelector('#player-hp-value');
        const playerExpElement = document.querySelector('#player-exp-bar');
        const playerInfoElement = document.querySelector('#player-combat-info');
        const playerPortrait = document.querySelector('#player-portrait');
        
        if (playerCombatHpElement) {
            playerCombatHpElement.style.width = `${player.stats.hpPercent}%`;
        }
        
        if (playerHpDamageElement) {
            playerHpDamageElement.style.width = `${player.stats.hpPercent}%`;
        }
        
        if (playerHpValueElement) {
            playerHpValueElement.textContent = `${nFormatter(player.stats.hp)}/${nFormatter(player.stats.hpMax)}`;
        }
        
        if (playerExpElement) {
            playerExpElement.style.width = `${player.exp.expPercent}%`;
        }
        
        if (playerInfoElement) {
            playerInfoElement.innerHTML = `${getPlayerName()} Lv.${player.lvl}`;
        }
        
        // Apply level-based border color to player portrait
        if (playerPortrait) {
            // Remove all existing level-based classes
            playerPortrait.classList.remove(
                'hero-border-level1-2', 
                'hero-border-level3-4', 
                'hero-border-level5-6', 
                'hero-border-level7-8', 
                'hero-border-level9-10', 
                'hero-border-level11plus'
            );
            
            // Apply appropriate class based on player level
            if (player.lvl <= 2) {
                playerPortrait.classList.add('hero-border-level1-2');
            } else if (player.lvl <= 4) {
                playerPortrait.classList.add('hero-border-level3-4');
            } else if (player.lvl <= 6) {
                playerPortrait.classList.add('hero-border-level5-6');
            } else if (player.lvl <= 8) {
                playerPortrait.classList.add('hero-border-level7-8');
            } else if (player.lvl <= 10) {
                playerPortrait.classList.add('hero-border-level9-10');
            } else {
                playerPortrait.classList.add('hero-border-level11plus');
            }
        }
    }

    // Header
    const headerName = document.querySelector("#player-name");
    if (headerName) {
        // Create hero portrait HTML
        const heroImage = player.heroImage || "1p.png"; // Default image if none set
        headerName.innerHTML = `
            <img src="./assets/sprites/heros/${heroImage}" class="header-hero-portrait" alt="${getPlayerName()}">
            ${getPlayerName()} Lv.${player.lvl}
        `;
    }
    
    // Update main game player portrait
    const mainPlayerPortrait = document.querySelector('#player-portrait');
    if (mainPlayerPortrait) {
        // Remove all existing level-based classes
        mainPlayerPortrait.classList.remove(
            'hero-border-level1-2', 
            'hero-border-level3-4', 
            'hero-border-level5-6', 
            'hero-border-level7-8', 
            'hero-border-level9-10', 
            'hero-border-level11plus'
        );
        
        // Apply appropriate class based on player level
        if (player.lvl <= 2) {
            mainPlayerPortrait.classList.add('hero-border-level1-2');
        } else if (player.lvl <= 4) {
            mainPlayerPortrait.classList.add('hero-border-level3-4');
        } else if (player.lvl <= 6) {
            mainPlayerPortrait.classList.add('hero-border-level5-6');
        } else if (player.lvl <= 8) {
            mainPlayerPortrait.classList.add('hero-border-level7-8');
        } else if (player.lvl <= 10) {
            mainPlayerPortrait.classList.add('hero-border-level9-10');
        } else {
            mainPlayerPortrait.classList.add('hero-border-level11plus');
        }
    }
    
    document.querySelector("#player-exp").innerHTML = `<p>Exp</p> ${nFormatter(player.exp.expCurr)}/${nFormatter(player.exp.expMax)} (${player.exp.expPercent}%)`;
    document.querySelector("#player-gold").innerHTML = `<i class="fas fa-coins" style="color: #FFD700;"></i> ${nFormatter(player.gold)}`;

    // Player Stats - first check if we're using the HP container
    const hpContainer = document.querySelector('.hp-container');
    if (hpContainer) {
        const hpElement = hpContainer.querySelector('p');
        if (hpElement) {
            hpElement.innerHTML = `<i class="fas fa-heart"></i>HP: ${nFormatter(player.stats.hp)}/${nFormatter(player.stats.hpMax)} (${player.stats.hpPercent}%)`;
        }
        
        // Update monster meat UI if function exists
        if (typeof updateMonsterMeatUI === 'function') {
            updateMonsterMeatUI();
        }
    } else {
        // If not using HP container, update the regular HP element
        const playerHpElement = document.querySelector('#player-hp');
        if (playerHpElement) {
            playerHpElement.innerHTML = `${nFormatter(player.stats.hp)}/${nFormatter(player.stats.hpMax)} (${player.stats.hpPercent}%)`;
        }
    }
    
    // Update other stats
    const playerAtkElement = document.querySelector('#player-atk');
    const playerDefElement = document.querySelector('#player-def');
    const playerAtkSpdElement = document.querySelector('#player-atkspd');
    const playerVampElement = document.querySelector('#player-vamp');
    const playerCrateElement = document.querySelector('#player-crate');
    const playerCdmgElement = document.querySelector('#player-cdmg');
    
    if (playerAtkElement) playerAtkElement.innerHTML = nFormatter(player.stats.atk);
    if (playerDefElement) playerDefElement.innerHTML = nFormatter(player.stats.def);
    if (playerAtkSpdElement) playerAtkSpdElement.innerHTML = player.stats.atkSpd.toFixed(2).replace(rx, "$1");
    if (playerVampElement) playerVampElement.innerHTML = (player.stats.vamp).toFixed(2).replace(rx, "$1") + "%";
    if (playerCrateElement) playerCrateElement.innerHTML = (player.stats.critRate).toFixed(2).replace(rx, "$1") + "%";
    if (playerCdmgElement) playerCdmgElement.innerHTML = (player.stats.critDmg).toFixed(2).replace(rx, "$1") + "%";

    // Player Bonus Stats
    const bonusStatsElement = document.querySelector("#bonus-stats");
    if (bonusStatsElement) {
        // Check if we already have a box-head
        const existingHeader = bonusStatsElement.querySelector('.box-head');
        if (existingHeader) {
            // Update the content after the header
            let bonusStatsHTML = `
            <p><i class="fas fa-heart"></i>HP+${player.bonusStats.hp.toFixed(2).replace(rx, "$1")}%</p>
            <p><i class="ra ra-sword"></i>ATK+${player.bonusStats.atk.toFixed(2).replace(rx, "$1")}%</p>
            <p><i class="ra ra-round-shield"></i>DEF+${player.bonusStats.def.toFixed(2).replace(rx, "$1")}%</p>
            <p><i class="ra ra-plain-dagger"></i>ATK.SPD+${player.bonusStats.atkSpd.toFixed(2).replace(rx, "$1")}%</p>
            <p><i class="ra ra-dripping-blade"></i>VAMP+${player.bonusStats.vamp.toFixed(2).replace(rx, "$1")}%</p>
            <p><i class="ra ra-lightning-bolt"></i>Crit.+${player.bonusStats.critRate.toFixed(2).replace(rx, "$1")}%</p>
            <p><i class="ra ra-focused-lightning"></i>Crit D.+${player.bonusStats.critDmg.toFixed(2).replace(rx, "$1")}%</p>`;
            
            // Remove all child nodes except the header
            Array.from(bonusStatsElement.childNodes).forEach(node => {
                if (node !== existingHeader) {
                    bonusStatsElement.removeChild(node);
                }
            });
            
            // Append the new content
            bonusStatsElement.insertAdjacentHTML('beforeend', bonusStatsHTML);
        } else {
            // If no header exists, use the old approach
            bonusStatsElement.innerHTML = `
            <h4>Bonus Stats</h4>
            <p><i class="fas fa-heart"></i>HP+${player.bonusStats.hp.toFixed(2).replace(rx, "$1")}%</p>
            <p><i class="ra ra-sword"></i>ATK+${player.bonusStats.atk.toFixed(2).replace(rx, "$1")}%</p>
            <p><i class="ra ra-round-shield"></i>DEF+${player.bonusStats.def.toFixed(2).replace(rx, "$1")}%</p>
            <p><i class="ra ra-plain-dagger"></i>ATK.SPD+${player.bonusStats.atkSpd.toFixed(2).replace(rx, "$1")}%</p>
            <p><i class="ra ra-dripping-blade"></i>VAMP+${player.bonusStats.vamp.toFixed(2).replace(rx, "$1")}%</p>
            <p><i class="ra ra-lightning-bolt"></i>Crit.+${player.bonusStats.critRate.toFixed(2).replace(rx, "$1")}%</p>
            <p><i class="ra ra-focused-lightning"></i>Crit D.+${player.bonusStats.critDmg.toFixed(2).replace(rx, "$1")}%</p>`;
        }
    }
    
    // Update HP progress bar
    updateHpProgressBar();
    
    // Update XP progress bar
    updateXpProgressBar();
}

// Update HP progress bar in main game
const updateHpProgressBar = () => {
    // First check if we're using the HP container
    const hpContainer = document.querySelector('.hp-container');
    let parentElement;
    
    if (hpContainer) {
        parentElement = hpContainer;
    } else {
        // Find the HP text element
        const playerHpElement = document.querySelector('#player-hp');
        if (playerHpElement) {
            parentElement = playerHpElement.parentNode;
        }
    }
    
    if (!parentElement) return;
    
    // Check if HP progress container exists, if not create it
    let hpProgressContainer = parentElement.querySelector('.hp-progress-container');
    if (!hpProgressContainer) {
        // Create the container
        hpProgressContainer = document.createElement('div');
        hpProgressContainer.className = 'hp-progress-container';
        
        // Create the bar
        const hpProgressBar = document.createElement('div');
        hpProgressBar.className = 'hp-progress-bar';
        hpProgressContainer.appendChild(hpProgressBar);
        
        // Append to parent
        parentElement.appendChild(hpProgressContainer);
    }
    
    // Update the progress bar
    const hpProgressBar = hpProgressContainer.querySelector('.hp-progress-bar');
    if (hpProgressBar) {
        hpProgressBar.style.width = `${player.stats.hpPercent}%`;
        
        // Update color based on HP percentage
        const hpPercent = parseFloat(player.stats.hpPercent);
        if (hpPercent <= 10) {
            hpProgressBar.className = 'hp-progress-bar hp-critical';
        } else if (hpPercent <= 25) {
            hpProgressBar.className = 'hp-progress-bar hp-low';
        } else {
            hpProgressBar.className = 'hp-progress-bar';
        }
    }
}

// Update XP progress bar in main game
const updateXpProgressBar = () => {
    // Check if XP progress container exists, if not create it
    let xpProgressContainer = document.querySelector('.xp-progress-container');
    if (!xpProgressContainer) {
        // Create the container
        xpProgressContainer = document.createElement('div');
        xpProgressContainer.className = 'xp-progress-container';
        
        // Create the bar
        const xpProgressBar = document.createElement('div');
        xpProgressBar.className = 'xp-progress-bar';
        xpProgressContainer.appendChild(xpProgressBar);
        
        // Insert directly after the XP text element
        const playerExpElement = document.querySelector('#player-exp');
        if (playerExpElement) {
            // Insert the XP bar directly after the player-exp element
            playerExpElement.appendChild(xpProgressContainer);
        }
    }
    
    // Update the progress bar
    const xpProgressBar = xpProgressContainer.querySelector('.xp-progress-bar');
    if (xpProgressBar) {
        xpProgressBar.style.width = `${player.exp.expPercent}%`;
    }
}

// Opens inventory
const openInventory = () => {
    sfxOpen.play();

    dungeon.status.exploring = false;
    inventoryOpen = true;
    let openInv = document.querySelector('#inventory');
    let dimDungeon = document.querySelector('#dungeon-main');
    openInv.style.display = "flex";
    dimDungeon.style.filter = "brightness(50%)";

    sellAllElement.onclick = function () {
        sfxOpen.play();
        openInv.style.filter = "brightness(50%)";
        let rarity = sellRarityElement.value;

        defaultModalElement.style.display = "flex";
        if (rarity == "All") {
            defaultModalElement.innerHTML = `
            <div class="content">
                <p>Sell all of your equipment?</p>
                <div class="button-container">
                    <button id="sell-confirm">Sell All</button>
                    <button id="sell-cancel">Cancel</button>
                </div>
            </div>`;
        } else {
            defaultModalElement.innerHTML = `
            <div class="content">
                <p>Sell all <span class="${rarity}">${rarity}</span> equipment?</p>
                <div class="button-container">
                    <button id="sell-confirm">Sell All</button>
                    <button id="sell-cancel">Cancel</button>
                </div>
            </div>`;
        }

        let confirm = document.querySelector('#sell-confirm');
        let cancel = document.querySelector('#sell-cancel');
        confirm.onclick = function () {
            sellAll(rarity);
            defaultModalElement.style.display = "none";
            defaultModalElement.innerHTML = "";
            openInv.style.filter = "brightness(100%)";
        };
        cancel.onclick = function () {
            sfxDecline.play();
            defaultModalElement.style.display = "none";
            defaultModalElement.innerHTML = "";
            openInv.style.filter = "brightness(100%)";
        };
    };
    sellRarityElement.onclick = function () {
        sfxOpen.play();
    };
    sellRarityElement.onchange = function () {
        let rarity = sellRarityElement.value;
        sellRarityElement.className = rarity;
    };
}

// Closes inventory
const closeInventory = () => {
    sfxDecline.play();

    let openInv = document.querySelector('#inventory');
    let dimDungeon = document.querySelector('#dungeon-main');
    openInv.style.display = "none";
    dimDungeon.style.filter = "brightness(100%)";
    inventoryOpen = false;
    if (!dungeon.status.paused) {
        dungeon.status.exploring = true;
    }
}

// Continue exploring if inventory is not open and the game is not paused
const continueExploring = () => {
    if (!inventoryOpen && !dungeon.status.paused) {
        dungeon.status.exploring = true;
    }
}

// Shows the level up popup
const lvlupPopup = () => {
    sfxLvlUp.play();
    addCombatLog(`You leveled up! (Lv.${player.lvl - player.exp.lvlGained} > Lv.${player.lvl})`);

    // Recover 20% extra hp on level up
    player.stats.hp += Math.round((player.stats.hpMax * 20) / 100);
    playerLoadStats();

    // Check if we're in combat and delay showing the level up panel
    if (player.inCombat) {
        // Set a flag to show the popup after combat ends
        // Only show popup at the end of combat to avoid interrupting boss battles
        player.pendingLevelUp = true;
    } else {
        // Show popup choices immediately if not in combat
        showLevelUpChoices();
    }
}

// Shows the level up choices panel
const showLevelUpChoices = () => {
    // Show popup choices
    lvlupPanel.style.display = "flex";
    
    // If in combat panel, dim it
    if (combatPanel && combatPanel.style.display === "flex") {
        combatPanel.style.filter = "brightness(50%)";
    }
    
    const percentages = {
        "hp": 10,
        "atk": 8,
        "def": 8,
        "atkSpd": 3,
        "vamp": 0.5,
        "critRate": 1,
        "critDmg": 6
    };
    generateLvlStats(2, percentages);
}

// Generates random stats for level up popup
const generateLvlStats = (rerolls, percentages) => {
    let selectedStats = [];
    let stats = ["hp", "atk", "def", "atkSpd", "vamp", "critRate", "critDmg"];
    while (selectedStats.length < 3) {
        let randomIndex = Math.floor(Math.random() * stats.length);
        if (!selectedStats.includes(stats[randomIndex])) {
            selectedStats.push(stats[randomIndex]);
        }
    }

    const loadLvlHeader = () => {
        lvlupSelect.innerHTML = `
            <h1>Level Up!</h1>
            <div class="content-head">
                <h4>Remaining: ${player.exp.lvlGained}</h4>
                <button id="lvlReroll">Reroll ${rerolls}/2</button>
            </div>
        `;
    }
    loadLvlHeader();

    const lvlReroll = document.querySelector("#lvlReroll");
    lvlReroll.addEventListener("click", function () {
        if (rerolls > 0) {
            sfxSell.play();
            rerolls--;
            loadLvlHeader();
            generateLvlStats(rerolls, percentages);
        } else {
            sfxDeny.play();
        }
    });

    try {
        // Create a button for each selected stat (3 total)
        for (let i = 0; i < selectedStats.length; i++) {
            let button = document.createElement("button");
            button.id = "lvlSlot" + i;
            button.className = "lvl-option"; // Add a class for easier selection

            // Get the appropriate icon for the stat
            let statIcon;
            switch(selectedStats[i]) {
                case "hp":
                    statIcon = "fas fa-heart";
                    break;
                case "atk":
                    statIcon = "ra ra-sword";
                    break;
                case "def":
                    statIcon = "ra ra-round-shield";
                    break;
                case "atkSpd":
                    statIcon = "ra ra-plain-dagger";
                    break;
                case "vamp":
                    statIcon = "ra ra-dripping-blade";
                    break;
                case "critRate":
                    statIcon = "ra ra-lightning-bolt";
                    break;
                case "critDmg":
                    statIcon = "ra ra-focused-lightning";
                    break;
                default:
                    statIcon = "ra ra-upgrade";
            }
            
            // Format the stat name for display
            let formattedStat = selectedStats[i];
            
            // Replace abbreviations with full words
            formattedStat = formattedStat
                .replace("critRate", "Critical Rate")
                .replace("critDmg", "Critical Damage")
                .replace("atkSpd", "Attack Speed")
                .replace("atk", "Attack")
                .replace("def", "Defense")
                .replace("vamp", "Vampirism")
                .replace("hp", "HP");
            
            // Create the button content with icon and left-aligned text
            button.innerHTML = `
                <div class="lvl-option-content">
                    <i class="${statIcon}"></i>
                    <div class="lvl-option-text">
                        <h3>${formattedStat} UP</h3>
                        <p>Increase bonus ${formattedStat} by ${percentages[selectedStats[i]]}%.</p>
                    </div>
                </div>
            `;

            // Increase the selected stat for player
            button.addEventListener("click", function () {
                sfxItem.play();
                player.bonusStats[selectedStats[i]] += percentages[selectedStats[i]];

                if (player.exp.lvlGained > 1) {
                    player.exp.lvlGained--;
                    generateLvlStats(2, percentages);
                } else {
                    player.exp.lvlGained = 0;
                    lvlupPanel.style.display = "none";
                    combatPanel.style.filter = "brightness(100%)";
                    leveled = false;
                }

                playerLoadStats();
                saveData();
            });

            lvlupSelect.appendChild(button);
        }
        
        // Add circular progress bar for auto-selection
        const progressContainer = document.createElement('div');
        progressContainer.className = 'circular-progress-container';
        progressContainer.style.position = 'absolute';
        progressContainer.style.top = '10px';
        progressContainer.style.right = '10px';
        progressContainer.style.width = '50px';
        progressContainer.style.height = '50px';
        progressContainer.innerHTML = `
            <div class="circular-progress">
                <svg viewBox="0 0 100 100">
                    <circle class="progress-bg" cx="50" cy="50" r="45"></circle>
                    <circle class="progress-bar" cx="50" cy="50" r="45" style="stroke-dashoffset: 283;"></circle>
                </svg>
            </div>
        `;
        lvlupSelect.appendChild(progressContainer);
        
        // Start auto-selection timer
        let autoProgress = 0;
        const autoDuration = 8000; // 8 seconds before auto-selecting
        const autoInterval = 100; // Update every 100ms
        const progressCircle = progressContainer.querySelector(".progress-bar");
        const circumference = 283; // 2 * PI * r (r = 45)
        
        // Variable to track if mouse movement was detected
        let mouseMovementDetected = false;
        
        // Listen for mouse movement
        lvlupPanel.addEventListener('mousemove', function() {
            mouseMovementDetected = true;
            // Reset progress when mouse moves
            autoProgress = 0;
            if (progressCircle) {
                progressCircle.style.strokeDashoffset = circumference;
            }
            // Reset after 1 second of no movement
            setTimeout(() => {
                mouseMovementDetected = false;
            }, 1000);
        });
        
        // Auto-selection timer
        const autoTimer = setInterval(() => {
            if (!mouseMovementDetected) {
                autoProgress += autoInterval;
                
                // Update progress circle
                if (progressCircle) {
                    const offset = circumference - (autoProgress / autoDuration) * circumference;
                    progressCircle.style.strokeDashoffset = offset;
                }
                
                // When progress reaches 100%, auto-select the first option
                if (autoProgress >= autoDuration) {
                    clearInterval(autoTimer);
                    // Click the first level up option
                    const firstOption = document.querySelector("#lvlSlot0");
                    if (firstOption) {
                        firstOption.click();
                    }
                }
            }
        }, autoInterval);
    } catch (err) {
        console.error("Error generating level-up options:", err);
    }
}

// Set a default name if player name is missing or empty
const getPlayerName = () => {
    // Check if player object exists and has a name property that's not empty
    if (player && player.name && player.name.trim() !== "") {
        return player.name;
    }
    return "Hero"; // Default name
}