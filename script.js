/***********************************************************************
 * Combat Tracker for Feng Shui 2 with Featured Foe Templates
 *
 * - Hard-coded PCs (players) are pre-loaded.
 * - NPC foes can be added via a form.
 *   • For Mooks, a count is tracked instead of wound points.
 *   • For Featured Foes, Bosses, and Uber Bosses, wound points start at 0.
 * - A new dropdown ("Featured Foe Template") appears when enemy type is "featured."
 *   If a template is selected, the enemy's stats (Attack, Defense, Toughness, Speed)
 *   are set to the template's values.
 * - Attack forms are split: players' attack (PC → NPC) and NPC attack (NPC → PC).
 * - Damage formulas:
 *     Smackdown = Final Check – Target's Defense (min 0)
 *     Damage = Smackdown + Weapon Damage – Target's Toughness (min 0)
 *     For Mooks, if damage > 0, reduce count by 1.
 * - NPC Attack (GM roll): Final Check = NPC's Attack + (Dice Outcome) + Modifier.
 *     Dice Outcome is calculated using two exploding d6 (one positive, one negative).
 *     A visual cue shows the final check in green (if ≥ target's Defense) or red (if lower).
 * - Each character card displays key stats (Attack, Defense, Toughness, Speed, Fortune, and Wound Points)
 *   with "+" and "–" buttons for adjustments.
 * - Data Export/Import functionality is provided.
 ***********************************************************************/

// Hard-coded PCs (players)
const pcs = [
  { id: 100, name: "Ken", attack: 13, defense: 13, toughness: 6, speed: 8, fortune: 7, woundPoints: 0, isPC: true },
  { id: 101, name: "Oleg", attack: 14, backupAttack: 13, defense: 14, toughness: 7, speed: 7, fortune: 7, woundPoints: 0, isPC: true },
  { id: 102, name: "Bai Zhu", attack: 16, defense: 15, toughness: 5, speed: 6, fortune: 10, woundPoints: 0, isPC: true },
  { id: 103, name: "Shen Dao", attack: 14, defense: 13, toughness: 6, speed: 7, fortune: 8, woundPoints: 0, isPC: true }
];

// Array for NPC foes
let npcs = [];
let npcIdCounter = 200;
function getNextNpcId() {
  return npcIdCounter++;
}

// Predefined Featured Foe Templates (core stats only)
const featuredTemplates = {
  "enforcer": { attack: 13, defense: 13, toughness: 5, speed: 7, fortune: 0 },
  "hitman": { attack: 15, defense: 12, toughness: 5, speed: 8, fortune: 0 },
  "securityHoncho": { attack: 13, defense: 14, toughness: 5, speed: 6, fortune: 0 },
  "sinisterBodyguard": { attack: 13, defense: 13, toughness: 5, speed: 6, fortune: 0 },
  "badBusinessman": { attack: 13, defense: 13, toughness: 5, speed: 6, fortune: 0 },
  "giangHuWarrior": { attack: 14, defense: 13, toughness: 5, speed: 7, fortune: 0 },
  "martialArtist": { attack: 13, defense: 13, toughness: 6, speed: 7, fortune: 0 },
  "officer": { attack: 13, defense: 13, toughness: 5, speed: 6, fortune: 0 },
  "insurgent": { attack: 14, defense: 13, toughness: 5, speed: 8, fortune: 0 },
  "wheelman": { attack: 13, defense: 13, toughness: 5, speed: 7, fortune: 0 },
  "sorcerousVassal": { attack: 13, defense: 13, toughness: 5, speed: 7, fortune: 0 },
  "tenThousandMan": { attack: 13, defense: 13, toughness: 6, speed: 6, fortune: 0 },
  "cyberApe": { attack: 14, defense: 12, toughness: 7, speed: 7, fortune: 0 },
  "monster": { attack: 14, defense: 13, toughness: 5, speed: 7, fortune: 0 },
  "gladiator": { attack: 13, defense: 13, toughness: 6, speed: 8, fortune: 0 },
  "mutant": { attack: 13, defense: 13, toughness: 6, speed: 7, fortune: 0 },
  "wastelander": { attack: 13, defense: 13, toughness: 6, speed: 7, fortune: 0 },
  "sinisterScientist": { attack: 14, defense: 13, toughness: 5, speed: 7, fortune: 0 },
  "keyJiangshi": { attack: 15, defense: 13, toughness: 5, speed: 7, fortune: 0 },
  "keySnakePerson": { attack: 14, defense: 12, toughness: 5, speed: 8, fortune: 0 },
  "niceGuyBadAss": { attack: 16, defense: 17, toughness: 5, speed: 9, fortune: 0 }
};

