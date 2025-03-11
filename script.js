/******************************************************************************
 * PREDEFINED VEHICLES & COMBATANT STATS ARE NOT NEEDED HERE
 * Instead, we now hard-code the PC stats and let you add NPC foes.
 *
 * For PCs, we have the following key stats:
 *    - Attack, Defense, Toughness, Speed, Fortune, and Wound Points.
 * For NPC foes:
 *    - Mooks: use a “count” (instead of Wound Points).
 *    - Featured, Boss, Uber Boss: have Attack, Defense, Toughness, Speed, and Wound Points.
 *      Their effective Attack/Defense are reduced by Impairment:
 *         • Featured: -1 at 25+ WP, -2 at 30+ WP (they go down at 35).
 *         • Boss/Uber Boss: -1 at 40+ WP, -2 at 45+ WP (they go down at 50).
 *****************************************************************************/

// Hard-coded PCs (players)
const pcs = [
  { id: 100, name: "Hero One", attack: 13, defense: 13, toughness: 6, speed: 8, fortune: 7, woundPoints: 0, isPC: true },
  { id: 101, name: "Hero Two", attack: 12, defense: 12, toughness: 5, speed: 7, fortune: 7, woundPoints: 0, isPC: true }
];

// Array for NPC foes; will be added via the enemy form.
let npcs = [];
let npcIdCounter = 200; // starting ID for NPCs

// Utility function for generating NPC IDs.
function getNextNpcId() {
  return npcIdCounter++;
}

// ----------------- DOM Elements -----------------

// PC display
const pcList = document.getElementById('pcList');
// NPC display and enemy addition form
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

// Attack form dropdowns:
// Player Attack: PC (attacker) → NPC (target)
const playerAttackerSelect = document.getElementById('playerAttacker');
const npcTargetSelect = document.getElementById('npcTarget');
// NPC Attack: NPC (attacker) → PC (target)
const npcAttackerSelect = document.getElementById('npcAttacker');
const playerTargetSelect = document.getElementById('playerTarget');

// Forms for actions
const playerActionForm = document.getElementById('playerActionForm');
const npcActionForm = document.getElementById('npcActionForm');

// Player Attack form inputs
const playerRollResultInput = document.getElementById('playerRollResult');
const playerModifierInput = document.getElementById('playerModifier');
const playerWeaponDamageInput = document.getElementById('playerWeaponDamage');

// NPC Attack form inputs (GM mode)
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

// ----------------- Update Display Functions -----------------

// Update PC list
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
        <button data-id="${pc.id}" class="incWound">+</button>
        <button data-id="${pc.id}" class="decWound">–</button>
      </div>
    `;
    pcList.appendChild(li);
  });
  attachPcListeners();
}

// Update NPC list
function updateNpcList() {
  npcList.innerHTML = '';
  npcs.forEach(npc => {
    const li = document.createElement('li');
    li.className = "combatantCard";
    if(npc.type === "mook") {
      li.innerHTML = `
        <h3>${npc.name} (Mook)</h3>
        <p>Attack: ${npc.attack} | Defense: ${npc.defense} | Toughness: ${npc.toughness} | Speed: ${npc.speed}</p>
        <div class="statContainer">
          <span>Mook Count: <strong id="mook-${npc.id}">${npc.count}</strong></span>
          <button data-id="${npc.id}" class="incMook">+</button>
          <button data-id="${npc.id}" class="decMook">–</button>
        </div>
        <button data-id="${npc.id}" class="removeEnemy removeBtn">Remove</button>
      `;
    } else {
      // For Featured/Boss/Uber Boss, calculate effective Attack/Defense based on impairment.
      const impairAttack = npc.attackImpair || 0;
      const impairDefense = npc.defenseImpair || 0;
      const effectiveAttack = npc.attack - impairAttack;
      const effectiveDefense = npc.defense - impairDefense;
      li.innerHTML = `
        <h3>${npc.name} (${npc.type.charAt(0).toUpperCase() + npc.type.slice(1)})</h3>
        <p>Attack: ${npc.attack}${impairAttack ? " (Effective: " + effectiveAttack + ")" : ""} | Defense: ${npc.defense}${impairDefense ? " (Effective: " + effectiveDefense + ")" : ""} | Toughness: ${npc.toughness} | Speed: ${npc.speed}</p>
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

