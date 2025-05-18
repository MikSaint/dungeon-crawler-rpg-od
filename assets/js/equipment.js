const createEquipment = () => {
    const equipment = {
        category: null,
        attribute: null,
        type: null,
        rarity: null,
        lvl: null,
        tier: null,
        value: null,
        stats: [],
    };

    // Generate random equipment attribute
    const equipmentAttributes = ["Damage", "Defense"];
    equipment.attribute = equipmentAttributes[Math.floor(Math.random() * equipmentAttributes.length)];

    // Generate random equipment name and type based on attribute
    if (equipment.attribute == "Damage") {
        const equipmentCategories = ["Sword", "Axe", "Hammer", "Dagger", "Flail", "Scythe"];
        equipment.category = equipmentCategories[Math.floor(Math.random() * equipmentCategories.length)];
        equipment.type = "Weapon";
    } else if (equipment.attribute == "Defense") {
        const equipmentTypes = ["Armor", "Shield", "Helmet"];
        equipment.type = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
        if (equipment.type == "Armor") {
            const equipmentCategories = ["Plate", "Chain", "Leather"];
            equipment.category = equipmentCategories[Math.floor(Math.random() * equipmentCategories.length)];
        } else if (equipment.type == "Shield") {
            const equipmentCategories = ["Tower", "Kite", "Buckler"];
            equipment.category = equipmentCategories[Math.floor(Math.random() * equipmentCategories.length)];
        } else if (equipment.type == "Helmet") {
            const equipmentCategories = ["Great Helm", "Horned Helm"];
            equipment.category = equipmentCategories[Math.floor(Math.random() * equipmentCategories.length)];
        }
    }

    // Generate random equipment rarity
    const rarityChances = {
        "Common": 0.7,
        "Uncommon": 0.2,
        "Rare": 0.04,
        "Epic": 0.03,
        "Legendary": 0.02,
        "Heirloom": 0.01
    };

    const randomNumber = Math.random();
    let cumulativeChance = 0;

    for (let rarity in rarityChances) {
        cumulativeChance += rarityChances[rarity];
        if (randomNumber <= cumulativeChance) {
            equipment.rarity = rarity;
            break;
        }
    }

    // Determine number of times to loop based on equipment rarity
    let loopCount;
    switch (equipment.rarity) {
        case "Common":
            loopCount = 2;
            break;
        case "Uncommon":
            loopCount = 3;
            break;
        case "Rare":
            loopCount = 4;
            break;
        case "Epic":
            loopCount = 5;
            break;
        case "Legendary":
            loopCount = 6;
            break;
        case "Heirloom":
            loopCount = 8;
            break;
    }

    // Generate and append random stats to the stats array
    const physicalStats = ["atk", "atkSpd", "vamp", "critRate", "critDmg"];
    const damageyStats = ["atk", "atk", "vamp", "critRate", "critDmg", "critDmg"];
    const speedyStats = ["atkSpd", "atkSpd", "atk", "vamp", "critRate", "critRate", "critDmg"];
    const defenseStats = ["hp", "hp", "def", "def", "atk"];
    const dmgDefStats = ["hp", "def", "atk", "atk", "critRate", "critDmg"];
    let statTypes;
    if (equipment.attribute == "Damage") {
        if (equipment.category == "Axe" || equipment.category == "Scythe") {
            statTypes = damageyStats;
        } else if (equipment.category == "Dagger" || equipment.category == "Flail") {
            statTypes = speedyStats;
        } else if (equipment.category == "Hammer") {
            statTypes = dmgDefStats;
        } else {
            statTypes = physicalStats;
        }
    } else if (equipment.attribute == "Defense") {
        statTypes = defenseStats;
    }
    let equipmentValue = 0;
    for (let i = 0; i < loopCount; i++) {
        let statType = statTypes[Math.floor(Math.random() * statTypes.length)];

        // Stat scaling for equipment
        const maxLvl = dungeon.progress.floor * dungeon.settings.enemyLvlGap + (dungeon.settings.enemyBaseLvl - 1);
        const minLvl = maxLvl - (dungeon.settings.enemyLvlGap - 1);
        // Set equipment level with Lv.100 cap
        equipment.lvl = randomizeNum(minLvl, maxLvl);
        if (equipment.lvl > 100) {
            equipment.lvl = 100;
        }
        // Set stat scaling and equipment tier Tier 10 cap
        let enemyScaling = dungeon.settings.enemyScaling;
        if (enemyScaling > 2) {
            enemyScaling = 2;
        }
        let statMultiplier = (enemyScaling - 1) * equipment.lvl;
        equipment.tier = Math.round((enemyScaling - 1) * 10);
        let hpScaling = (40 * randomizeDecimal(0.5, 1.5)) + ((40 * randomizeDecimal(0.5, 1.5)) * statMultiplier);
        let atkDefScaling = (16 * randomizeDecimal(0.5, 1.5)) + ((16 * randomizeDecimal(0.5, 1.5)) * statMultiplier);
        let cdAtkSpdScaling = (3 * randomizeDecimal(0.5, 1.5)) + ((3 * randomizeDecimal(0.5, 1.5)) * statMultiplier);
        let crVampScaling = (2 * randomizeDecimal(0.5, 1.5)) + ((2 * randomizeDecimal(0.5, 1.5)) * statMultiplier);

        // Set randomized numbers to respective stats and increment sell value
        if (statType === "hp") {
            statValue = randomizeNum(hpScaling * 0.5, hpScaling);
            equipmentValue += statValue;
        } else if (statType === "atk") {
            statValue = randomizeNum(atkDefScaling * 0.5, atkDefScaling);
            equipmentValue += statValue * 2.5;
        } else if (statType === "def") {
            statValue = randomizeNum(atkDefScaling * 0.5, atkDefScaling);
            equipmentValue += statValue * 2.5;
        } else if (statType === "atkSpd") {
            statValue = randomizeDecimal(cdAtkSpdScaling * 0.5, cdAtkSpdScaling);
            if (statValue > 15) {
                statValue = 15 * randomizeDecimal(0.5, 1);
                loopCount++;
            }
            equipmentValue += statValue * 8.33;
        } else if (statType === "vamp") {
            statValue = randomizeDecimal(crVampScaling * 0.5, crVampScaling);
            if (statValue > 8) {
                statValue = 8 * randomizeDecimal(0.5, 1);
                loopCount++;
            }
            equipmentValue += statValue * 20.83;
        } else if (statType === "critRate") {
            statValue = randomizeDecimal(crVampScaling * 0.5, crVampScaling);
            if (statValue > 10) {
                statValue = 10 * randomizeDecimal(0.5, 1);
                loopCount++;
            }
            equipmentValue += statValue * 20.83;
        } else if (statType === "critDmg") {
            statValue = randomizeDecimal(cdAtkSpdScaling * 0.5, cdAtkSpdScaling);
            equipmentValue += statValue * 8.33;
        }

        // Cap maximum stat rolls for equipment rarities
        if (equipment.rarity == "Common" && loopCount > 3) {
            loopCount--;
        } else if (equipment.rarity == "Uncommon" && loopCount > 4) {
            loopCount--;
        } else if (equipment.rarity == "Rare" && loopCount > 5) {
            loopCount--;
        } else if (equipment.rarity == "Epic" && loopCount > 6) {
            loopCount--;
        } else if (equipment.rarity == "Legendary" && loopCount > 7) {
            loopCount--;
        } else if (equipment.rarity == "Heirloom" && loopCount > 9) {
            loopCount--;
        }

        // Check if stat type already exists in stats array
        let statExists = false;
        for (let j = 0; j < equipment.stats.length; j++) {
            if (Object.keys(equipment.stats[j])[0] == statType) {
                statExists = true;
                break;
            }
        }

        // If stat type already exists, add values together
        if (statExists) {
            for (let j = 0; j < equipment.stats.length; j++) {
                if (Object.keys(equipment.stats[j])[0] == statType) {
                    equipment.stats[j][statType] += statValue;
                    break;
                }
            }
        }

        // If stat type does not exist, add new stat to stats array
        else {
            equipment.stats.push({ [statType]: statValue });
        }
    }
    equipment.value = Math.round(equipmentValue * 3);
    player.inventory.equipment.push(JSON.stringify(equipment));

    saveData();
    showInventory();
    showEquipment();

    const itemShow = {
        category: equipment.category,
        rarity: equipment.rarity,
        lvl: equipment.lvl,
        tier: equipment.tier,
        icon: equipmentIcon(equipment.category),
        stats: equipment.stats
    }
    return itemShow;
}

