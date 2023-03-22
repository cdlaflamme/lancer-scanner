//Sanity Check - Can this user even create folders and journal entries? Does the folder journal folder exist?
if (JournalEntry.canUserCreate(game.user) == false) {
    ui.notifications.error(`${game.user.name} attempted to run SCAN to Journal but lacks proper permissions. Please correct and try again.`);
    return;
};

//Variables - Change these to control the macro

//journalFolder - The name, as displayed in foundry, of the folder you want the journal entries to save to. Remember to enclose in quotes: 'example'
var journalFolder = 'SCAN Database';

//nameTemplate - The text before the scan number and target name. Remember to enclose in quotes: 'example'
var nameTemplate = 'SCAN: ';

//numberLength - The total length of the scan number, extra spaces are filled with 0s. Setting this to 3, for example would produce scan number 001 on your first scan. Integers only and no quotes.
var numberLength = 3;

//startingNumber - If you want the scan number to start at something other than 1 then change this. Integers only and no quotes.
var startingNumber = 1;

//permissionLevel - This sets the default permission level of the scan entry. This must be an integer between 0 and 3 where 0 is "None", 1 is "Limited", 2 is "Observer", and 3 is "Owner"
var permissionLevel = 3;

//updateExisting - This macro will check if a scan journal entry exists and update it, set this to false if you want it to create a new scan journal entry.
var updateExisting = true;

//targets - Gets the data for your currently selected target(s) and stores it for later use. Do not change.
let targets = Array.from(game.user.targets);

//Functions
//zeroPad - Adds a set number 0s to the fed number to produce a consistent length number.
const zeroPad = (num, places) => String(num).padStart(places, '0');

//sort_features - Sorts the feature list for the scanned target    
function sort_features(a, b) {
    return b.Origin.base-a.Origin.base
};

//construct_features - Builds out the list of selectable features for the scanned target, includes support for exotics.
function construct_features(sc_dir, o) {
    let sc_list = ``;
    sc_list += `<p>${o}</p>`
    let sc_features = sc_dir._features.filter(f => f.Origin.name == o).sort(sort_features)
    sc_features.forEach(i => {
        let sc_name = ``;
        let sc_desc = ``;
        if (i.Origin.name == "EXOTIC" && !i.Origin.base) {
            sc_name = "<code class=\"horus--subtle\">UNKNOWN EXOTIC SYSTEM</code>";
            sc_desc = "???";
        }
        else {
            sc_name = i.Name;
            if (i.Effect) {
                sc_desc = i.Effect;
            } else {
                sc_desc = "No description given.";
            }
            if (i.Trigger) {
                sc_desc = `Trigger:${i.Trigger}<br>${sc_desc}`;
            }
        }
        let sc_entry = `<details><summary>${sc_name}</summary><p>${sc_desc}</p></details>`;
        sc_list += sc_entry;
    });
    return sc_list
};

//construct_weapons - Builds out the table of weapons for the scanned target, includes support for exotics.
function construct_weapons(sc_dir, o, sc_tier) {
    let sc_weapons = ``;
    let sc_features = sc_dir._features.filter(f => f.Origin.name == o).sort(sort_features)
    sc_features.forEach(i => {
        let sc_name = ``;
        let sc_desc = ``;
        let sc_entry = ``;
        let sc_range = ``;
        let sc_damage = ``;
        let sc_accuracy = ``;
        if (!i.WepType) {return sc_weapons};
        sc_weapons += `<table>`;
        if (i.Origin.name == "EXOTIC" && !i.Origin.base) {
            sc_name = "<tr><th><code class=\"horus--subtle\">UNKNOWN EXOTIC WEAPON</code></th></tr>";
            sc_desc = "<tr><td>???</td></tr>";
            sc_entry = sc_name + sc_desc;
        }
        else {
            sc_name = `<tr><th colspan="4">${i.Name}</th></tr>`;
            sc_entry += sc_name;
            sc_desc = `<tr>`;
            sc_desc += `<td>+${i.AttackBonus[sc_tier - 1]} ATTACK</td>`;
            if (i.Accuracy[sc_tier - 1]) {
                if (i.Accuracy[sc_tier - 1] > 0) {
                    sc_accuracy = '+' + i.Accuracy[sc_tier - 1] + ' ACCURACY'
                    } else {
                        sc_accuracy = '-' + i.Accuracy[sc_tier - 1] + ' DIFFICULTY'
                };
            };
            sc_desc += `<td>${sc_accuracy}</td>`;
            if (i.Range.length > 0) {i.Range.forEach(r => sc_range += r.RangeType + ' ' + r.Value + '&nbsp&nbsp&nbsp')};
            sc_desc += `<td>${sc_range}</td>`;
            if (i.Damage.length > 0) {i.Damage[sc_tier - 1].forEach(d => sc_damage += d.Value + ' ' + d.DamageType + '&nbsp&nbsp&nbsp')};
            sc_desc += `<td>${sc_damage}</td>`;
            if (i.Loaded) {sc_desc += `<td>LOADED</td>`} else {sc_desc += `<td>UNLOADED</td>`};
            if (i.Uses > 0 && i.BaseLimit > 0) {sc_desc += `<td>USES: ${i.Uses}/${i.BaseLimit}</td>`};
            sc_desc += `<tr>`;
            if (i.Trigger) {
                sc_desc += `<tr><td colspan="6"><details><summary>Trigger</summary><p>${i.Trigger}</p></details></td></tr>`;
            };
            if (i.OnHit) {
                sc_desc += `<tr><td colspan="6"><details><summary>On Hit</summary><p>${i.OnHit}</p></details></td></tr>`;
            };
            if (i.Effect) {
                sc_desc += `<tr><td colspan="6">${i.Effect}</td></tr>`;
            };
            if (i.Tags.length > 0) {
                sc_desc += `<tr><td colspan="6"><details><summary>Tags</summary>`;
                i.Tags.forEach((t, index) => {
                    sc_desc += `<p>${t.Tag.Name.replace("{VAL}", t.Value)}</p>`;
                });
                sc_desc += `</details></td></tr>`;
            };
            sc_entry += sc_desc;
        }
        sc_weapons += sc_entry;
        sc_weapons += `</table>`
    });
    return sc_weapons
};

