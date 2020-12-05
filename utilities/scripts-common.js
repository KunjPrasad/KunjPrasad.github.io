let personalNotes = {}; // variable to collect personal notes
let isNotesModified = false; // boolean flag to identify if notes have been modified by adding or removing a personal note. Changes by uploading file does not count.

/**
 * Utility method to add a note for a content-id.
 * @param [string] contentId - id of the content for which the note is being added
 * @param [string] noteText - new note text to add
 * @param [string=] noteCreatedText - the time of note creation, as long. Default is now
 */
const addPersonalNote = (contentId, noteText, noteCreatedText=`${new Date().getTime()}`)  => {
	if (!personalNotes[contentId]) {
		personalNotes[contentId] = [];
	}
	personalNotes[contentId].push({text: noteText, createdText: noteCreatedText});
	isNotesModified = true;
};

/**
 * Utility method to update a note for a content-id.
 * @param [string] contentId - id of the content for which the note is being update
 * @param [string] noteText - updated note text
 * @param [string] noteCreatedText - in text form, the time when note is initially created. This is used to identify the note that needs to be updated
 */
const updatePersonalNote = (contentId, noteText, noteCreatedText)  => {
	if (!personalNotes[contentId]) {
		return; // adding as a fail-safe. Ideally, this branch will never get called.
	}
	personalNotes[contentId].filter((note) => note.createdText === noteCreatedText).forEach((note) => {note.text = noteText});
	isNotesModified = true;
};

/**
 * Utility method to remove a note for a content-id.
 * @param [string] contentId - id of the content for which the note is being removed
 * @param [string] noteCreatedText - in text form, the time when note is created. This is used to identify the note that needs to be deleted
 */
const removePersonalNote = (contentId, noteCreatedText)  => {
	if (!personalNotes[contentId]) {
		return; // adding as a fail-safe. Ideally, this branch will never get called.
	}
	personalNotes[contentId] = personalNotes[contentId].filter((note) => note.createdText !== noteCreatedText);
	isNotesModified = true;
};

/**
 * Utility method to bridge add note functionality with implementation.
 */
 const onBlankNoteAdd = (event) => {
	const noteCreatedText = `${new Date().getTime()}`;
	const contentId = event.target.dataset.contentId;
	addPersonalNote(contentId, '', noteCreatedText);
	$(event.target).before(`<textarea class="note" rows="2" data-content-id="${contentId}" data-note-created-text="${noteCreatedText}"></textarea>`);
}

/**
 * Utility method to bridge update/remove note functionality with implementation.
 */
const onNoteTextBlur = (event) => {
	const newValue = event.target.value;
	const contentId = $(event.target).attr('data-content-id');
	const noteCreatedText = $(event.target).attr('data-note-created-text');
	if (newValue) {
		updatePersonalNote(contentId, newValue, noteCreatedText);
	} else {
		removePersonalNote(contentId, noteCreatedText);
		$(event.target).css("display", "none"); // hide textarea when note deleted
	}
}

const attachNoteHandlers = () => {
	$("main").on("blur", ".note", onNoteTextBlur);
	$("main").on("click", ".note-add", onBlankNoteAdd);
};

/**
 * Utility method to  add a handler for all immediate-child anchor-links inside nav, such that clicking on element loads the corresponding content inside <main>. It updates the hash in location. It find all elements with "id" attribute and add the existing notes after it, followed by a button to add more note. Corresponding note related handlers are also wired. Finally, if the method is provided an argument identifying a function that must be run after the page is loaded, then that function is executed.
 * @param [Object] postLoadOperationMap - An object with key as id of anchor tag within nav, and value being a function that is executed after page is loaded
 */
const prepareNavAnchorToLoadInMain = (postLoadOperationMap = {}) => {
	$("nav > a").each(function() {
		$(this).on("click", function(event) {
			event.preventDefault();
			const anchorTagId = $(this).attr('id');
			location.hash = anchorTagId;
			const onLoadComplete = function(responseText, textStatus, jqXHR) {
				// not checking textStatus as shown in jquery docs, since that case will not happen
				$("main [id]").after(function() {
					const contentId = $(this).attr('id');
					const noteAppends = (personalNotes[contentId] || []).map((note) => `<textarea class="note" rows="2" data-content-id="${contentId}" data-note-created-text="${note.createdText}">${note.text}</textarea>`);
					noteAppends.push(`<button class="note-add" data-content-id="${contentId}">Add note</button>`)
					return noteAppends.join('');
				});
				if (postLoadOperationMap[anchorTagId]) {
					postLoadOperationMap[anchorTagId]();
				}
			};
			$("main").load($(this).attr('href'), onLoadComplete);
		});
	});
};

/**
 * Utility method to download a blob as a file.
 * @param [Blob] blob - blob data to download
 * @param [string] fileName - name of file getting downloaded
 */
const downloadBlobAsFile = (blob, fileName = `download-${new Date().getTime()}`) => {
	if (window.navigator &&  window.navigator.msSaveOrOpenBlob) {
		return window.navigator.msSaveOrOpenBlob(blob);
	}
	
    const blobDataAsUrl = URL.createObjectURL(blob);
    const downloadLinkElement = document.createElement('a');
    downloadLinkElement.href = blobDataAsUrl;
    downloadLinkElement.download = fileName;
	downloadLinkElement.style.display = 'none';
	document.body.appendChild(downloadLinkElement);
	downloadLinkElement.click();
	document.body.removeChild(downloadLinkElement);
}; 

/* Utility method to handle an error. For now, it means console-logging it */
const handleError = console.log;

/**
 * Utility method to initialize the personalNotes by reading from an uploaded json file
 */
const uploadPersonalNotes = (uploadFile, onLoad, onError) => {
	const reader = new FileReader();
	reader.addEventListener('load', (event) => {
		try {
			mergePersonalNotesToExisting(JSON.parse(event.target.result) || {});
			onLoad(uploadFile); // to trigger any other actions
		} catch(error) {
			handleError(error);
			onError(uploadFile);
		}
	});
	reader.addEventListener('error', onError); // don't know when it happens and so, how to get error object. Haven't wired `handleError`
	reader.readAsText(uploadFile);
};

/**
 * Utility method to merge a notes object into the one existing
 */
const mergePersonalNotesToExisting = (newNotes) => {
	for (const contentId in newNotes) {
		if (!personalNotes[contentId]) {
			personalNotes[contentId] = newNotes[contentId];
			newNotes[contentId] = null; // removes refrential link from 2 both persnalNotes and newNotes to same note object
		} else {
			personalNotes[contentId] = [...personalNotes[contentId], ...newNotes[contentId]];
			personalNotes[contentId].sort((note1, note2) => note1.createdText < note2.createdText);
		}
	}
};

/**
 * Utility method to download the personalNotes as a json file
 * @param [string=] fileNamePrefix - prefix to use for downloaded file name with note data. Defaults to `noPrefix`
 */
const downloadPersonalNotes = (fileNamePrefix = 'noPrefix') => {
	const personalNotesBlob = new Blob( [JSON.stringify(personalNotes)], {type: 'application/json;charset=utf-8'});
	const fileName = `personalNotes-${fileNamePrefix}-${new Date().getTime()}.json`
	downloadBlobAsFile(personalNotesBlob, fileName);
};