const equipmentIcon = (equipment) => {
    if (equipment == "Sword") {
        return '<i class="ra ra-relic-blade"></i>';
    } else if (equipment == "Axe") {
        return '<i class="ra ra-axe"></i>';
    } else if (equipment == "Hammer") {
        return '<i class="ra ra-flat-hammer"></i>';
    } else if (equipment == "Dagger") {
        return '<i class="ra ra-bowie-knife"></i>';
    } else if (equipment == "Flail") {
        return '<i class="ra ra-chain"></i>';
    } else if (equipment == "Scythe") {
        return '<i class="ra ra-scythe"></i>';
    } else if (equipment == "Plate") {
        return '<i class="ra ra-vest"></i>';
    } else if (equipment == "Chain") {
        return '<i class="ra ra-vest"></i>';
    } else if (equipment == "Leather") {
        return '<i class="ra ra-vest"></i>';
    } else if (equipment == "Tower") {
        return '<i class="ra ra-shield"></i>';
    } else if (equipment == "Kite") {
        return '<i class="ra ra-heavy-shield"></i>';
    } else if (equipment == "Buckler") {
        return '<i class="ra ra-round-shield"></i>';
    } else if (equipment == "Great Helm") {
        return '<i class="ra ra-knight-helmet"></i>';
    } else if (equipment == "Horned Helm") {
        return '<i class="ra ra-helmet"></i>';
    }
}

