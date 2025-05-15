// Keyboard Controls for Decision Panels and Level Up
document.addEventListener('keydown', function(event) {
    // Check if title screen (intro screen) is visible
    const titleScreen = document.querySelector('#title-screen');
    if (titleScreen && titleScreen.style.display === 'flex') {
        // Start game when pressing space or enter on the intro screen
        if (event.code === 'Space' || event.code === 'Enter') {
            event.preventDefault();
            titleScreen.click(); // Simulate a click on the title screen
            return;
        }
    }
    
    // Handle Escape key to trigger run button during combat
    if (event.code === 'Escape') {
        const combatPanel = document.querySelector('#combatPanel');
        if (combatPanel && combatPanel.style.display === 'flex') {
            const runButton = document.querySelector('#runButton');
            if (runButton && !runButton.disabled) {
                event.preventDefault();
                runButton.click();
                return;
            }
        }
    }
    
    // Toggle play/pause with space bar during gameplay
    if (event.code === 'Space') {
        const dungeonActivity = document.querySelector('#dungeonActivity');
        const mainScreen = document.querySelector('#dungeon-main');
        // Only toggle play/pause if on the main dungeon screen and no modals are open
        if (dungeonActivity && mainScreen && mainScreen.style.display === 'flex' && 
            !document.querySelector('.decision-panel') && 
            !document.querySelector('#lvlupPanel[style*="display: flex"]') &&
            !document.querySelector('#inventory[style*="display: flex"]') &&
            !document.querySelector('#equipmentInfo[style*="display: flex"]') &&
            !document.querySelector('#defaultModal[style*="display: flex"]') &&
            !document.querySelector('#confirmationModal[style*="display: flex"]')) {
            event.preventDefault();
            dungeonActivity.click();
            return;
        }
    }
    
    // Handle single button actions with Enter key
    if (event.code === 'Enter') {
        // Check for single button scenarios (like "claim" buttons)
        const visibleModals = [
            '#defaultModal', 
            '#confirmationModal',
            '#equipmentInfo',
            '#combatPanel:not([style*="display: none"])'
        ];
        
        for (const modalSelector of visibleModals) {
            const modal = document.querySelector(modalSelector);
            if (modal && window.getComputedStyle(modal).display !== 'none') {
                const buttons = modal.querySelectorAll('button');
                // If there's only one button, click it
                if (buttons.length === 1) {
                    event.preventDefault();
                    buttons[0].click();
                    return;
                }
                break;
            }
        }
    }
    
    // Check if level-up panel is visible
    const lvlupPanel = document.querySelector('#lvlupPanel');
    if (lvlupPanel && lvlupPanel.style.display === 'flex') {
        // Get all stat buttons in the level-up panel
        const buttons = Array.from(lvlupPanel.querySelectorAll('button'))
            .filter(button => button.id && button.id.startsWith('lvlSlot'));
        
        if (!buttons.length) return;
        
        // Add a class to style the currently selected button if not already present
        if (!document.querySelector('style#keyboard-nav-styles')) {
            const style = document.createElement('style');
            style.id = 'keyboard-nav-styles';
            style.textContent = `
                button.keyboard-selected {
                    background-color: white !important;
                    color: black !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Find currently selected button or select the first one
        let selectedIndex = buttons.findIndex(btn => btn.classList.contains('keyboard-selected'));
        
        if (selectedIndex === -1) {
            // No button is selected, select the first one
            buttons[0].classList.add('keyboard-selected');
            selectedIndex = 0;
        }
        
        // Handle arrow key navigation
        if (event.code === 'ArrowUp') {
            event.preventDefault();
            // Remove selection from current button
            buttons[selectedIndex].classList.remove('keyboard-selected');
            // Select previous button (wrap around to bottom if at top)
            selectedIndex = (selectedIndex - 1 + buttons.length) % buttons.length;
            buttons[selectedIndex].classList.add('keyboard-selected');
            return;
        }
        
        if (event.code === 'ArrowDown') {
            event.preventDefault();
            // Remove selection from current button
            buttons[selectedIndex].classList.remove('keyboard-selected');
            // Select next button (wrap around to top if at bottom)
            selectedIndex = (selectedIndex + 1) % buttons.length;
            buttons[selectedIndex].classList.add('keyboard-selected');
            return;
        }
        
        // Handle selection with space or enter
        if (event.code === 'Space' || event.code === 'Enter') {
            event.preventDefault();
            buttons[selectedIndex].click();
            return;
        }
        
        // Prevent left/right arrows from doing anything when level-up panel is visible
        if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
            event.preventDefault();
            return;
        }
        
        return;
    }
    
    // Regular decision panel handling
    const decisionPanel = document.querySelector('.decision-panel');
    if (!decisionPanel) return;
    
    // Get all buttons in the decision panel
    const buttons = decisionPanel.querySelectorAll('button');
    if (!buttons.length) return;
    
    // If there's only one option, allow space or either arrow key to select it
    if (buttons.length === 1) {
        if (event.code === 'Space' || event.code === 'Enter' || event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
            event.preventDefault();
            buttons[0].click();
            return;
        }
    }
    
    // For multiple options, use left arrow for first button and right arrow for second button
    if (buttons.length >= 2) {
        if (event.code === 'ArrowLeft') {
            event.preventDefault();
            buttons[0].click();
            return;
        }
        
        if (event.code === 'ArrowRight') {
            event.preventDefault();
            buttons[1].click();
            return;
        }
        
        // Also allow Enter to select the first button (typically the "confirm" action)
        if (event.code === 'Enter') {
            event.preventDefault();
            buttons[0].click();
            return;
        }
    }
});

// Function to highlight the first option in level up screen when it appears
const highlightFirstLevelUpOption = () => {
    // Add a class to style the currently selected button if not already present
    if (!document.querySelector('style#keyboard-nav-styles')) {
        const style = document.createElement('style');
        style.id = 'keyboard-nav-styles';
        style.textContent = `
            button.keyboard-selected {
                background-color: white !important;
                color: black !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Use MutationObserver to detect when the level up panel becomes visible
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.style.display === 'flex') {
                // Wait a short moment for the buttons to be rendered
                setTimeout(() => {
                    const buttons = Array.from(lvlupPanel.querySelectorAll('button'))
                        .filter(button => button.id && button.id.startsWith('lvlSlot'));
                    
                    if (buttons.length > 0) {
                        // Remove any existing selections
                        buttons.forEach(btn => btn.classList.remove('keyboard-selected'));
                        // Select the first button
                        buttons[0].classList.add('keyboard-selected');
                    }
                }, 50);
            }
        });
    });
    
    // Start observing the level up panel
    observer.observe(document.querySelector('#lvlupPanel'), { 
        attributes: true, 
        attributeFilter: ['style'] 
    });
};

// Call the function to set up the observer
highlightFirstLevelUpOption(); 