// ------------------- DOM Elements -------------------

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

// New: Featured Foe Template dropdown
const featuredTemplateContainer = document.getElementById('featuredTemplateContainer');
const featuredTemplateSelect = document.getElementById('featuredTemplate');

// Attack form dropdowns
const playerAttackerSelect = document.getElementById('playerAttacker');
const npcTargetSelect = document.getElementById('npcTarget');
const npcAttackerSelect = document.getElementById('npcAttacker');
const playerTargetSelect = document.getElementById('playerTarget');

// Attack forms
const playerActionForm = document.getElementById('playerActionForm');
const npcActionForm = document.getElementById('npcActionForm');

// Player Attack inputs
const playerRollResultInput = document.getElementById('playerRollResult');
const playerModifierInput = document.getElementById('playerModifier');
const playerWeaponDamageInput = document.getElementById('playerWeaponDamage');

// NPC Attack inputs (GM mode)
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

// ------------------- Utility Functions -------------------

// Render a stat row with label, current value, and +/- buttons.
function renderStatRow(label, statValue, id, statKey) {
  return `
    <div class="statRow">
      <span>${label}: <strong id="${statKey}-${id}">${statValue}</strong></span>
      <button data-id="${id}" class="inc${statKey}">+</button>
      <button data-id="${id}" class="dec${statKey}">–</button>
    </div>
  `;
}

// Populate the Featured Foe Template dropdown.
function populateFeaturedTemplateDropdown() {
  featuredTemplateSelect.innerHTML = '<option value="" disabled selected>Select Template</option>';
  for (const key in featuredTemplates) {
    if (featuredTemplates.hasOwnProperty(key)) {
      const option = document.createElement('option');
      option.value = key;
      // Format key to a more friendly label.
      let label = key.replace(/([A-Z])/g, ' $1').trim();
      label = label.charAt(0).toUpperCase() + label.slice(1);
      option.textContent = label;
      featuredTemplateSelect.appendChild(option);
    }
  }
}
populateFeaturedTemplateDropdown();

// ------------------- Update Display Functions -------------------

// Update PC List
function updatePcList() {
  pcList.innerHTML = '';
  pcs.forEach(pc => {
    let cardHTML = `<h3>${pc.name}</h3>`;
    cardHTML += renderStatRow("Attack", pc.attack, pc.id, "Attack");
    if(pc.backupAttack !== undefined) {
      cardHTML += renderStatRow("Backup Attack", pc.backupAttack, pc.id, "BackupAttack");
    }
    cardHTML += renderStatRow("Defense", pc.defense, pc.id, "Defense");
    cardHTML += renderStatRow("Toughness", pc.toughness, pc.id, "Toughness");
    cardHTML += renderStatRow("Speed", pc.speed, pc.id, "Speed");
    cardHTML += renderStatRow("Fortune", pc.fortune, pc.id, "Fortune");
    cardHTML += renderStatRow("Wound Points", pc.woundPoints, pc.id, "Wound");
    const li = document.createElement('li');
    li.className = "combatantCard";
    li.innerHTML = cardHTML;
    pcList.appendChild(li);
  });
  attachPcListeners();
}

// Update NPC List
function updateNpcList() {
  npcList.innerHTML = '';
  npcs.forEach(npc => {
    let cardHTML = "";
    if(npc.type === "mook") {
      cardHTML += `<h3>${npc.name} (Mook)</h3>`;
      cardHTML += renderStatRow("Attack", npc.attack, npc.id, "Attack");
      cardHTML += renderStatRow("Defense", npc.defense, npc.id, "Defense");
      cardHTML += renderStatRow("Toughness", npc.toughness, npc.id, "Toughness");
      cardHTML += renderStatRow("Speed", npc.speed, npc.id, "Speed");
      cardHTML += renderStatRow("Fortune", npc.fortune || 0, npc.id, "Fortune");
      cardHTML += `<div class="statRow">
                     <span>Mook Count: <strong id="mook-${npc.id}">${npc.count}</strong></span>
                     <button data-id="${npc.id}" class="incMook">+</button>
                     <button data-id="${npc.id}" class="decMook">–</button>
                   </div>`;
    } else {
      cardHTML += `<h3>${npc.name} (${npc.type.charAt(0).toUpperCase() + npc.type.slice(1)})</h3>`;
      cardHTML += renderStatRow("Attack", npc.attack, npc.id, "Attack");
      cardHTML += renderStatRow("Defense", npc.defense, npc.id, "Defense");
      cardHTML += renderStatRow("Toughness", npc.toughness, npc.id, "Toughness");
      cardHTML += renderStatRow("Speed", npc.speed, npc.id, "Speed");
      cardHTML += renderStatRow("Fortune", npc.fortune || 0, npc.id, "Fortune");
      cardHTML += renderStatRow("Wound Points", npc.woundPoints, npc.id, "Wound");
    }
    cardHTML += `<button data-id="${npc.id}" class="removeEnemy removeBtn">Remove</button>`;
    const li = document.createElement('li');
    li.className = "combatantCard";
    li.innerHTML = cardHTML;
    npcList.appendChild(li);
  });
  attachNpcListeners();
}