// ----------------- Attach Listeners for Combatant Cards -----------------

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

// ----------------- Initial Population -----------------
function init() {
  updatePcList();
  updateAttackDropdowns();
}
init();

// ----------------- Enemy (NPC) Form Handling -----------------
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
    enemy.attackImpair = 0;
    enemy.defenseImpair = 0;
  }
  
  npcs.push(enemy);
  updateAttackDropdowns();
  updateNpcList();
  addEnemyForm.reset();
  mookCountContainer.style.display = "none";
  logEvent(`Added enemy: ${name} (${type})`);
});

enemyTypeSelect.addEventListener('change', (e) => {
  if(e.target.value === "mook") {
    mookCountContainer.style.display = "block";
  } else {
    mookCountContainer.style.display = "none";
  }
});

// ----------------- Attack Actions -----------------

// PLAYER ATTACK: PC attacking NPC.
playerActionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const attackerId = parseInt(playerAttackerSelect.value, 10);
  const targetId = parseInt(npcTargetSelect.value, 10);
  const attacker = pcs.find(pc => pc.id === attackerId);
  const target = npcs.find(npc => npc.id === targetId);
  if(!attacker || !target) return;
  
  // For player attacks, final result = (entered roll result + modifier)
  let rollResult = parseInt(playerRollResultInput.value.replace('!', ''), 10);
  const modifier = parseInt(playerModifierInput.value, 10) || 0;
  rollResult += modifier;
  
  // Calculate Smackdown = Final Result - Target's Defense.
  let smackdown = rollResult - target.defense;
  if(smackdown < 0) smackdown = 0;
  
  // Final Damage = smackdown + Weapon Damage - Target's Toughness.
  const weaponDamage = parseInt(playerWeaponDamageInput.value, 10) || 0;
  let damage = smackdown + weaponDamage - target.toughness;
  if(damage < 0) damage = 0;
  
  let logMsg = `Player Attack: ${attacker.name} rolled ${rollResult} vs. ${target.name}'s Defense (${target.defense}) = ${smackdown}. `;
  logMsg += `+ Weapon Damage (${weaponDamage}) - Toughness (${target.toughness}) = Damage ${damage}. `;
  
  if(target.type === "mook") {
    if(damage > 0) {
      target.count--;
      if(target.count < 0) target.count = 0;
      logMsg += `Mook hit! ${target.name} count decreased to ${target.count}.`;
    } else {
      logMsg += `No damage; mook count remains ${target.count}.`;
    }
  } else {
    target.woundPoints += damage;
    // Check for impairment thresholds:
    if(target.type === "featured") {
      if(target.woundPoints >= 30) {
        target.attackImpair = 2;
        target.defenseImpair = 2;
        logMsg += `Impairment -2 applied. `;
      } else if(target.woundPoints >= 25) {
        target.attackImpair = 1;
        target.defenseImpair = 1;
        logMsg += `Impairment -1 applied. `;
      } else {
        target.attackImpair = 0;
        target.defenseImpair = 0;
      }
    } else if(target.type === "boss" || target.type === "uberboss") {
      if(target.woundPoints >= 45) {
        target.attackImpair = 2;
        target.defenseImpair = 2;
        logMsg += `Impairment -2 applied. `;
      } else if(target.woundPoints >= 40) {
        target.attackImpair = 1;
        target.defenseImpair = 1;
        logMsg += `Impairment -1 applied. `;
      } else {
        target.attackImpair = 0;
        target.defenseImpair = 0;
      }
    }
    logMsg += `${target.name} now has ${target.woundPoints} Wound Points.`;
  }
  
  logEvent(logMsg);
  updateNpcList();
  playerActionForm.reset();
  updateAttackDropdowns();
});

