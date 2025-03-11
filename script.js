// This script manages combatants, their stats (HP and Condition),
// the event log, and export/import functionalities.

document.addEventListener('DOMContentLoaded', () => {
  let combatants = [];
  let combatantIdCounter = 0;

  // DOM Elements
  const addCombatantForm = document.getElementById('addCombatantForm');
  const combatantNameInput = document.getElementById('combatantName');
  const hpInput = document.getElementById('hp');
  const conditionInput = document.getElementById('condition');

  const combatantList = document.getElementById('combatantList');
  const logList = document.getElementById('logList');

  const exportButton = document.getElementById('exportButton');
  const importButton = document.getElementById('importButton');
  const importFileInput = document.getElementById('importFileInput');

  // Add Combatant
  addCombatantForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = combatantNameInput.value.trim();
    const hp = parseInt(hpInput.value, 10) || 0;
    const condition = parseInt(conditionInput.value, 10) || 0;
    const combatant = {
      id: combatantIdCounter++,
      name,
      hp,
      condition
    };
    combatants.push(combatant);
    updateCombatantList();
    addCombatantForm.reset();
    logEvent(`Added combatant: ${name} (HP: ${hp}, Condition: ${condition})`);
  });

  // Update Combatant List
  function updateCombatantList() {
    combatantList.innerHTML = '';
    combatants.forEach(combatant => {
      const li = document.createElement('li');
      li.className = "combatantCard";
      li.innerHTML = `
        <h3>${combatant.name}</h3>
        <div class="statContainer">
          <span>HP: <strong id="hp-${combatant.id}">${combatant.hp}</strong></span>
          <button data-id="${combatant.id}" class="incHP">+</button>
          <button data-id="${combatant.id}" class="decHP">–</button>
        </div>
        <div class="statContainer">
          <span>Condition: <strong id="cond-${combatant.id}">${combatant.condition}</strong></span>
          <button data-id="${combatant.id}" class="incCond">+</button>
          <button data-id="${combatant.id}" class="decCond">–</button>
        </div>
        <button data-id="${combatant.id}" class="removeCombatant removeBtn">Remove</button>
      `;
      combatantList.appendChild(li);
    });
    attachCardListeners();
  }

  // Attach event listeners for buttons on combatant cards.
  function attachCardListeners() {
    document.querySelectorAll('.incHP').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const c = combatants.find(c => c.id === id);
        if (c) {
          c.hp++;
          updateCombatantList();
          logEvent(`Increased HP for ${c.name} to ${c.hp}`);
        }
      });
    });
    document.querySelectorAll('.decHP').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const c = combatants.find(c => c.id === id);
        if (c) {
          c.hp--;
          if(c.hp < 0) c.hp = 0;
          updateCombatantList();
          logEvent(`Decreased HP for ${c.name} to ${c.hp}`);
        }
      });
    });
    document.querySelectorAll('.incCond').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const c = combatants.find(c => c.id === id);
        if (c) {
          c.condition++;
          updateCombatantList();
          logEvent(`Increased Condition for ${c.name} to ${c.condition}`);
        }
      });
    });
    document.querySelectorAll('.decCond').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const c = combatants.find(c => c.id === id);
        if (c) {
          c.condition--;
          if(c.condition < 0) c.condition = 0;
          updateCombatantList();
          logEvent(`Decreased Condition for ${c.name} to ${c.condition}`);
        }
      });
    });
    document.querySelectorAll('.removeCombatant').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        combatants = combatants.filter(c => c.id !== id);
        updateCombatantDropdowns(); // if you need them in action panel later
        updateCombatantList();
        logEvent(`Removed combatant with ID ${id}`);
      });
    });
  }

  // For future expansion you might have dropdowns for selecting combatants in actions.
  function updateCombatantDropdowns() {
    // For now, not used – but could be used for targeting actions.
  }

  // Event Log helper
  function logEvent(message) {
    const li = document.createElement('li');
    li.textContent = message;
    logList.appendChild(li);
  }

  // Data Export / Import
  exportButton.addEventListener('click', () => {
    const dataStr = JSON.stringify(combatants);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "combatants.json";
    a.click();
    URL.revokeObjectURL(url);
    logEvent("Exported combat data.");
  });

  importButton.addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const importedData = JSON.parse(evt.target.result);
        combatants = importedData;
        // Update combatantIdCounter to be higher than any imported id.
        const maxId = combatants.reduce((max, c) => Math.max(max, c.id), 0);
        vehicleIdCounter = maxId + 1;
        updateCombatantDropdowns();
        updateCombatantList();
        logEvent("Imported combat data successfully.");
      } catch (error) {
        alert("Failed to import data: " + error);
      }
    };
    reader.readAsText(file);
  });
});