// Update dropdowns for attack forms
function updateAttackDropdowns() {
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

// ------------------- Attach Listeners for Stat Adjustment Buttons -------------------
function attachPcListeners() {
  // Attack
  document.querySelectorAll('.incAttack').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const pc = pcs.find(pc => pc.id === id);
      if (pc) { pc.attack++; updatePcList(); logEvent(`Increased ${pc.name}'s Attack to ${pc.attack}`); }
    });
  });
  document.querySelectorAll('.decAttack').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const pc = pcs.find(pc => pc.id === id);
      if (pc) { pc.attack--; if(pc.attack < 0) pc.attack = 0; updatePcList(); logEvent(`Decreased ${pc.name}'s Attack to ${pc.attack}`); }
    });
  });
  // Backup Attack
  document.querySelectorAll('.incBackupAttack').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const pc = pcs.find(pc => pc.id === id);
      if (pc && pc.backupAttack !== undefined) { pc.backupAttack++; updatePcList(); logEvent(`Increased ${pc.name}'s Backup Attack to ${pc.backupAttack}`); }
    });
  });
  document.querySelectorAll('.decBackupAttack').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const pc = pcs.find(pc => pc.id === id);
      if (pc && pc.backupAttack !== undefined) { pc.backupAttack--; if(pc.backupAttack < 0) pc.backupAttack = 0; updatePcList(); logEvent(`Decreased ${pc.name}'s Backup Attack to ${pc.backupAttack}`); }
    });
  });
  // Defense
  document.querySelectorAll('.incDefense').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const pc = pcs.find(pc => pc.id === id);
      if (pc) { pc.defense++; updatePcList(); logEvent(`Increased ${pc.name}'s Defense to ${pc.defense}`); }
    });
  });
  document.querySelectorAll('.decDefense').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const pc = pcs.find(pc => pc.id === id);
      if (pc) { pc.defense--; if(pc.defense < 0) pc.defense = 0; updatePcList(); logEvent(`Decreased ${pc.name}'s Defense to ${pc.defense}`); }
    });
  });
  // Toughness
  document.querySelectorAll('.incToughness').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const pc = pcs.find(pc => pc.id === id);
      if (pc) { pc.toughness++; updatePcList(); logEvent(`Increased ${pc.name}'s Toughness to ${pc.toughness}`); }
    });
  });
  document.querySelectorAll('.decToughness').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const pc = pcs.find(pc => pc.id === id);
      if (pc) { pc.toughness--; if(pc.toughness < 0) pc.toughness = 0; updatePcList(); logEvent(`Decreased ${pc.name}'s Toughness to ${pc.toughness}`); }
    });
  });
  // Speed
  document.querySelectorAll('.incSpeed').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const pc = pcs.find(pc => pc.id === id);
      if (pc) { pc.speed++; updatePcList(); logEvent(`Increased ${pc.name}'s Speed to ${pc.speed}`); }
    });
  });
  document.querySelectorAll('.decSpeed').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const pc = pcs.find(pc => pc.id === id);
      if (pc) { pc.speed--; if(pc.speed < 0) pc.speed = 0; updatePcList(); logEvent(`Decreased ${pc.name}'s Speed to ${pc.speed}`); }
    });
  });
  // Fortune
  document.querySelectorAll('.incFortune').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const pc = pcs.find(pc => pc.id === id);
      if (pc) { pc.fortune++; updatePcList(); logEvent(`Increased ${pc.name}'s Fortune to ${pc.fortune}`); }
    });
  });
  document.querySelectorAll('.decFortune').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const pc = pcs.find(pc => pc.id === id);
      if (pc) { pc.fortune--; if(pc.fortune < 0) pc.fortune = 0; updatePcList(); logEvent(`Decreased ${pc.name}'s Fortune to ${pc.fortune}`); }
    });
  });
  // Wound Points
  document.querySelectorAll('.incWound').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const pc = pcs.find(pc => pc.id === id);
      if (pc) { pc.woundPoints++; updatePcList(); logEvent(`Increased ${pc.name}'s Wound Points to ${pc.woundPoints}`); }
    });
  });
  document.querySelectorAll('.decWound').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const pc = pcs.find(pc => pc.id === id);
      if (pc) { pc.woundPoints--; if(pc.woundPoints < 0) pc.woundPoints = 0; updatePcList(); logEvent(`Decreased ${pc.name}'s Wound Points to ${pc.woundPoints}`); }
    });
  });
}