// Show full detail of the item
const showItemInfo = (item, icon, type, i) => {
    sfxOpen.play();

    dungeon.status.exploring = false;
    let itemInfo = document.querySelector("#equipmentInfo");
    let rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    let dimContainer = document.querySelector(`#inventory`);
    if (item.tier == undefined) {
        item.tier = 1;
    }
    itemInfo.style.display = "flex";
    dimContainer.style.filter = "brightness(50%)";
    itemInfo.innerHTML = `
            <div class="content">
                <h3 class="${item.rarity}">${icon}${item.rarity} ${item.category}</h3>
                <h5 class="lvltier ${item.rarity}"><b>Lv.${item.lvl} Tier ${item.tier}</b></h5>
                <ul>
                ${item.stats.map(stat => {
        if (Object.keys(stat)[0] === "critRate" || Object.keys(stat)[0] === "critDmg" || Object.keys(stat)[0] === "atkSpd" || Object.keys(stat)[0] === "vamp") {
            return `<li>${Object.keys(stat)[0].toString().replace(/([A-Z])/g, ".$1").replace(/crit/g, "c").toUpperCase()}+${stat[Object.keys(stat)[0]].toFixed(2).replace(rx, "$1")}%</li>`;
        }
        else {
            return `<li>${Object.keys(stat)[0].toString().replace(/([A-Z])/g, ".$1").replace(/crit/g, "c").toUpperCase()}+${stat[Object.keys(stat)[0]]}</li>`;
        }
    }).join('')}
                </ul>
                <div class="button-container">
                    <button id="un-equip">${type}</button>
                    <button id="sell-equip"><i class="fas fa-coins" style="color: #FFD700;"></i>${nFormatter(item.value)}</button>
                    <button id="close-item-info">Close</button>
                </div>
            </div>`;

    // Equip/Unequip button for the item
    let unEquip = document.querySelector("#un-equip");
    unEquip.onclick = function () {
        if (type == "Equip") {
            // Check if player already has an item of this type equipped
            let hasItemOfSameType = false;
            let existingItemIndex = -1;
            
            for (let j = 0; j < player.equipped.length; j++) {
                if (player.equipped[j].type === item.type) {
                    hasItemOfSameType = true;
                    existingItemIndex = j;
                    break;
                }
            }
            
            if (hasItemOfSameType) {
                sfxEquip.play();
                
                // Unequip existing item of same type
                const existingItem = player.equipped[existingItemIndex];
                player.equipped.splice(existingItemIndex, 1);
                player.inventory.equipment.push(JSON.stringify(existingItem));
                
                // Equip the new item
                player.inventory.equipment.splice(i, 1);
                player.equipped.push(item);
                
                itemInfo.style.display = "none";
                dimContainer.style.filter = "brightness(100%)";
                playerLoadStats();
                saveData();
                continueExploring();
            } else {
                // Normal equip flow when no item of same type is equipped
                if (player.equipped.length >= 6) {
                    sfxDeny.play();
                } else {
                    sfxEquip.play();
    
                    // Equip the item
                    player.inventory.equipment.splice(i, 1);
                    player.equipped.push(item);
    
                    itemInfo.style.display = "none";
                    dimContainer.style.filter = "brightness(100%)";
                    playerLoadStats();
                    saveData();
                    continueExploring();
                }
            }
        } else if (type == "Unequip") {
            sfxUnequip.play();

            // Remove the item from the equipment and add it to the inventory
            player.equipped.splice(i, 1);
            player.inventory.equipment.push(JSON.stringify(item));

            itemInfo.style.display = "none";
            dimContainer.style.filter = "brightness(100%)";
            playerLoadStats();
            saveData();
            continueExploring();
        }
    };

    // Sell equipment
    let sell = document.querySelector("#sell-equip");
    sell.onclick = function () {
        sfxOpen.play();
        itemInfo.style.display = "none";
        defaultModalElement.style.display = "flex";
        defaultModalElement.innerHTML = `
        <div class="content">
            <p>Sell <span class="${item.rarity}">${icon}${item.rarity} ${item.category}</span>?</p>
            <div class="button-container">
                <button id="sell-confirm">Sell</button>
                <button id="sell-cancel">Cancel</button>
            </div>
        </div>`;

        let confirm = document.querySelector("#sell-confirm");
        let cancel = document.querySelector("#sell-cancel");
        confirm.onclick = function () {
            sfxSell.play();

            // Sell the equipment
            if (type == "Equip") {
                player.gold += item.value;
                player.inventory.equipment.splice(i, 1);
            } else if (type == "Unequip") {
                player.gold += item.value;
                player.equipped.splice(i, 1);
            }

            defaultModalElement.style.display = "none";
            defaultModalElement.innerHTML = "";
            dimContainer.style.filter = "brightness(100%)";
            playerLoadStats();
            saveData();
            continueExploring();
        }
        cancel.onclick = function () {
            sfxDecline.play();
            defaultModalElement.style.display = "none";
            defaultModalElement.innerHTML = "";
            itemInfo.style.display = "flex";
            continueExploring();
        }
    };

    // Close item info
    let close = document.querySelector("#close-item-info");
    close.onclick = function () {
        sfxDecline.play();

        itemInfo.style.display = "none";
        dimContainer.style.filter = "brightness(100%)";
        continueExploring();
    };
}

