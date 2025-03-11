// This script manages PCs, NPC foes, attack actions, the event log,
// and export/import functionality.

// Predefined Players (hard-coded PCs)
const pcs = [
  { id: 100, name: "Hero One", attack: 13, defense: 13, toughness: 6, speed: 8, fortune: 7, woundPoints: 0, isPC: true },
  { id: 101, name: "Hero Two", attack: 12, defense: 12, toughness: 5, speed: 7, fortune: 7, woundPoints: 0, isPC: true }
];

// NPC foes array (enemies added during play)
let npcs = [];
let npcIdCounter = 200; // starting id for NPCs

// Utility function to generate unique IDs for new NPCs if needed
function getNextNpcId() {
  return npcIdCounter++;
}

// DOM Elements for PC display
const pcList = document.getElementById('pcList');
// DOM Elements for NPC display and enemy addition
const npcList = document.getElementById('npcList');
const addEnemyForm = document.getElementById('addEnemyForm');
const enemyNameInput = document.getElementById('enemyName');
const enemyTypeSelect = document.getElementById('enemyType');
const enemyAttackInput = document.getElementById('enemyAttack');
const enemyDefenseInput = document.getElementById('enemyDefense');
const enemyToughnessInput = document.getElementById('enemyToughness');
const enemySpeedInput = document.getElementById('enemySpeed');
const mookCountContainer = document.getElementById('mookCountContainer');
const mookCountInput = document.getElementById('mookCount');

// Drop-downs for actions
const playerAttackerSelect = document.getElementById('playerAttacker');
const npcTargetSelect = document.getElementById('npcTarget');
const npcAttackerSelect = document.getElementById('npcAttacker');
const playerTargetSelect = document.getElementById('playerTarget');

// Forms for actions
const playerActionForm = document.getElementById('playerActionForm');
const npcActionForm = document.getElementById('npcActionForm');

// Player Attack Form Inputs
const playerRollResultInput = document.getElementById('playerRollResult');
const playerModifierInput = document.getElementById('playerModifier');
const playerWeaponDamageInput = document.getElementById('playerWeaponDamage');

// NPC Attack Form Inputs (GM mode)
const npcModifierInput = document.getElementById('npcModifier');
const npcWeaponDamageInput = document.getElementById('npcWeaponDamage');
const npcRollDiceButton = document.getElementById('npcRollDiceButton');
const npcRollResultDiv = document.getElementById('npcRollResult');

// Event Log
const logList = document.getElementById('logList');

// Data Management
const exportButton = document.getElementById('exportButton');
const importButton = document.getElementById('importButton');
const importFileInput = document.getElementById('importFileInput');

// ---------- Utility Functions ----------

// Update the PC list (players are hard-coded)
function updatePcList() {
  pcList.innerHTML = '';
  pcs.forEach(pc => {
    const li = document.createElement('li');
    li.className = "combatantCard";
    li.innerHTML = `
      <h3>${pc.name}</h3>
      <p>Attack: ${pc.attack} | Defense: ${pc.defense} | Toughness: ${pc.toughness} | Speed: ${pc.speed} | Fortune: ${pc.fortune}</p>
      <div class="statContainer">
        <span>Wound Points: <strong id="wound-${pc.id}">${pc.woundPoints}</strong></span>
        <!-- PCs are not removed -->
        <button data-id="${pc.id}" class="incWound">+</button>
        <button data-id="${pc.id}" class="decWound">–</button>
      </div>
    `;
    pcList.appendChild(li);
  });
  attachPcListeners();
}

// Update the NPC list
function updateNpcList() {
  npcList.innerHTML = '';
  npcs.forEach(npc => {
    const li = document.createElement('li');
    li.className = "combatantCard";
    let statsText = "";
    if(npc.type === "mook") {
      statsText = `Attack: ${npc.attack} | Defense: ${npc.defense} | Toughness: ${npc.toughness} | Speed: ${npc.speed}`;
      li.innerHTML = `
        <h3>${npc.name} (Mook)</h3>
        <p>${statsText}</p>
        <div class="statContainer">
          <span>Mook Count: <strong id="mook-${npc.id}">${npc.count}</strong></span>
          <button data-id="${npc.id}" class="incMook">+</button>
          <button data-id="${npc.id}" class="decMook">–</button>
        </div>
        <button data-id="${npc.id}" class="removeEnemy removeBtn">Remove</button>
      `;
    } else {
      statsText = `Attack: ${npc.attack} | Defense: ${npc.defense} | Toughness: ${npc.toughness} | Speed: ${npc.speed}`;
      li.innerHTML = `
        <h3>${npc.name} (${npc.type.charAt(0).toUpperCase() + npc.type.slice(1)})</h3>
        <p>${statsText}</p>
        <div class="statContainer">
          <span>Wound Points: <strong id="wound-${npc.id}">${npc.woundPoints}</strong></span>
          <button data-id="${npc.id}" class="incWound">+</button>
          <button data-id="${npc.id}" class="decWound">–</button>
        </div>
        <button data-id="${npc.id}" class="removeEnemy removeBtn">Remove</button>
      `;
    }
    npcList.appendChild(li);
  });
  attachNpcListeners();
}