//construct_templates
function construct_templates(sc_dir) {
    let sc_templates = ``;
    let sc_temp = sc_dir._templates;
    if (!sc_temp || sc_temp.length == 0) {
        sc_templates += "<p>NONE</p>";
    } else {
        sc_temp.forEach(i => {
            let sc_entry = `<p>${i.Name}</p>`;
            sc_templates += sc_entry;
        });
    }

    sc_templates += "<br>";
    return sc_templates
};

if (!game.folders.getName(journalFolder) && journalFolder.length > 0) {
    try {
        await Folder.create({ name: journalFolder, type: "JournalEntry"})
    } catch (error) {
        ui.notifications.error(`${journalFolder} does not exist and must be created manually by a user with permissions to do so.`);
        return;
    }
};

targets.forEach(async (target, index) => {
    let sc_dir = target.document.actor._prev_derived.mm
    let hase_table_html = `
    <p><img style="border: 3px dashed #000000; float: left; margin-right: 5px; margin-left: 5px;" src="${target.document.actor.img}" width="30%" height="30%" /></p>
    <div style="color: #000000; width: 65%; float: right; text-align: left;">
    <table>
        <tr>
            <th>HULL</th><th>AGI</th><th>SYS</th><th>ENG</th>
        </tr>
        <tr>
            <td>${sc_dir.Hull || 0}</td><td>${sc_dir.Agi || 0}</td><td>${sc_dir.Sys || 0}</td><td>${sc_dir.Eng || 0}</td>
        </tr>
    </table>
    `
    let stat_table_html = `
    <table>
        <tr>
            <th>Armor</th><th>HP</th><th>Heat</th><th>Speed</th>
        </tr>
        <tr>
            <td>${sc_dir.Armor}</td><td>${sc_dir.CurrentHP}/${sc_dir.MaxHP}</td><td>${sc_dir.CurrentHeat || 0}/${sc_dir.HeatCapacity || 0}</td><td>${sc_dir.Speed}</td>
        </tr>
        <tr>
            <th>Evasion</th><th>E-Def</th><th>Save</th><th>Sensors</th>
        </tr>
        <tr>
            <td>${sc_dir.Evasion}</td><td>${sc_dir.EDefense}</td><td>${sc_dir.SaveTarget}</td><td>${sc_dir.SensorRange}</td>
        </tr>
        <tr>
            <th>Size</th><th>Activ</th><th>Struct</th><th>Stress</th>
        </tr>
        <tr>
            <td>${sc_dir.Size}</td><td>${sc_dir.Activations || 1}</td><td>${sc_dir.CurrentStructure || 0}/${sc_dir.MaxStructure || 0}</td><td>${sc_dir.CurrentStress || 0}/${sc_dir.MaxStress || 0}</td>
        </tr>
    </table>
    `
    console.log(sc_dir)
    let sc_class = (!sc_dir._classes || sc_dir._classes.length == 0) ? "NONE" : sc_dir._classes[0].Name
    let sc_tier = sc_dir.Tier ? sc_dir.Tier : 0
    let sc_templates = construct_templates(sc_dir)
    let sc_list = ``
    let sc_weapons = ``
    if (!sc_dir._features || sc_dir._features.length == 0) {
        sc_list += "<p>NONE</p>";
        sc_weapons += "<p>NONE</p>";
    } else {
        let sc_origins = new Array;
        sc_dir._features.forEach(f => {
            let origin = f.Origin.name;
            if (!sc_origins.includes(origin)) {
                sc_origins.push(origin);
            };
        });
        sc_origins.forEach(o => {
            sc_list += construct_features(sc_dir, o);
            sc_weapons += construct_weapons(sc_dir, o, sc_tier);
        });
    };

    // ChatMessage.create({
    //     user: game.user._id,
    //     content: `<h2>Scan results: ${sc_dir.Name}</h2>` + `<h3>Class: ${sc_class}, Tier ${sc_tier}</h3>`  + hase_table_html + stat_table_html + `<h3>Templates:</h3>` + sc_templates + `<h3>Systems:</h3>` + sc_list
    // });

    var scanContent = `<h2>Scan results: ${sc_dir.Name}</h2>` + `<h3>Class: ${sc_class}, Tier ${sc_tier}</h3>`  + hase_table_html + stat_table_html + `</div><div style="color: #000000; width: 100%; float: right; text-align: left;"><h3>Weapons:</h3>` + sc_weapons + `<h3>Templates:</h3>` + sc_templates + `<h3>Systems:</h3>` + sc_list + `</div>`

    //This checks and updates the scan entry for the target(s) if a single scan entry exists in the specified folder for the target(s) along with the updateExisting flag.
    //If either are false then this creates a new scan entry.

	// If folder is named
    if (journalFolder) {
		// If a journal entry exists within journalFolder that contains the name of the actor and we are willing to update an existing entry
        if (game.folders.getName(journalFolder).contents.filter(e => e.name.match(sc_dir.Name)).length == 1 && updateExisting == true) {
			let updateScan = new Object();
			updateScan.name = game.folders.getName(journalFolder).contents.filter(e => e.name.match(sc_dir.Name))[0].name;
			updateScan.folder = game.folders.getName(journalFolder).id;
			updateScan.content = scanContent;
			updateScan._id = game.folders.getName(journalFolder).contents.filter(e => e.name.match(sc_dir.Name))[0]._id;
			game.journal.getName(game.folders.getName(journalFolder).contents.filter(e => e.name.match(sc_dir.Name))[0].name).sheet._updateObject("", updateScan);
			game.journal.getName(game.folders.getName(journalFolder).contents.filter(e => e.name.match(sc_dir.Name))[0].name).update({ permission: { default: permissionLevel }});
			game.journal.getName(game.folders.getName(journalFolder).contents.filter(e => e.name.match(sc_dir.Name))[0].name).sheet.render(true);
		}
		// An entry with the npc's name does not exist, or there are more than 1, or we are not willing to update existing entries
		else {
			let scanCount = zeroPad(game.folders.getName(journalFolder).contents.filter(e => e.name.match(nameTemplate)).length + startingNumber, numberLength); 
			let scanName = nameTemplate + scanCount + ` - ` + sc_dir.Name;
			let newScan = new Object();
			newScan.name = scanName;
			newScan.folder = game.folders.getName(journalFolder).id;
			newScan.content = scanContent;
			await JournalEntry.create(newScan);
			game.journal.getName(scanName).update({ permission: { default: permissionLevel }});
			game.journal.getName(scanName).sheet.render(true);
		};
	} else {
		if (game.journal.contents.filter(e => e.name.match(sc_dir.Name)).length == 1 && updateExisting == true) {
			let updateScan = new Object();
			updateScan.name = game.journal.contents.filter(e => e.name.match(sc_dir.Name))[0].name;
			updateScan.folder = null;
			updateScan.content = scanContent;
			updateScan._id = game.journal.contents.filter(e => e.name.match(sc_dir.Name))[0]._id;
			game.journal.contents.filter(e => e.name.match(sc_dir.Name))[0].sheet._updateObject("", updateScan);
			game.journal.contents.filter(e => e.name.match(sc_dir.Name))[0].update({ permission: { default: permissionLevel }});
			game.journal.contents.filter(e => e.name.match(sc_dir.Name))[0].sheet.render(true);
		} else {
			let scanCount = zeroPad(game.journal.contents.filter(e => e.name.match(nameTemplate)).length + startingNumber, numberLength); 
			let scanName = nameTemplate + scanCount + ` - ` + sc_dir.Name;
			let newScan = new Object();
			newScan.name = scanName;
			newScan.folder = null;
			newScan.content = scanContent;
			await JournalEntry.create(newScan);
			game.journal.getName(scanName).update({ permission: { default: permissionLevel }});
			game.journal.getName(scanName).sheet.render(true);
		};
	}
})