// Compare an inventory item with equipped items of the same type
const compareEquipment = (inventoryItem) => {
    // Find if there's an equipped item of the same type
    let equippedItem = null;
    for (let i = 0; i < player.equipped.length; i++) {
        if (player.equipped[i].type === inventoryItem.type) {
            equippedItem = player.equipped[i];
            break;
        }
    }
    
    if (!equippedItem) return "none"; // No equipped item of this type
    
    // Calculate total stat value for both items
    let inventoryValue = 0;
    let equippedValue = 0;
    
    // Calculate weighted values for inventory item
    inventoryItem.stats.forEach(stat => {
        for (const key in stat) {
            // Weight different stats based on their importance
            let weight = 1;
            if (key === "hp") weight = 0.5;
            if (key === "atk") weight = 1.5;
            if (key === "def") weight = 1;
            if (key === "atkSpd") weight = 2;
            if (key === "vamp") weight = 1.5;
            if (key === "critRate") weight = 2;
            if (key === "critDmg") weight = 2;
            
            inventoryValue += stat[key] * weight;
        }
    });
    
    // Calculate weighted values for equipped item
    equippedItem.stats.forEach(stat => {
        for (const key in stat) {
            // Weight different stats based on their importance
            let weight = 1;
            if (key === "hp") weight = 0.5;
            if (key === "atk") weight = 1.5;
            if (key === "def") weight = 1;
            if (key === "atkSpd") weight = 2;
            if (key === "vamp") weight = 1.5;
            if (key === "critRate") weight = 2;
            if (key === "critDmg") weight = 2;
            
            equippedValue += stat[key] * weight;
        }
    });
    
    // Return comparison result
    if (inventoryValue > equippedValue * 1.1) return "better";
    if (inventoryValue < equippedValue * 0.9) return "worse";
    return "similar";
}