// Update dropdowns for attack forms
function updateAttackDropdowns() {
  // For Player Attack: Attacker = PC, Target = NPC
  playerAttackerSelect.innerHTML = '';
  pcs.forEach(pc => {
    const option = document.createElement('option');
    option.value = pc.id;
    option.textContent = pc.name;
    playerAttackerSelect.appendChild(option);
  });
  npcTargetSelect.innerHTML = '';
  npcs.forEach(npc => {
    if(npc.type !== "mook" || npc.count > 0) {
      const option = document.createElement('option');
      option.value = npc.id;
      option.textContent = npc.name;
      npcTargetSelect.appendChild(option);
    }
  });
  // For NPC Attack: Attacker = NPC, Target = PC
  npcAttackerSelect.innerHTML = '';
  npcs.forEach(npc => {
    if(npc.type !== "mook" || npc.count > 0) {
      const option = document.createElement('option');
      option.value = npc.id;
      option.textContent = npc.name;
      npcAttackerSelect.appendChild(option);
    }
  });
  playerTargetSelect.innerHTML = '';
  pcs.forEach(pc => {
    const option = document.createElement('option');
    option.value = pc.id;
    option.textContent = pc.name;
    playerTargetSelect.appendChild(option);
  });
}

// ---------- Attach Listeners for Cards ----------
function attachPcListeners() {
  document.querySelectorAll('.incWound').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const pc = pcs.find(pc => pc.id === id);
      if (pc) {
        pc.woundPoints++;
        updatePcList();
        logEvent(`Increased ${pc.name}'s Wound Points to ${pc.woundPoints}`);
      }
    });
  });
  document.querySelectorAll('.decWound').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const pc = pcs.find(pc => pc.id === id);
      if (pc) {
        pc.woundPoints--;
        if(pc.woundPoints < 0) pc.woundPoints = 0;
        updatePcList();
        logEvent(`Decreased ${pc.name}'s Wound Points to ${pc.woundPoints}`);
      }
    });
  });
}

function attachNpcListeners() {
  document.querySelectorAll('.incWound').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc && npc.type !== "mook") {
        npc.woundPoints++;
        updateNpcList();
        logEvent(`Increased ${npc.name}'s Wound Points to ${npc.woundPoints}`);
      }
    });
  });
  document.querySelectorAll('.decWound').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc && npc.type !== "mook") {
        npc.woundPoints--;
        if(npc.woundPoints < 0) npc.woundPoints = 0;
        updateNpcList();
        logEvent(`Decreased ${npc.name}'s Wound Points to ${npc.woundPoints}`);
      }
    });
  });
  document.querySelectorAll('.incMook').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc && npc.type === "mook") {
        npc.count++;
        updateNpcList();
        logEvent(`Increased ${npc.name}'s Mook Count to ${npc.count}`);
      }
    });
  });
  document.querySelectorAll('.decMook').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc && npc.type === "mook") {
        npc.count--;
        if(npc.count < 0) npc.count = 0;
        updateNpcList();
        logEvent(`Decreased ${npc.name}'s Mook Count to ${npc.count}`);
      }
    });
  });
  document.querySelectorAll('.removeEnemy').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      npcs = npcs.filter(npc => npc.id !== id);
      updateAttackDropdowns();
      updateNpcList();
      logEvent(`Removed enemy with ID ${id}`);
    });
  });
}

// ---------- Initial Population of PCs and Dropdowns ----------
function init() {
  updatePcList();
  updateAttackDropdowns();
}
init();