function attachNpcListeners() {
  document.querySelectorAll('.incAttack').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc) { npc.attack++; updateNpcList(); logEvent(`Increased ${npc.name}'s Attack to ${npc.attack}`); }
    });
  });
  document.querySelectorAll('.decAttack').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc) { npc.attack--; if(npc.attack < 0) npc.attack = 0; updateNpcList(); logEvent(`Decreased ${npc.name}'s Attack to ${npc.attack}`); }
    });
  });
  // Defense
  document.querySelectorAll('.incDefense').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc) { npc.defense++; updateNpcList(); logEvent(`Increased ${npc.name}'s Defense to ${npc.defense}`); }
    });
  });
  document.querySelectorAll('.decDefense').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc) { npc.defense--; if(npc.defense < 0) npc.defense = 0; updateNpcList(); logEvent(`Decreased ${npc.name}'s Defense to ${npc.defense}`); }
    });
  });
  // Toughness
 	document.querySelectorAll('.incToughness').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc) { npc.toughness++; updateNpcList(); logEvent(`Increased ${npc.name}'s Toughness to ${npc.toughness}`); }
    });
  });
  document.querySelectorAll('.decToughness').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc) { npc.toughness--; if(npc.toughness < 0) npc.toughness = 0; updateNpcList(); logEvent(`Decreased ${npc.name}'s Toughness to ${npc.toughness}`); }
    });
  });
  // Speed
  document.querySelectorAll('.incSpeed').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc) { npc.speed++; updateNpcList(); logEvent(`Increased ${npc.name}'s Speed to ${npc.speed}`); }
    });
  });
  document.querySelectorAll('.decSpeed').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc) { npc.speed--; if(npc.speed < 0) npc.speed = 0; updateNpcList(); logEvent(`Decreased ${npc.name}'s Speed to ${npc.speed}`); }
    });
  });
  // Fortune
  document.querySelectorAll('.incFortune').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc) { npc.fortune = (npc.fortune || 0) + 1; updateNpcList(); logEvent(`Increased ${npc.name}'s Fortune to ${npc.fortune}`); }
    });
  });
  document.querySelectorAll('.decFortune').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc) { npc.fortune = (npc.fortune || 0) - 1; if(npc.fortune < 0) npc.fortune = 0; updateNpcList(); logEvent(`Decreased ${npc.name}'s Fortune to ${npc.fortune}`); }
    });
  });
  // Wound Points (for non-mook NPCs)
  document.querySelectorAll('.incWound').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc && npc.type !== "mook") { npc.woundPoints++; updateNpcList(); logEvent(`Increased ${npc.name}'s Wound Points to ${npc.woundPoints}`); }
    });
  });
  document.querySelectorAll('.decWound').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc && npc.type !== "mook") { npc.woundPoints--; if(npc.woundPoints < 0) npc.woundPoints = 0; updateNpcList(); logEvent(`Decreased ${npc.name}'s Wound Points to ${npc.woundPoints}`); }
    });
  });
  // For mooks, adjust count.
  document.querySelectorAll('.incMook').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc && npc.type === "mook") { npc.count++; updateNpcList(); logEvent(`Increased ${npc.name}'s Mook Count to ${npc.count}`); }
    });
  });
  document.querySelectorAll('.decMook').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const npc = npcs.find(npc => npc.id === id);
      if (npc && npc.type === "mook") { npc.count--; if(npc.count < 0) npc.count = 0; updateNpcList(); logEvent(`Decreased ${npc.name}'s Mook Count to ${npc.count}`); }
    });
  });
  // Remove enemy button.
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

// ------------------- Initial Population -------------------
function init() {
  updatePcList();
  updateAttackDropdowns();
}
init();