// Show inventory
const showInventory = () => {
    // Clear the inventory container
    let playerInventoryList = document.getElementById("playerInventory");
    playerInventoryList.innerHTML = "";

    if (player.inventory.equipment.length == 0) {
        playerInventoryList.innerHTML = "There are no items available.";
    }

    for (let i = 0; i < player.inventory.equipment.length; i++) {
        const item = JSON.parse(player.inventory.equipment[i]);

        // Compare with equipped items
        const comparison = compareEquipment(item);
        let comparisonIcon = "";
        
        if (comparison === "better") {
            comparisonIcon = '<i class="fa fa-arrow-up" style="color: #1eff00; margin-left: 5px;"></i>';
        } else if (comparison === "worse") {
            comparisonIcon = '<i class="fa fa-arrow-down" style="color: #e40000; margin-left: 5px;"></i>';
        } else if (comparison === "similar") {
            comparisonIcon = '<i class="fa fa-equals" style="color: #ffff00; margin-left: 5px;"></i>';
        }

        // Create an element to display the item's name
        let itemDiv = document.createElement('div');
        let icon = equipmentIcon(item.category);
        itemDiv.className = "items";
        itemDiv.innerHTML = `<p class="${item.rarity}">${icon}${item.rarity} ${item.category}${comparisonIcon}</p>`;
        itemDiv.addEventListener('click', function () {
            let type = "Equip";
            showItemInfo(item, icon, type, i);
        });

        // Add the itemDiv to the inventory container
        playerInventoryList.appendChild(itemDiv);
    }
}

// Show equipment
const showEquipment = () => {
    // Clear the inventory container
    let playerEquipmentList = document.getElementById("playerEquipment");
    playerEquipmentList.innerHTML = "";

    // Show a message if a player has no equipment
    if (player.equipped.length == 0) {
        playerEquipmentList.innerHTML = "Nothing equipped.";
    }

    for (let i = 0; i < player.equipped.length; i++) {
        const item = player.equipped[i];

        // Create an element to display the item's name
        let equipDiv = document.createElement('div');
        let icon = equipmentIcon(item.category);
        equipDiv.className = "items";
        equipDiv.innerHTML = `<button class="${item.rarity}">${icon}</button>`;
        equipDiv.addEventListener('click', function () {
            let type = "Unequip";
            showItemInfo(item, icon, type, i);
        });

        // Add the equipDiv to the inventory container
        playerEquipmentList.appendChild(equipDiv);
    }
}

// Apply the equipment stats to the player
const applyEquipmentStats = () => {
    // Reset the equipment stats
    player.equippedStats = {
        hp: 0,
        atk: 0,
        def: 0,
        atkSpd: 0,
        vamp: 0,
        critRate: 0,
        critDmg: 0
    };

    for (let i = 0; i < player.equipped.length; i++) {
        const item = player.equipped[i];

        // Iterate through the stats array and update the player stats
        item.stats.forEach(stat => {
            for (const key in stat) {
                player.equippedStats[key] += stat[key];
            }
        });
    }
    calculateStats();
}

const unequipAll = () => {
    for (let i = player.equipped.length - 1; i >= 0; i--) {
        const item = player.equipped[i];
        player.equipped.splice(i, 1);
        player.inventory.equipment.push(JSON.stringify(item));
    }
    playerLoadStats();
    saveData();
}

const sellAll = (rarity) => {
    if (rarity == "All") {
        if (player.inventory.equipment.length !== 0) {
            sfxSell.play();
            for (let i = 0; i < player.inventory.equipment.length; i++) {
                const equipment = JSON.parse(player.inventory.equipment[i]);
                player.gold += equipment.value;
                player.inventory.equipment.splice(i, 1);
                i--;
            }
            playerLoadStats();
            saveData();
        } else {
            sfxDeny.play();
        }
    } else {
        let rarityCheck = false;
        for (let i = 0; i < player.inventory.equipment.length; i++) {
            const equipment = JSON.parse(player.inventory.equipment[i]);
            if (equipment.rarity === rarity) {
                rarityCheck = true;
                break;
            }
        }
        if (rarityCheck) {
            sfxSell.play();
            for (let i = 0; i < player.inventory.equipment.length; i++) {
                const equipment = JSON.parse(player.inventory.equipment[i]);
                if (equipment.rarity === rarity) {
                    player.gold += equipment.value;
                    player.inventory.equipment.splice(i, 1);
                    i--;
                }
            }
            playerLoadStats();
            saveData();
        } else {
            sfxDeny.play();
        }
    }
}