// ---------- Enemy (NPC) Form Handling ----------
addEnemyForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = enemyNameInput.value.trim();
  const type = enemyTypeSelect.value;
  const attack = parseInt(enemyAttackInput.value, 10) || 0;
  const defense = parseInt(enemyDefenseInput.value, 10) || 0;
  const toughness = parseInt(enemyToughnessInput.value, 10) || 0;
  const speed = parseInt(enemySpeedInput.value, 10) || 0;
  
  let enemy = { id: getNextNpcId(), name, type, attack, defense, toughness, speed };
  
  if (type === "mook") {
    enemy.count = parseInt(mookCountInput.value, 10) || 1;
  } else {
    enemy.woundPoints = 0;
  }
  
  npcs.push(enemy);
  updateAttackDropdowns();
  updateNpcList();
  addEnemyForm.reset();
  mookCountContainer.style.display = "none";
  logEvent(`Added enemy: ${name} (${type})`);
});

// Show/hide Mook Count field based on enemy type selection
enemyTypeSelect.addEventListener('change', (e) => {
  if(e.target.value === "mook") {
    mookCountContainer.style.display = "block";
  } else {
    mookCountContainer.style.display = "none";
  }
});

// ---------- Attack Actions ----------

// Player Attack Form (PC attacking NPC)
playerActionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const attackerId = parseInt(playerAttackerSelect.value, 10);
  const targetId = parseInt(npcTargetSelect.value, 10);
  const attacker = pcs.find(pc => pc.id === attackerId);
  const target = npcs.find(npc => npc.id === targetId);
  if(!attacker || !target) return;
  
  // For player attacks, final check = (entered roll + modifier)
  let rollResult = parseInt(playerRollResultInput.value.replace('!', ''), 10);
  const modifier = parseInt(playerModifierInput.value, 10) || 0;
  rollResult += modifier;
  
  // Calculate "Smackdown" = (Final Check - Target Defense)
  let smackdown = rollResult - target.defense;
  if(smackdown < 0) smackdown = 0;
  
  // Final Damage = smackdown + weaponDamage - target Toughness
  const weaponDamage = parseInt(playerWeaponDamageInput.value, 10) || 0;
  let damage = smackdown + weaponDamage - target.toughness;
  if(damage < 0) damage = 0;
  
  let logMsg = `Player Attack: ${attacker.name} rolled ${rollResult} vs. ${target.name}'s Defense (${target.defense}) = ${smackdown}. `;
  logMsg += `+ Weapon Damage (${weaponDamage}) - Toughness (${target.toughness}) = Damage ${damage}. `;
  
  if(target.type === "mook") {
    // For Mooks, reduce count by 1 if damage > 0
    if(damage > 0) {
      target.count--;
      if(target.count < 0) target.count = 0;
      logMsg += `Mook hit! ${target.name} count decreased to ${target.count}.`;
    } else {
      logMsg += `No damage; mook count remains ${target.count}.`;
    }
  } else {
    // For other foes, increase wound points.
    target.woundPoints += damage;
    logMsg += `${target.name} now has ${target.woundPoints} Wound Points.`;
  }
  
  logEvent(logMsg);
  updateNpcList();
  playerActionForm.reset();
  updateAttackDropdowns();
});

// NPC Attack Form (NPC attacking PC)
// In this case, the GM will use a dice roller with exploding dice.
npcRollDiceButton.addEventListener('click', () => {
  const attackerId = parseInt(npcAttackerSelect.value, 10);
  const attacker = npcs.find(npc => npc.id === attackerId);
  if(!attacker) {
    alert("No attacking NPC selected!");
    return;
  }
  const modifier = parseInt(npcModifierInput.value, 10) || 0;
  // Roll two dice: one positive, one negative, with exploding dice.
  const posInitial = rollDie();
  const negInitial = rollDie();
  const boxcars = (posInitial === 6 && negInitial === 6);
  const posTotal = rollExplodingDie(posInitial);
  const negTotal = rollExplodingDie(negInitial);
  const diceOutcome = posTotal - negTotal;
  const finalCheck = attacker.attack + diceOutcome + modifier;
  npcRollResultDiv.dataset.finalCheck = finalCheck;
  let resultText = `Positive Total: ${posTotal} (initial ${posInitial}), Negative Total: ${negTotal} (initial ${negInitial}) → Outcome: ${diceOutcome}. `;
  resultText += `Final Check = ${attacker.attack} + ${diceOutcome} + Modifier (${modifier}) = ${finalCheck}`;
  if(boxcars) resultText += " (Boxcars!)";
  npcRollResultDiv.textContent = resultText;
  logEvent(`NPC Dice Roll: +${posTotal} (init ${posInitial}), -${negTotal} (init ${negInitial}), Outcome=${diceOutcome}. Final Check = ${attacker.attack} + ${diceOutcome} + ${modifier} = ${finalCheck}${boxcars?" (Boxcars!)":""}`);
});

npcActionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const attackerId = parseInt(npcAttackerSelect.value, 10);
  const targetId = parseInt(playerTargetSelect.value, 10);
  const attacker = npcs.find(npc => npc.id === attackerId);
  const target = pcs.find(pc => pc.id === targetId);
  if(!attacker || !target) return;
  
  let finalCheck = parseInt(npcRollResultDiv.dataset.finalCheck || "0", 10);
  if(isNaN(finalCheck) || finalCheck === 0) {
    alert("Please roll the dice for NPC attack first.");
    return;
  }
  
  // Calculate Smackdown = (Final Check - Target's Defense)
  let smackdown = finalCheck - target.defense;
  if(smackdown < 0) smackdown = 0;
  
  const weaponDamage = parseInt(npcWeaponDamageInput.value, 10) || 0;
  let damage = smackdown + weaponDamage - target.toughness;
  if(damage < 0) damage = 0;
  
  let logMsg = `NPC Attack: ${attacker.name} (Final Check ${finalCheck}) vs. ${target.name}'s Defense (${target.defense}) = ${smackdown}. `;
  logMsg += `+ Weapon Damage (${weaponDamage}) - Toughness (${target.toughness}) = Damage ${damage}. `;
  
  // For PCs, add damage to woundPoints.
  target.woundPoints += damage;
  logMsg += `${target.name} now has ${target.woundPoints} Wound Points.`;
  
  logEvent(logMsg);
  updatePcList();
  npcActionForm.reset();
  npcRollResultDiv.textContent = "";
  delete npcRollResultDiv.dataset.finalCheck;
  updateAttackDropdowns();
});

// ---------- Dice Roller Functions for NPC Attack ----------
function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function rollExplodingDie(initial) {
  let total = initial;
  while (initial === 6) {
    initial = rollDie();
    total += initial;
  }
  return total;
}

// ---------- Update Dropdowns for Attack Forms ----------
function updateAttackDropdowns() {
  // For Player Attack: Attacker = PC, Target = NPC (only those with woundPoints or mook count > 0)
  playerAttackerSelect.innerHTML = '';
  pcs.forEach(pc => {
    const option = document.createElement('option');
    option.value = pc.id;
    option.textContent = pc.name;
    playerAttackerSelect.appendChild(option);
  });
  npcTargetSelect.innerHTML = '';
  npcs.forEach(npc => {
    // Include NPC if it's not a mook or if mook count > 0
    if(npc.type !== "mook" || npc.count > 0) {
      const option = document.createElement('option');
      option.value = npc.id;
      option.textContent = npc.name;
      npcTargetSelect.appendChild(option);
    }
  });
  
  // For NPC Attack: Attacker = NPC, Target = PC
  npcAttackerSelect.innerHTML = '';
  npcs.forEach(npc => {
    if(npc.type !== "mook" || npc.count > 0) {
      const option = document.createElement('option');
      option.value = npc.id;
      option.textContent = npc.name;
      npcAttackerSelect.appendChild(option);
    }
  });
  playerTargetSelect.innerHTML = '';
  pcs.forEach(pc => {
    const option = document.createElement('option');
    option.value = pc.id;
    option.textContent = pc.name;
    playerTargetSelect.appendChild(option);
  });
}

// ---------- Event Log Helper ----------
function logEvent(message) {
  const li = document.createElement('li');
  li.textContent = message;
  logList.appendChild(li);
}

// ---------- Data Export / Import ----------
exportButton.addEventListener('click', () => {
  // Save both PCs and NPCs in one object
  const data = { pcs, npcs };
  const dataStr = JSON.stringify(data);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "combatData.json";
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
      // Overwrite PCs and NPCs (for PCs, you might choose to merge instead)
      // For now, we replace NPCs only (PCs remain hard-coded)
      npcs = importedData.npcs || [];
      updateAttackDropdowns();
      updatePcList();
      updateNpcList();
      logEvent("Imported combat data successfully.");
    } catch (error) {
      alert("Failed to import data: " + error);
    }
  };
  reader.readAsText(file);
});

// ---------- Initial Population ----------
function init() {
  // PCs are hard-coded
  updatePcList();
  updateAttackDropdowns();
}
init();