// ------------------- Update Dropdowns for Attack Forms -------------------
function updateAttackDropdowns() {
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

// ------------------- Event Listeners for Add Enemy Form -------------------
addEnemyForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = enemyNameInput.value.trim();
  let type = enemyTypeSelect.value;
  let attack = parseInt(enemyAttackInput.value, 10) || 0;
  let defense = parseInt(enemyDefenseInput.value, 10) || 0;
  let toughness = parseInt(enemyToughnessInput.value, 10) || 0;
  let speed = parseInt(enemySpeedInput.value, 10) || 0;
  
  // If enemy type is "featured" and a template is selected, override stats.
  if(type === "featured" && featuredTemplateSelect.value) {
    const template = featuredTemplates[featuredTemplateSelect.value];
    attack = template.attack;
    defense = template.defense;
    toughness = template.toughness;
    speed = template.speed;
  }
  
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
  featuredTemplateContainer.style.display = "none";
  logEvent(`Added enemy: ${name} (${type})`);
});

// Show/hide additional fields based on enemy type.
enemyTypeSelect.addEventListener('change', (e) => {
  const selected = e.target.value;
  if(selected === "mook") {
    mookCountContainer.style.display = "block";
    featuredTemplateContainer.style.display = "none";
  } else if(selected === "featured") {
    featuredTemplateContainer.style.display = "block";
    mookCountContainer.style.display = "none";
  } else {
    mookCountContainer.style.display = "none";
    featuredTemplateContainer.style.display = "none";
  }
});

// ------------------- Attack Actions -------------------

// PLAYER ATTACK: PC attacking NPC.
playerActionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const attackerId = parseInt(playerAttackerSelect.value, 10);
  const targetId = parseInt(npcTargetSelect.value, 10);
  const attacker = pcs.find(pc => pc.id === attackerId);
  const target = npcs.find(npc => npc.id === targetId);
  if(!attacker || !target) return;
  
  let rollResult = parseInt(playerRollResultInput.value.replace('!', ''), 10);
  const modifier = parseInt(playerModifierInput.value, 10) || 0;
  rollResult += modifier;
  
  let smackdown = rollResult - target.defense;
  if(smackdown < 0) smackdown = 0;
  
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
    // Apply impairment thresholds for Featured foes.
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

// NPC ATTACK: NPC attacking PC (GM rolls).
npcRollDiceButton.addEventListener('click', () => {
  const attackerId = parseInt(npcAttackerSelect.value, 10);
  const attacker = npcs.find(npc => npc.id === attackerId);
  if(!attacker) {
    alert("No attacking NPC selected!");
    return;
  }
  const modifier = parseInt(npcModifierInput.value, 10) || 0;
  
  const posInitial = rollDie();
  const negInitial = rollDie();
  const boxcars = (posInitial === 6 && negInitial === 6);
  const posTotal = rollExplodingDie(posInitial);
  const negTotal = rollExplodingDie(negInitial);
  const diceOutcome = posTotal - negTotal;
  
  const finalCheck = attacker.attack + diceOutcome + modifier;
  npcRollResultDiv.dataset.finalCheck = finalCheck;
  
  // Visual cue: compare finalCheck to target PC's Defense.
  const targetId = parseInt(playerTargetSelect.value, 10);
  const target = pcs.find(pc => pc.id === targetId);
  let finalCheckHTML = `<span>${finalCheck}</span>`;
  if(target) {
    if(finalCheck >= target.defense) {
      finalCheckHTML = `<span class="hitResult">${finalCheck}</span>`;
    } else {
      finalCheckHTML = `<span class="missResult">${finalCheck}</span>`;
    }
  }
  
  let resultText = `Positive Total: ${posTotal} (init: ${posInitial}), Negative Total: ${negTotal} (init: ${negInitial}) → Outcome: ${diceOutcome}. `;
  resultText += `Final Check = ${attacker.attack} + ${diceOutcome} + Modifier (${modifier}) = ${finalCheckHTML}`;
  if(boxcars) resultText += " (Boxcars!)";
  npcRollResultDiv.innerHTML = resultText;
  logEvent(`NPC Dice Roll: +die=${posTotal} (init ${posInitial}), -die=${negTotal} (init ${negInitial}), Outcome=${diceOutcome}. Final Check = ${attacker.attack} + ${diceOutcome} + ${modifier} = ${finalCheck}${boxcars?" (Boxcars!)":""}`);
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

// ------------------- Dice Roller Functions -------------------
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

// ------------------- Data Export / Import -------------------
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
      // Merge NPC data; PCs remain hard-coded.
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

// ------------------- Update Dropdowns for Attack Forms -------------------
function updateAttackDropdowns() {
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

// ------------------- Event Log Helper -------------------
function logEvent(message) {
  const li = document.createElement('li');
  li.textContent = message;
  logList.appendChild(li);
}

// ------------------- Initial Population -------------------
function init() {
  updatePcList();
  updateAttackDropdowns();
}
init();