// Function to check if a slot is empty and auto-equip if it is
const autoEquipGear = (equipment) => {
    // Check if the player already has equipment of this type
    let hasEquippedOfType = false;
    
    for (let i = 0; i < player.equipped.length; i++) {
        if (player.equipped[i].type === equipment.type) {
            hasEquippedOfType = true;
            break;
        }
    }
    
    // If no equipment of this type is equipped, auto-equip this one
    if (!hasEquippedOfType) {
        // Find the equipment in the inventory
        let equipmentIndex = -1;
        for (let i = 0; i < player.inventory.equipment.length; i++) {
            const item = JSON.parse(player.inventory.equipment[i]);
            if (item.category === equipment.category && 
                item.rarity === equipment.rarity && 
                item.lvl === equipment.lvl) {
                equipmentIndex = i;
                break;
            }
        }
        
        if (equipmentIndex !== -1) {
            // Remove from inventory and add to equipped
            const itemToEquip = JSON.parse(player.inventory.equipment[equipmentIndex]);
            player.inventory.equipment.splice(equipmentIndex, 1);
            player.equipped.push(itemToEquip);
            
            // Update player stats
            playerLoadStats();
            saveData();
            
            return true; // Indicate that auto-equip was performed
        }
    }
    
    return false; // No auto-equip was needed or possible
}

// Prints out the equipment stats
const createEquipmentPrint = (condition) => {
    let item = createEquipment();

    // Check if we should auto-equip (only if slot is empty)
    const itemObject = JSON.parse(player.inventory.equipment[player.inventory.equipment.length - 1]);
    const wasAutoEquipped = autoEquipGear(itemObject);

    // Comparison indicators for stats
    const compareEquipmentStat = (statKey, statValue) => {
        // Check if player has any equipped items of the same type
        let comparisonIcon = "";
        let existingItem = null;
        
        for (let i = 0; i < player.equipped.length; i++) {
            if (player.equipped[i].type === item.type) {
                existingItem = player.equipped[i];
                break;
            }
        }
        
        if (existingItem) {
            // Find the same stat in the existing item
            let existingStatValue = 0;
            for (let i = 0; i < existingItem.stats.length; i++) {
                if (Object.keys(existingItem.stats[i])[0] === statKey) {
                    existingStatValue = existingItem.stats[i][statKey];
                    break;
                }
            }
            
            // Compare the stats
            if (statValue > existingStatValue) {
                comparisonIcon = '<i class="fa fa-arrow-up" style="color: #1eff00; margin-left: 5px;"></i>';
            } else if (statValue < existingStatValue) {
                comparisonIcon = '<i class="fa fa-arrow-down" style="color: #e40000; margin-left: 5px;"></i>';
            } else if (statValue === existingStatValue) {
                comparisonIcon = '<i class="fa fa-equals" style="color: #ffff00; margin-left: 5px;"></i>';
            }
        }
        
        return comparisonIcon;
    };

    let panel = `
        <div class="equipment-panel">
            <div class="equipment-header">
                <span class="${item.rarity}">${equipmentIcon(item.category)}${item.rarity} ${item.category}</span>
                <span class="Common">Lv.${item.lvl}</span>
                ${item.tier > 0 ? `<span class="Legendary">T${item.tier}</span>` : ''}
            </div>
            <ul>
                ${item.stats.map(stat => {
                    // Get the stat key and value
                    const statKey = Object.keys(stat)[0];
                    const statValue = stat[statKey];
                    
                    // Get comparison icon
                    const statComparisonIcon = compareEquipmentStat(statKey, statValue);
                    
                    // Format the stat display
                    if (statKey === "critRate" || statKey === "critDmg" || statKey === "atkSpd" || statKey === "vamp") {
                        return `<li>${statKey.toString().replace(/([A-Z])/g, ".$1").replace(/crit/g, "c").toUpperCase()}+${statValue.toFixed(2).replace(rx, "$1")}%${statComparisonIcon}</li>`;
                    } else {
                        return `<li>${statKey.toString().replace(/([A-Z])/g, ".$1").replace(/crit/g, "c").toUpperCase()}+${statValue}${statComparisonIcon}</li>`;
                    }
                }).join('')}
            </ul>
        </div>`;
        
    // Add action buttons for all drops (combat and dungeon)
    let actionButtons = '';
    if (!wasAutoEquipped) {
        actionButtons = `
        <div class="decision-panel">
            <button id="equipNowButton-inline"><i class="ra ra-sword"></i> Equip Now</button>
            <button id="sellNowButton-inline"><i class="fas fa-coins"></i> Sell Now</button>
        </div>`;
    } else {
        // Show auto-equip message
        actionButtons = `<p class="Legendary"><i class="ra ra-sword"></i> Auto-equipped!</p>`;
    }
    
    if (condition == "combat") {
        addCombatLog(`
        ${enemy.name} dropped <span class="${item.rarity}">${item.rarity} ${item.category}</span>.<br>${panel}${actionButtons}`);
        
        // Add event listeners for equip and sell buttons if item wasn't auto-equipped
        if (!wasAutoEquipped) {
            // Add event listeners after a short delay to ensure DOM elements are created
            setTimeout(() => {
                const equipButton = document.querySelector("#equipNowButton-inline");
                if (equipButton) {
                    equipButton.addEventListener("click", function() {
                        sfxConfirm.play();
                        showLastDroppedEquipment();
                    });
                }
                
                const sellButton = document.querySelector("#sellNowButton-inline");
                if (sellButton) {
                    sellButton.addEventListener("click", function() {
                        sfxSell.play();
                        sellLastDroppedEquipment();
                    });
                }
            }, 100);
        }
    } else if (condition == "dungeon") {
        addDungeonLog(`
        You got <span class="${item.rarity}">${item.rarity} ${item.category}</span>.<br>${panel}${actionButtons}`);
        
        // Add event listeners for dungeon log equip and sell buttons if item wasn't auto-equipped
        if (!wasAutoEquipped) {
            setTimeout(() => {
                const equipButton = document.querySelector("#equipNowButton-inline");
                if (equipButton) {
                    equipButton.addEventListener("click", function() {
                        sfxConfirm.play();
                        showLastDroppedEquipmentDungeon();
                    });
                }
                
                const sellButton = document.querySelector("#sellNowButton-inline");
                if (sellButton) {
                    sellButton.addEventListener("click", function() {
                        sfxSell.play();
                        sellLastDroppedEquipmentDungeon();
                    });
                }
            }, 100);
        }
    }
}

