import { contentLoader } from './contentLoader.js';
import EngineAPI from './index.js';
// Assuming renderScene from ui.js is now the primary one.
import { renderCombat, showInventory, renderScene as uiRenderScene } from './ui.js';

// Make choose and combatAction globally available for ui.js event handlers if they need window.choose
window.choose = choose;
window.combatAction = combatAction;

async function main() {
  try {
    // Check for inventory button existence before assigning onclick
    const inventoryBtn = document.getElementById('inventoryBtn');
    if (!inventoryBtn) {
      console.error("Bootstrap Error: 'inventoryBtn' element not found in DOM.");
      // Decide if this is critical enough to stop, or just log.
      // For now, let's assume it's not critical for startup, but log it.
    } else {
      inventoryBtn.onclick = () => showInventory(() => uiRenderScene(EngineAPI.getScene()));
    }

    await contentLoader.loadAll();
    const firstSceneData = EngineAPI.startGame(); // Renamed for clarity
    if (!firstSceneData) {
        throw new Error("EngineAPI.startGame() returned no scene data.");
    }
    uiRenderScene(firstSceneData); // Use the imported renderScene

  } catch (error) {
    console.error("Failed to initialize or start the game:", error);
    const sceneEl = document.getElementById('scene');
    const choicesEl = document.getElementById('choices');
    if (sceneEl) {
      sceneEl.innerHTML = `<p>Error: The game could not be started.</p><p>Details: ${error.message}</p><p>Please check the console (F12) for more information or try refreshing the page.</p>`;
    } else {
      alert("Critical Error: Game failed to start and core UI elements ('scene') are missing. " + error.message);
    }
    if (choicesEl) {
      choicesEl.innerHTML = ''; // Clear choices
    } else {
      // If choicesEl is also missing, this is a more severe setup issue.
      if (!sceneEl) { // Only alert this if sceneEl was also missing
        alert("Critical Error: Core UI elements ('choices') are also missing. The game cannot display content or options.");
      }
    }
    // Optionally, disable further interaction if game is in unusable state
    const inventoryBtn = document.getElementById('inventoryBtn');
    if(inventoryBtn) inventoryBtn.disabled = true;
  }
}

function choose(id) {
  try {
    const result = EngineAPI.chooseOption(id);
    if (!result) {
        console.error(`EngineAPI.chooseOption('${id}') returned null or undefined.`);
        alert("An error occurred while processing your choice. The game state might be inconsistent.");
        return;
    }

    if (result.inCombat) {
      renderCombat(result, combatAction);
    } else if (result.error) {
      alert(result.error); // Display error from engine
    } else if (result.text !== undefined && result.choices !== undefined) { // Check if it's a valid scene object
      uiRenderScene(result); // Use the imported renderScene
    } else {
      console.error("Invalid scene data received from chooseOption:", result);
      alert("Received invalid data after choice. Cannot render next scene.");
    }
  } catch (error) {
    console.error("Error in choose function:", error);
    alert("A critical error occurred while handling your choice: " + error.message);
  }
}

function combatAction(skill, target) {
  try {
    const result = EngineAPI.playerAction(skill, target);
    if (!result) {
        console.error(`EngineAPI.playerAction('${skill}', '${target}') returned null or undefined.`);
        alert("An error occurred during combat action. The game state might be inconsistent.");
        return;
    }

    if (result.combatResult && result.combatResult.nextSceneId) {
      const nextSceneData = EngineAPI.gotoScene(result.combatResult.nextSceneId);
      if (!nextSceneData) {
          console.error(`EngineAPI.gotoScene('${result.combatResult.nextSceneId}') returned no scene data after combat.`);
          alert("Failed to load the next scene after combat.");
          return;
      }
      uiRenderScene(nextSceneData); // Use the imported renderScene
    } else if (result.inCombat) {
      renderCombat(result, combatAction);
    } else {
      // If it's not a combat result and not in combat, what is it?
      // This might indicate an unexpected state from playerAction.
      console.warn("Unexpected result from playerAction, not a combat end and not in combat:", result);
      // Potentially try to render current scene if available, or an error.
      // For now, let's assume if it's not inCombat, it should have been a combatResult.
      // If there's a scene attached to this unexpected result, try rendering it.
      if (result.text !== undefined && result.choices !== undefined) {
        uiRenderScene(result);
      } else {
        alert("An unexpected issue occurred after your combat action.");
      }
    }
  } catch (error) {
    console.error("Error in combatAction function:", error);
    alert("A critical error occurred during combat: " + error.message);
  }
}

main(); // Call the main async function