// NPC ATTACK: NPC attacking PC.
// GM rolls using dice with exploding mechanic.
npcRollDiceButton.addEventListener('click', () => {
  const attackerId = parseInt(npcAttackerSelect.value, 10);
  const attacker = npcs.find(npc => npc.id === attackerId);
  if(!attacker) {
    alert("No attacking NPC selected!");
    return;
  }
  const modifier = parseInt(npcModifierInput.value, 10) || 0;
  
  // Roll two dice (exploding):
  const posInitial = rollDie();
  const negInitial = rollDie();
  const boxcars = (posInitial === 6 && negInitial === 6);
  const posTotal = rollExplodingDie(posInitial);
  const negTotal = rollExplodingDie(negInitial);
  const diceOutcome = posTotal - negTotal;
  
  const finalCheck = attacker.attack + diceOutcome + modifier;
  npcRollResultDiv.dataset.finalCheck = finalCheck;
  
  // Get the current target PC to determine visual cue.
  const targetId = parseInt(playerTargetSelect.value, 10);
  const target = pcs.find(pc => pc.id === targetId);
  let finalCheckDisplay = finalCheck;
  // We'll wrap the finalCheck number in a span with class for styling.
  let finalCheckHTML = `<span>${finalCheck}</span>`;
  if(target) {
    if(finalCheck >= target.defense) {
      // Hit: finalCheck should appear in bold green.
      finalCheckHTML = `<span class="hitResult">${finalCheck}</span>`;
    } else {
      // Miss: bold red.
      finalCheckHTML = `<span class="missResult">${finalCheck}</span>`;
    }
  }
  
  let resultText = `Positive Die: ${posTotal} (initial: ${posInitial}), Negative Die: ${negTotal} (initial: ${negInitial}) → Dice Outcome: ${diceOutcome}. Final Check = ${attacker.attack} + ${diceOutcome} + Modifier (${modifier}) = ${finalCheckHTML}`;
  if (boxcars) resultText += " (Boxcars!)";
  npcRollResultDiv.innerHTML = resultText;
  logEvent(`NPC Dice Roll: +die=${posTotal} (init ${posInitial}), -die=${negTotal} (init ${negInitial}), Outcome=${diceOutcome}. Final Check = ${attacker.attack} + ${diceOutcome} + ${modifier} = ${finalCheck}${boxcars?" (Boxcars!)":""}`);
});

// NPC Attack form submission.
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
  
  // Calculate Smackdown = Final Check - Target's Defense.
  let smackdown = finalCheck - target.defense;
  if(smackdown < 0) smackdown = 0;
  
  const weaponDamage = parseInt(npcWeaponDamageInput.value, 10) || 0;
  let damage = smackdown + weaponDamage - target.toughness;
  if(damage < 0) damage = 0;
  
  let logMsg = `NPC Attack: ${attacker.name} (Final Check ${finalCheck}) vs. ${target.name}'s Defense (${target.defense}) = ${smackdown}. `;
  logMsg += `+ Weapon Damage (${weaponDamage}) - Toughness (${target.toughness}) = Damage ${damage}. `;
  
  target.woundPoints += damage;
  logMsg += `${target.name} now has ${target.woundPoints} Wound Points.`;
  
  logEvent(logMsg);
  updatePcList();
  npcActionForm.reset();
  npcRollResultDiv.textContent = "";
  delete npcRollResultDiv.dataset.finalCheck;
  updateAttackDropdowns();
});

// ----------------- Dice Roller Functions -----------------

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

// ----------------- Event Log Helper -----------------

function logEvent(message) {
  const li = document.createElement('li');
  li.textContent = message;
  logList.appendChild(li);
}

// ----------------- Data Export / Import -----------------

exportButton.addEventListener('click', () => {
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
      // We merge NPCs; PCs remain hard-coded.
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

// ----------------- Update Dropdowns for Attack Forms -----------------

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

// ----------------- Initial Population -----------------
function init() {
  updatePcList();
  updateAttackDropdowns();
}
init();
