window.addEventListener("load", function () {
    // Store combat panel reference globally
    window.combatPanel = document.querySelector("#combatPanel");
    
    if (player === null) {
        runLoad("character-creation", "flex");
    } else {
        let target = document.querySelector("#title-screen");
        target.style.display = "flex";
    }

    // Title Screen Validation
    document.querySelector("#title-screen").addEventListener("click", function () {
        const player = JSON.parse(localStorage.getItem("playerData"));
        if (player.allocated) {
            enterDungeon();
        } else {
            characterRandomizer();
        }
    });

    // Prevent double-click zooming on mobile devices
    document.ondblclick = function (e) {
        e.preventDefault();
    }

    // Add 'R' key listener for game restart with buffed enemy scaling
    document.addEventListener('keydown', function(event) {
        if (event.key.toLowerCase() === 'r') {
            // Show confirmation modal for complete reset
            defaultModalElement.style.display = "flex";
            defaultModalElement.innerHTML = `
            <div class="content">
                <h3>Complete Reset</h3>
                <p>This will clear ALL game data and refresh the page. Continue?</p>
                <div class="button-container">
                    <button id="complete-reset-confirm">Yes, Reset Everything</button>
                    <button id="complete-reset-cancel">Cancel</button>
                </div>
            </div>`;
            
            document.querySelector("#complete-reset-confirm").addEventListener("click", function() {
                sfxConfirm.play();
                // Clear all localStorage
                localStorage.clear();
                
                // Wait a moment for sound to play, then reload page
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            });
            
            document.querySelector("#complete-reset-cancel").addEventListener("click", function() {
                sfxDecline.play();
                defaultModalElement.style.display = "none";
                defaultModalElement.innerHTML = "";
            });
        }
    });

    // Submit Name
    document.querySelector("#name-submit").addEventListener("submit", function (e) {
        e.preventDefault();
        let playerName = document.querySelector("#name-input").value;

        var format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
        if (format.test(playerName)) {
            document.querySelector("#alert").innerHTML = "Your name cannot contain special characters!";
        } else {
            if (playerName.length < 3 || playerName.length > 15) {
                document.querySelector("#alert").innerHTML = "Name should be between 3-15 characters!";
            } else {
                player = {
                    name: playerName.trim(), // Ensure the name is trimmed
                    lvl: 1,
                    heroImage: "1p.png", // Default hero image
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
                        atkSpd: 0.4,
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
                calculateStats();
                player.stats.hp = player.stats.hpMax;
                saveData();
                document.querySelector("#character-creation").style.display = "none";
                runLoad("title-screen", "flex");
            }
        }
    });

    // Unequip all items
    document.querySelector("#unequip-all").addEventListener("click", function () {
        sfxOpen.play();

        dungeon.status.exploring = false;
        let dimTarget = document.querySelector('#inventory');
        dimTarget.style.filter = "brightness(50%)";
        defaultModalElement.style.display = "flex";
        defaultModalElement.innerHTML = `
        <div class="content">
            <p>Unequip all your items?</p>
            <div class="button-container">
                <button id="unequip-confirm">Unequip</button>
                <button id="unequip-cancel">Cancel</button>
            </div>
        </div>`;
        let confirm = document.querySelector('#unequip-confirm');
        let cancel = document.querySelector('#unequip-cancel');
        confirm.onclick = function () {
            sfxUnequip.play();
            unequipAll();
            continueExploring();
            defaultModalElement.style.display = "none";
            defaultModalElement.innerHTML = "";
            dimTarget.style.filter = "brightness(100%)";
        };
        cancel.onclick = function () {
            sfxDecline.play();
            continueExploring();
            defaultModalElement.style.display = "none";
            defaultModalElement.innerHTML = "";
            dimTarget.style.filter = "brightness(100%)";
        };
    });

    document.querySelector("#menu-btn").addEventListener("click", function () {
        closeInventory();

        dungeon.status.exploring = false;
        let dimDungeon = document.querySelector('#dungeon-main');
        dimDungeon.style.filter = "brightness(50%)";
        menuModalElement.style.display = "flex";

        // Menu tab
        menuModalElement.innerHTML = `
        <div class="content">
            <div class="content-head">
                <h3>Menu</h3>
                <p id="close-menu"><i class="fa fa-xmark"></i></p>
            </div>
            <button id="player-menu"><i class="fas fa-user"></i>${player.name}</button>
            <button id="stats">Current Run</button>
            <button id="volume-btn">Volume Settings</button>
            <button id="export-import">Export/Import Data</button>
            <button id="quit-run">Abandon</button>
        </div>`;

        let close = document.querySelector('#close-menu');
        let playerMenu = document.querySelector('#player-menu');
        let runMenu = document.querySelector('#stats');
        let quitRun = document.querySelector('#quit-run');
        let exportImport = document.querySelector('#export-import');
        let volumeSettings = document.querySelector('#volume-btn');

        // Player profile click function
        playerMenu.onclick = function () {
            sfxOpen.play();
            let playTime = new Date(player.playtime * 1000).toISOString().slice(11, 19);
            menuModalElement.style.display = "none";
            defaultModalElement.style.display = "flex";
            defaultModalElement.innerHTML = `
            <div class="content" id="profile-tab">
                <div class="content-head">
                    <h3>Statistics</h3>
                    <p id="profile-close"><i class="fa fa-xmark"></i></p>
                </div>
                <p>${player.name} Lv.${player.lvl}</p>
                <p>Kills: ${nFormatter(player.kills)}</p>
                <p>Deaths: ${nFormatter(player.deaths)}</p>
                <p>Playtime: ${playTime}</p>
            </div>`;
            let profileTab = document.querySelector('#profile-tab');
            profileTab.style.width = "15rem";
            let profileClose = document.querySelector('#profile-close');
            profileClose.onclick = function () {
                sfxDecline.play();
                defaultModalElement.style.display = "none";
                defaultModalElement.innerHTML = "";
                menuModalElement.style.display = "flex";
            };
        };

        // Dungeon run click function
        runMenu.onclick = function () {
            sfxOpen.play();
            let runTime = new Date(dungeon.statistics.runtime * 1000).toISOString().slice(11, 19);
            menuModalElement.style.display = "none";
            defaultModalElement.style.display = "flex";
            defaultModalElement.innerHTML = `
            <div class="content" id="run-tab">
                <div class="content-head">
                    <h3>Current Run</h3>
                    <p id="run-close"><i class="fa fa-xmark"></i></p>
                </div>
                <p>${player.name} Lv.${player.lvl} (${player.skills})</p>
                <p>Blessing Lvl.${player.blessing}</p>
                <p>Curse Lvl.${Math.round((dungeon.settings.enemyScaling - 1) * 10)}</p>
                <p>Kills: ${nFormatter(dungeon.statistics.kills)}</p>
                <p>Runtime: ${runTime}</p>
            </div>`;
            let runTab = document.querySelector('#run-tab');
            runTab.style.width = "15rem";
            let runClose = document.querySelector('#run-close');
            runClose.onclick = function () {
                sfxDecline.play();
                defaultModalElement.style.display = "none";
                defaultModalElement.innerHTML = "";
                menuModalElement.style.display = "flex";
            };
        };

        // Quit the current run
        quitRun.onclick = function () {
            sfxOpen.play();
            menuModalElement.style.display = "none";
            defaultModalElement.style.display = "flex";
            defaultModalElement.innerHTML = `
            <div class="content">
                <p>Do you want to abandon this run?</p>
                <div class="button-container">
                    <button id="quit-run">Abandon</button>
                    <button id="cancel-quit">Cancel</button>
                </div>
            </div>`;
            let quit = document.querySelector('#quit-run');
            let cancel = document.querySelector('#cancel-quit');
            quit.onclick = function () {
                sfxConfirm.play();
                // Clear out everything, send the player back to meny and clear progress.
                bgmDungeon.stop();
                let dimDungeon = document.querySelector('#dungeon-main');
                dimDungeon.style.filter = "brightness(100%)";
                dimDungeon.style.display = "none";
                menuModalElement.style.display = "none";
                menuModalElement.innerHTML = "";
                defaultModalElement.style.display = "none";
                defaultModalElement.innerHTML = "";
                runLoad("title-screen", "flex");
                clearInterval(dungeonTimer);
                clearInterval(playTimer);
                progressReset();
            };
            cancel.onclick = function () {
                sfxDecline.play();
                defaultModalElement.style.display = "none";
                defaultModalElement.innerHTML = "";
                menuModalElement.style.display = "flex";
            };
        };

        // Opens the volume settings
        volumeSettings.onclick = function () {
            sfxOpen.play();

            let master = volume.master * 100;
            let bgm = (volume.bgm * 100) * 2;
            let sfx = volume.sfx * 100;
            menuModalElement.style.display = "none";
            defaultModalElement.style.display = "flex";
            defaultModalElement.innerHTML = `
            <div class="content" id="volume-tab">
                <div class="content-head">
                    <h3>Volume</h3>
                    <p id="volume-close"><i class="fa fa-xmark"></i></p>
                </div>
                <label id="master-label" for="master-volume">Master (${master}%)</label>
                <input type="range" id="master-volume" min="0" max="100" value="${master}">
                <label id="bgm-label" for="bgm-volume">BGM (${bgm}%)</label>
                <input type="range" id="bgm-volume" min="0" max="100" value="${bgm}">
                <label id="sfx-label" for="sfx-volume">SFX (${sfx}%)</label>
                <input type="range" id="sfx-volume" min="0" max="100" value="${sfx}">
                <button id="apply-volume">Apply</button>
            </div>`;
            let masterVol = document.querySelector('#master-volume');
            let bgmVol = document.querySelector('#bgm-volume');
            let sfxVol = document.querySelector('#sfx-volume');
            let applyVol = document.querySelector('#apply-volume');
            let volumeTab = document.querySelector('#volume-tab');
            volumeTab.style.width = "15rem";
            let volumeClose = document.querySelector('#volume-close');
            volumeClose.onclick = function () {
                sfxDecline.play();
                defaultModalElement.style.display = "none";
                defaultModalElement.innerHTML = "";
                menuModalElement.style.display = "flex";
            };

            // Volume Control
            masterVol.oninput = function () {
                master = this.value;
                document.querySelector('#master-label').innerHTML = `Master (${master}%)`;
            };

            bgmVol.oninput = function () {
                bgm = this.value;
                document.querySelector('#bgm-label').innerHTML = `BGM (${bgm}%)`;
            };

            sfxVol.oninput = function () {
                sfx = this.value;
                document.querySelector('#sfx-label').innerHTML = `SFX (${sfx}%)`;
            };

            applyVol.onclick = function () {
                volume.master = master / 100;
                volume.bgm = (bgm / 100) / 2;
                volume.sfx = sfx / 100;
                bgmDungeon.stop();
                setVolume();
                bgmDungeon.play();
                saveData();
            };
        };

        // Export/Import Save Data
        exportImport.onclick = function () {
            sfxOpen.play();
            let exportedData = exportData();
            menuModalElement.style.display = "none";
            defaultModalElement.style.display = "flex";
            defaultModalElement.innerHTML = `
            <div class="content" id="ei-tab">
                <div class="content-head">
                    <h3>Export/Import Data</h3>
                    <p id="ei-close"><i class="fa fa-xmark"></i></p>
                </div>
                <h4>Export Data</h4>
                <input type="text" id="export-input" autocomplete="off" value="${exportedData}" readonly>
                <button id="copy-export">Copy</button>
                <h4>Import Data</h4>
                <input type="text" id="import-input" autocomplete="off">
                <button id="data-import">Import</button>
            </div>`;
            let eiTab = document.querySelector('#ei-tab');
            eiTab.style.width = "15rem";
            let eiClose = document.querySelector('#ei-close');
            let copyExport = document.querySelector('#copy-export')
            let dataImport = document.querySelector('#data-import');
            let importInput = document.querySelector('#import-input');
            copyExport.onclick = function () {
                sfxConfirm.play();
                let copyText = document.querySelector('#export-input');
                copyText.select();
                copyText.setSelectionRange(0, 99999);
                navigator.clipboard.writeText(copyText.value);
                copyExport.innerHTML = "Copied!";
            }
            dataImport.onclick = function () {
                importData(importInput.value);
            };
            eiClose.onclick = function () {
                sfxDecline.play();
                defaultModalElement.style.display = "none";
                defaultModalElement.innerHTML = "";
                menuModalElement.style.display = "flex";
            };
        };

        // Close menu
        close.onclick = function () {
            sfxDecline.play();
            continueExploring();
            menuModalElement.style.display = "none";
            menuModalElement.innerHTML = "";
            dimDungeon.style.filter = "brightness(100%)";
        };
    });
});

// Function to restart the game with buffed enemy scaling
const restartGameWithBuffedEnemies = () => {
    sfxConfirm.play();
    
    // Clear existing intervals
    if (dungeonTimer) clearInterval(dungeonTimer);
    if (playTimer) clearInterval(playTimer);
    if (combatTimer) clearInterval(combatTimer);
    
    // Stop music
    if (bgmDungeon && bgmDungeon.playing()) bgmDungeon.stop();
    if (bgmBattleMain && bgmBattleMain.playing()) bgmBattleMain.stop();
    if (bgmBattleGuardian && bgmBattleGuardian.playing()) bgmBattleGuardian.stop();
    if (bgmBattleBoss && bgmBattleBoss.playing()) bgmBattleBoss.stop();
    
    // Reset dungeon with buffed enemy scaling
    if (dungeon) {
        dungeon = {
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
                enemyBaseStats: 1.5, // Buffed base stats
                enemyScaling: 1.25,  // Buffed scaling
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
            enemyMultipliers: {
                hp: 1.5,       // Buffed HP
                atk: 1.25,     // Buffed attack
                def: 1.25,     // Buffed defense
                atkSpd: 1.2,   // Slightly faster attacks
                vamp: 1,
                critRate: 1.2, // More crits
                critDmg: 1.2   // Harder crits
            }
        };
    }
    
    // Reset player
    if (player) {
        player.stats.hp = 0; // Set to 0 to trigger death reset
        player.inCombat = false;
        player.deaths++;
    }
    
    // Save the modified data
    saveData();
    
    // Return to title screen
    let dimDungeon = document.querySelector('#dungeon-main');
    if (dimDungeon) {
        dimDungeon.style.filter = "brightness(100%)";
        dimDungeon.style.display = "none";
    }
    
    // Hide any open panels
    const combatPanel = document.querySelector('#combatPanel');
    if (combatPanel) combatPanel.style.display = "none";
    
    // Show notification
    defaultModalElement.style.display = "flex";
    defaultModalElement.innerHTML = `
    <div class="content">
        <h3>Game Restarted</h3>
        <p>Enemies have been buffed to provide a greater challenge!</p>
        <div class="button-container">
            <button id="restart-confirm">OK</button>
        </div>
    </div>`;
    
    document.querySelector("#restart-confirm").addEventListener("click", function() {
        sfxConfirm.play();
        defaultModalElement.style.display = "none";
        defaultModalElement.innerHTML = "";
        runLoad("title-screen", "flex");
    });
}

// Loading Screen
const runLoad = (id, display) => {
    let loader = document.querySelector("#loading");
    loader.style.display = "flex";
    setTimeout(async () => {
        loader.style.display = "none";
        document.querySelector(`#${id}`).style.display = `${display}`;
    }, 1000);
}

// Start the game
const enterDungeon = () => {
    sfxConfirm.play();
    document.querySelector("#title-screen").style.display = "none";
    runLoad("dungeon-main", "flex");
    if (player.inCombat) {
        enemy = JSON.parse(localStorage.getItem("enemyData"));
        showCombatInfo();
        startCombat(bgmBattleMain);
    } else {
        // Use safelyPlayDungeonMusic if it exists, otherwise fall back to direct play
        if (typeof safelyPlayDungeonMusic === 'function') {
            safelyPlayDungeonMusic();
        } else {
            bgmDungeon.play();
        }
    }
    if (player.stats.hp == 0) {
        progressReset();
    }
    initialDungeonLoad();
    playerLoadStats();
}

// Save all the data into local storage
const saveData = () => {
    const playerData = JSON.stringify(player);
    const dungeonData = JSON.stringify(dungeon);
    const enemyData = JSON.stringify(enemy);
    const volumeData = JSON.stringify(volume);
    localStorage.setItem("playerData", playerData);
    localStorage.setItem("dungeonData", dungeonData);
    localStorage.setItem("enemyData", enemyData);
    localStorage.setItem("volumeData", volumeData);
}

// Calculate player stats from base stats, equipped items, and bonus stats
const calculateStats = () => {
    let bonusHpPct = player.bonusStats.hp;
    let bonusAtkPct = player.bonusStats.atk;
    let bonusDefPct = player.bonusStats.def;
    let bonusAtkSpdPct = player.bonusStats.atkSpd;
    let bonusVampPct = player.bonusStats.vamp;
    let bonusCritRatePct = player.bonusStats.critRate;
    let bonusCritDmgPct = player.bonusStats.critDmg;

    player.stats.hpMax = Math.round(player.baseStats.hp * (1 + (bonusHpPct / 100)) + player.equippedStats.hp);
    player.stats.atk = Math.round(player.baseStats.atk * (1 + (bonusAtkPct / 100)) + player.equippedStats.atk);
    player.stats.def = Math.round(player.baseStats.def * (1 + (bonusDefPct / 100)) + player.equippedStats.def);
    player.stats.atkSpd = Number((player.baseStats.atkSpd * (1 + (bonusAtkSpdPct / 100)) + player.equippedStats.atkSpd).toFixed(2));
    player.stats.vamp = Number((player.baseStats.vamp + bonusVampPct + player.equippedStats.vamp).toFixed(2));
    player.stats.critRate = Number((player.baseStats.critRate + bonusCritRatePct + player.equippedStats.critRate).toFixed(2));
    player.stats.critDmg = Number((player.baseStats.critDmg + bonusCritDmgPct + player.equippedStats.critDmg).toFixed(2));
    
    // Caps attack speed to 2.5
    if (player.stats.atkSpd > 2.5) {
        player.stats.atkSpd = 2.5;
    }

    // Skill effects
    if (player.skills && player.skills.includes("Great Vitality")) {
        // Increases your maximum health by 20%
        player.stats.hpMax = Math.round(player.stats.hpMax + (player.stats.hpMax * 20) / 100);
    }
    if (player.skills && player.skills.includes("Golden Luck")) {
        // Crit Rate and Crit Damage are increased by 10%
        player.stats.critRate = Number((player.stats.critRate + 10).toFixed(2));
        player.stats.critDmg = Number((player.stats.critDmg + 10).toFixed(2));
    }
}

// Function to eat monster meat for HP recovery
const eatMonsterMeat = () => {
    // Check if player has monster meat
    if (!player.inventory.consumables || !player.inventory.consumables.includes("monster meat")) {
        addDungeonLog("You don't have any <span class='text-food'>monster meat</span> to consume.");
        return;
    }
    
    // Remove one monster meat from inventory
    const meatIndex = player.inventory.consumables.indexOf("monster meat");
    player.inventory.consumables.splice(meatIndex, 1);
    
    // Heal the player by exactly 25 HP
    const healAmount = 25;
    player.stats.hp = Math.min(player.stats.hp + healAmount, player.stats.hpMax);
    
    // Play eat sound
    sfxBuff.play();
    
    // Add log message
    addDungeonLog(`You ate some <span class='text-food'>monster meat</span> and recovered <span class='text-green'>${healAmount} HP</span>.`);
    
    // Update player stats
    playerLoadStats();
    saveData();
}

// Resets the progress back to start
const progressReset = () => {
    player.stats.hp = player.stats.hpMax;
    player.lvl = 1;
    player.blessing = 1;
    player.exp = {
        expCurr: 0,
        expMax: 100,
        expCurrLvl: 0,
        expMaxLvl: 100,
        lvlGained: 0
    };
    player.bonusStats = {
        hp: 0,
        atk: 0,
        def: 0,
        atkSpd: 0,
        vamp: 0,
        critRate: 0,
        critDmg: 0
    };
    player.skills = [];
    player.inCombat = false;
    dungeon.progress.floor = 1;
    dungeon.progress.room = 1;
    dungeon.statistics.kills = 0;
    dungeon.status = {
        exploring: false,
        paused: true,
        event: false,
    };
    dungeon.settings = {
        enemyBaseLvl: 1,
        enemyLvlGap: 5,
        enemyBaseStats: 1,
        enemyScaling: 1.1,
    };
    delete dungeon.enemyMultipliers;
    delete player.allocated;
    dungeon.backlog.length = 0;
    dungeon.action = 0;
    dungeon.statistics.runtime = 0;
    combatBacklog.length = 0;
    saveData();
}

// Export and Import Save Data
const exportData = () => {
    const exportedData = btoa(JSON.stringify(player));
    return exportedData;
}

const importData = (importedData) => {
    try {
        let playerImport = JSON.parse(atob(importedData));
        if (playerImport.inventory !== undefined) {
            sfxOpen.play();
            defaultModalElement.style.display = "none";
            confirmationModalElement.style.display = "flex";
            confirmationModalElement.innerHTML = `
            <div class="content">
                <p>Are you sure you want to import this data? This will erase the current data and reset your dungeon progress.</p>
                <div class="button-container">
                    <button id="import-btn">Import</button>
                    <button id="cancel-btn">Cancel</button>
                </div>
            </div>`;
            let confirm = document.querySelector("#import-btn");
            let cancel = document.querySelector("#cancel-btn");
            confirm.onclick = function () {
                sfxConfirm.play();
                player = playerImport;
                saveData();
                bgmDungeon.stop();
                let dimDungeon = document.querySelector('#dungeon-main');
                dimDungeon.style.filter = "brightness(100%)";
                dimDungeon.style.display = "none";
                menuModalElement.style.display = "none";
                menuModalElement.innerHTML = "";
                confirmationModalElement.style.display = "none";
                confirmationModalElement.innerHTML = "";
                defaultModalElement.style.display = "none";
                defaultModalElement.innerHTML = "";
                runLoad("title-screen", "flex");
                clearInterval(dungeonTimer);
                clearInterval(playTimer);
                progressReset();
            }
            cancel.onclick = function () {
                sfxDecline.play();
                confirmationModalElement.style.display = "none";
                confirmationModalElement.innerHTML = "";
                defaultModalElement.style.display = "flex";
            }
        } else {
            sfxDeny.play();
        }
    } catch (err) {
        sfxDeny.play();
    }
}

const characterRandomizer = () => {
    // Available passive skills
    const passiveSkills = [
        {name: "Remnant Razor", description: "Attacks deal extra 8% of enemies' current health on hit."},
        {name: "Titan's Will", description: "Attacks deal extra 5% of your maximum health on hit."},
        {name: "Devastator", description: "Deal 30% more damage but you lose 30% base attack speed."},
        {name: "Rampager", description: "Increase attack by 5 after each hit. Stack resets after battle."},
        {name: "Blade Dance", description: "Gain increased attack speed after each hit. Stack resets after battle."},
        {name: "Paladin's Heart", description: "You receive 25% less damage permanently."},
        {name: "Aegis Thorns", description: "Enemies receive 15% of the damage they dealt."}
    ];
    
    // Character archetypes for flavor
    const archetypes = [
        {name: "Warrior", icon: "ra ra-sword"},
        {name: "Knight", icon: "ra ra-round-shield"},
        {name: "Assassin", icon: "ra ra-plain-dagger"},
        {name: "Berserker", icon: "ra ra-axe"},
        {name: "Mage", icon: "ra ra-burning-embers"},
        {name: "Ranger", icon: "ra ra-bow-arrow"},
        {name: "Paladin", icon: "ra ra-shield"},
        {name: "Monk", icon: "ra ra-doubled"},
        {name: "Druid", icon: "ra ra-pine-tree"}
    ];
    
    // Generate a random character name based on archetype
    const generateRandomName = (archetype) => {
        const namesByArchetype = {
            "Warrior": ["Thorgrim", "Valeria", "Krom", "Darius", "Brunhild", "Ragnar", "Freya", "Conan", "Athena", "Leonidas"],
            "Knight": ["Galahad", "Lancelot", "Guinevere", "Arthur", "Percival", "Roland", "Elaine", "Tristan", "Gareth", "Bedivere"],
            "Assassin": ["Ezio", "Sombra", "Kage", "Nightshade", "Viper", "Wraith", "Shade", "Whisper", "Raven", "Silhouette"],
            "Berserker": ["Ragnar", "Olaf", "Fenrir", "Skadi", "Bjorn", "Astrid", "Ulfric", "Helga", "Rollo", "Sigrid"],
            "Mage": ["Merlin", "Morgana", "Gandalf", "Elminster", "Raistlin", "Seraphina", "Zephyr", "Alatar", "Nimue", "Thalia"],
            "Ranger": ["Legolas", "Artemis", "Orion", "Skye", "Vex", "Ashe", "Hawk", "Sylvanas", "Talon", "Willow"],
            "Paladin": ["Uther", "Solaire", "Tyrael", "Aveline", "Cassius", "Ophelia", "Radiant", "Lightbringer", "Justicar", "Sanctus"],
            "Monk": ["Zenyatta", "Lee", "Iroh", "Aang", "Lotus", "Serenity", "Harmony", "Tranquil", "Enlightened", "Dao"],
            "Druid": ["Malfurion", "Thalia", "Galen", "Sylvia", "Oakhart", "Willow", "Thorn", "Ivy", "Fern", "Grove"]
        };
        
        // Select a random name from the appropriate list
        const nameList = namesByArchetype[archetype.name] || ["Adventurer", "Hero", "Champion"];
        return nameList[Math.floor(Math.random() * nameList.length)];
    };
    
    // Generate a random character
    const generateRandomCharacter = () => {
        // Generate random stat allocation (min 5, total 40 points)
        const totalPoints = 40;
        const minStatValue = 5;
        const stats = {
            hp: minStatValue,
            atk: minStatValue,
            def: minStatValue,
            atkSpd: minStatValue
        };
        
        // Distribute remaining points randomly
        let remainingPoints = totalPoints - (minStatValue * 4);
        while (remainingPoints > 0) {
            const statKeys = Object.keys(stats);
            const randomStat = statKeys[Math.floor(Math.random() * statKeys.length)];
            stats[randomStat]++;
            remainingPoints--;
        }
        
        // Calculate actual stat values
        const calculatedStats = {
            hp: 50 * stats.hp,
            atk: 10 * stats.atk,
            def: 10 * stats.def,
            atkSpd: 0.3 + (0.01 * stats.atkSpd)
        };
        
        // Select 1-2 random passive skills
        const numSkills = Math.random() < 0.3 ? 2 : 1; // 30% chance for 2 skills
        const selectedSkills = [];
        const availableSkills = [...passiveSkills];
        
        for (let i = 0; i < numSkills; i++) {
            if (availableSkills.length === 0) break;
            const randomIndex = Math.floor(Math.random() * availableSkills.length);
            selectedSkills.push(availableSkills[randomIndex]);
            availableSkills.splice(randomIndex, 1);
        }
        
        // Select random archetype
        const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
        
        // Generate a random name
        const name = generateRandomName(archetype);
        
        // Assign a random hero image from 1-14
        const heroImageNumber = Math.floor(Math.random() * 14) + 1;
        const heroImage = `${heroImageNumber}p.png`;
        
        return {
            name,
            archetype,
            stats,
            calculatedStats,
            skills: selectedSkills,
            heroImage
        };
    };
    
    // Generate three random characters
    const characters = [
        generateRandomCharacter(),
        generateRandomCharacter(),
        generateRandomCharacter()
    ];
    
    // Select one character to receive a bonus
    const bonusIndex = Math.floor(Math.random() * 3);
    characters[bonusIndex].hasBonus = true;
    
    // Apply bonus to the selected character (10% boost to all stats)
    const bonusCharacter = characters[bonusIndex];
    bonusCharacter.originalStats = {
        hp: bonusCharacter.calculatedStats.hp,
        atk: bonusCharacter.calculatedStats.atk,
        def: bonusCharacter.calculatedStats.def,
        atkSpd: bonusCharacter.calculatedStats.atkSpd
    };
    bonusCharacter.calculatedStats.hp = Math.floor(bonusCharacter.calculatedStats.hp * 1.1);
    bonusCharacter.calculatedStats.atk = Math.floor(bonusCharacter.calculatedStats.atk * 1.1);
    bonusCharacter.calculatedStats.def = Math.floor(bonusCharacter.calculatedStats.def * 1.1);
    bonusCharacter.calculatedStats.atkSpd = parseFloat((bonusCharacter.calculatedStats.atkSpd * 1.1).toFixed(2));
    
    // Display the character selection modal
    defaultModalElement.style.display = "flex";
    document.querySelector("#title-screen").style.filter = "brightness(50%)";
    
    // Create character cards
    let characterCards = '';
    characters.forEach((character, index) => {
        const skillsList = character.skills.map(skill => 
            `<p class="Legendary"><i class="ra ra-star-swirl"></i> ${skill.name}</p>
             <p class="skill-description">${skill.description}</p>`
        ).join('');
        
        // Format stats with green color and up arrow for bonus character
        let statsHtml = '';
        if (character.hasBonus) {
            statsHtml = `
                <p><i class="fas fa-heart"></i> HP: <span style="color: #2ecc71;">${character.calculatedStats.hp} <i class="fas fa-arrow-up"></i></span></p>
                <p><i class="ra ra-sword"></i> ATK: <span style="color: #2ecc71;">${character.calculatedStats.atk} <i class="fas fa-arrow-up"></i></span></p>
                <p><i class="ra ra-round-shield"></i> DEF: <span style="color: #2ecc71;">${character.calculatedStats.def} <i class="fas fa-arrow-up"></i></span></p>
                <p><i class="ra ra-plain-dagger"></i> ATK.SPD: <span style="color: #2ecc71;">${character.calculatedStats.atkSpd.toFixed(2)} <i class="fas fa-arrow-up"></i></span></p>
            `;
        } else {
            statsHtml = `
                <p><i class="fas fa-heart"></i> HP: ${character.calculatedStats.hp}</p>
                <p><i class="ra ra-sword"></i> ATK: ${character.calculatedStats.atk}</p>
                <p><i class="ra ra-round-shield"></i> DEF: ${character.calculatedStats.def}</p>
                <p><i class="ra ra-plain-dagger"></i> ATK.SPD: ${character.calculatedStats.atkSpd.toFixed(2)}</p>
            `;
        }
        
        const bonusIndicator = character.hasBonus ? 
            `<div class="bonus-pill">+10% Stats</div>` : '';
        
        characterCards += `
        <div class="character-card${character.hasBonus ? ' bonus-character' : ''}" data-index="${index}">
            ${bonusIndicator}
            <div class="character-header">
                <div class="character-image">
                    <img src="./assets/sprites/heros/${character.heroImage}" alt="${character.name}" class="hero-portrait">
                </div>
                <div class="character-title">
                    <h3><i class="${character.archetype.icon}"></i> ${character.archetype.name}</h3>
                    <span class="character-name">${character.name}</span>
                </div>
            </div>
            <div class="character-stats">
                ${statsHtml}
            </div>
            <div class="character-skills">
                <h4>Passive Skills:</h4>
                ${skillsList}
            </div>
            <div class="select-character-btn">Select</div>
        </div>`;
    });
    
    // Display the character selection modal
    defaultModalElement.innerHTML = `
    <div class="content" id="character-selection">
        <div class="content-head">
            <h3>Choose Your Hero</h3>
            <p id="randomizer-close"><i class="fa fa-xmark"></i></p>
        </div>
        <div class="character-container">
            ${characterCards}
        </div>
    </div>`;
    
    // Add event listeners to the entire character cards
    document.querySelectorAll('.character-card').forEach(card => {
        card.addEventListener('click', function() {
            const characterIndex = parseInt(this.dataset.index);
            const selectedCharacter = characters[characterIndex];
            
            // Set player base stats
            player.baseStats = {
                hp: selectedCharacter.calculatedStats.hp,
                atk: selectedCharacter.calculatedStats.atk,
                def: selectedCharacter.calculatedStats.def,
                pen: 0,
                atkSpd: selectedCharacter.calculatedStats.atkSpd,
                vamp: 0,
                critRate: 0,
                critDmg: 50
            };
            
            // Set player skills
            objectValidation();
            selectedCharacter.skills.forEach(skill => {
                player.skills.push(skill.name);
                
                // Apply immediate effects for certain skills
                if (skill.name === "Devastator") {
                    player.baseStats.atkSpd = player.baseStats.atkSpd - ((30 * player.baseStats.atkSpd) / 100);
                }
            });
            
            // Save hero image and name explicitly
            player.heroImage = selectedCharacter.heroImage;
            player.name = selectedCharacter.name;
            
            console.log("Selected character name:", player.name); // Debug log
            
            // Proceed to dungeon
            player.allocated = true;
            enterDungeon();
            player.stats.hp = player.stats.hpMax;
            playerLoadStats();
            defaultModalElement.style.display = "none";
            defaultModalElement.innerHTML = "";
            document.querySelector("#title-screen").style.filter = "brightness(100%)";
        });
    });
    
    // Add event listener to close button
    document.querySelector("#randomizer-close").addEventListener('click', function() {
        sfxDecline.play();
        defaultModalElement.style.display = "none";
        defaultModalElement.innerHTML = "";
        document.querySelector("#title-screen").style.filter = "brightness(100%)";
    });
}

const objectValidation = () => {
    if (player.skills == undefined) {
        player.skills = [];
    }
    if (player.tempStats == undefined) {
        player.tempStats = {};
        player.tempStats.atk = 0;
        player.tempStats.atkSpd = 0;
    }
    saveData();
}