// Function to show the last dropped equipment for equipping in dungeon log
const showLastDroppedEquipmentDungeon = () => {
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
    
    // Show a brief notification in the dungeon log
    addDungeonLog(`You equipped ${lastEquipment.category}.`);
    
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
}

// Function to sell the last dropped equipment from combat log
const sellLastDroppedEquipment = () => {
    // Find the most recently dropped equipment
    const lastEquipmentString = player.inventory.equipment[player.inventory.equipment.length - 1];
    
    if (!lastEquipmentString) return;
    
    // Parse the JSON string to get the equipment object
    const lastEquipment = JSON.parse(lastEquipmentString);
    
    if (!lastEquipment) return;
    
    // Get the gold value
    const goldValue = lastEquipment.value || 100; // Default to 100 if no value is set
    
    // Remove the equipment from inventory
    player.inventory.equipment.splice(player.inventory.equipment.length - 1, 1);
    
    // Add gold to player
    player.gold += goldValue;
    
    // Update player stats
    playerLoadStats();
    saveData();
    
    // Show a brief notification in the combat log
    addCombatLog(`You sold ${lastEquipment.category} for <i class="fas fa-coins" style="color: #FFD700;"></i>${nFormatter(goldValue)}.`);
    
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
}

// Function to sell the last dropped equipment from dungeon log
const sellLastDroppedEquipmentDungeon = () => {
    // Find the most recently dropped equipment
    const lastEquipmentString = player.inventory.equipment[player.inventory.equipment.length - 1];
    
    if (!lastEquipmentString) return;
    
    // Parse the JSON string to get the equipment object
    const lastEquipment = JSON.parse(lastEquipmentString);
    
    if (!lastEquipment) return;
    
    // Get the gold value
    const goldValue = lastEquipment.value || 100; // Default to 100 if no value is set
    
    // Remove the equipment from inventory
    player.inventory.equipment.splice(player.inventory.equipment.length - 1, 1);
    
    // Add gold to player
    player.gold += goldValue;
    
    // Update player stats
    playerLoadStats();
    saveData();
    
    // Show a brief notification in the dungeon log
    addDungeonLog(`You sold ${lastEquipment.category} for <i class="fas fa-coins" style="color: #FFD700;"></i>${nFormatter(goldValue)}.`);
    
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
}