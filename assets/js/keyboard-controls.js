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
        if (event.code === 'Space' || event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
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
    }
}); 