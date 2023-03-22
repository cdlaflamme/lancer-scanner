

// Journal Folder
var journalFolder = "Lancer Scan Metadata";
var updateExisting = true;
var permissionLevel = 2; //created entries are default: observer

// Helper functions

async function updateScanDb (actorId, scanned){
	// If folder is named
    if (journalFolder) {
		// ensure folder exists
		if (!game.folders.getName(journalFolder) && journalFolder.length > 0) {
			try {
				await Folder.create({ name: journalFolder, type: "JournalEntry"})
			} catch (error) {
				ui.notifications.error(`${journalFolder} does not exist and must be created manually by a user with permissions to do so.`);
				return;
			}
		};
		
		// determine content of created entry
		let entryContent = scanned.toString();
		
		// If a journal entry exists within journalFolder that contains the name of the actor and we are willing to update an existing entry
        if (game.folders.getName(journalFolder).contents.filter(e => e.name.match(actorId)).length == 1 && updateExisting == true) {
			let entryName = actorId;
			let existingEntry = game.folders.getName(journalFolder).contents.filter(e => e.name.match(entryName))[0];
			let updateEntry = new Object();
			updateEntry.name = existingEntry.name;
			updateEntry.folder = game.folders.getName(journalFolder).id;
			updateEntry.content = entryContent;
			updateEntry._id = existingEntry._id;
			game.journal.getName(existingEntry.name).sheet._updateObject("", updateEntry);
			game.journal.getName(existingEntry.name).update({ permission: { default: permissionLevel }});
		}
		// An entry with the npc's name does not exist, or there are more than 1, or we are not willing to update existing entries
		else {
			let scanName = actorId;
			let newScan = new Object();
			newScan.name = scanName;
			newScan.folder = game.folders.getName(journalFolder).id;
			newScan.content = entryContent;
			await JournalEntry.create(newScan);
			game.journal.getName(scanName).update({ permission: { default: permissionLevel }});
		};
	}
	else {
		console.error("Lancer Scan journalFolder was not defined. Something went wrong.");
	}
}

// Create actor scanned fields
Actor.prototype.isScanned = false;
Actor.prototype.isScannedStatusValid = false;

// getter; checks DB if scan status not yet valid
Actor.prototype.getScanned = function(){
	if ( !this.isScannedStatusValid ){
		this.initScanned();
	}
	return this.isScanned;
}

// Scanned setter; interacts with journal entries
Actor.prototype.updateScanned = async function (scanned){
	if (typeof scanned != "boolean"){
		return;
	}
	this.isScanned = scanned;
	
	// update scanned metadata database
	await updateScanDb(this._id, scanned);
}

// runs on init; sets scanned field based on journal db
Actor.prototype.initScanned = function (){
	//check journal entries to see if we've been scanned, set field
	let id = this._id;
	let search = game.journal.contents.filter(entry => entry.name === id);
	//TODO check for more than existence
	let scanned = (search.length != 0);
	this.isScanned = scanned;
	this.isScannedStatusValid = true;
}

/**
Hooks.on("init", function() {
	console.log("This code runs once the Foundry VTT software begins its initialization workflow.");
});
**/

Hooks.on("ready", function() {
	//console.log("This NEW code runs once core initialization is ready and game data is available.");
	//Actor.prototype.system.derived.getScanned = Actor.prototype.getScanned();
	//Loop through actors and set scan statusw
	let actors = Array.from(game.actors);
	actors.forEach(actor => actor.initScanned());
	console.log("Actor scan status initialized.");
});

Hooks.on("hoverToken", function(token, hovered){
	if (hovered) token.actor.initScanned();
});