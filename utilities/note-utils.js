import { downloadBlobAsFile, getFileText  } from '/utilities/file-utils.js';

// IMPORTANT: NOTE that the key prefixes MUST NOT have hyphen/dash, else some function may break.
const LOCALSTORAGE_NOTE_FILENAME_KEY_PREFIX = "noteFilename";
const LOCALSTORAGE_NOTE_HAS_CHANGES_KEY_PREFIX = "noteHasChanges";
const LOCALSTORAGE_NOTES_KEY_PREFIX = "notes";

/**
 * Utility method to get the key used to store data related a book in the localStorarge.
 * @param {string} localStorageKeyPrefix - The key prefix. NOTE: It MUST NOT have hyphen/dash, else some function may break.
 * @param {string} bookKey - A key specific to the html book. NOTE: It MUST NOT have hyphen/dash, else some function may break.
 * @returns {string}
 */
const getLocalStorageKey = (localStorageKeyPrefix, bookKey) => `${localStorageKeyPrefix}-${bookKey}`;

/**
 * Utility method to get the key used to notes data for a particular contentId, and related a book, in the localStorarge.
 * @param {string} bookKey - A key specific to the html book. NOTE: It MUST NOT have hyphen/dash, else some function may break.
 * @param {string} contentId - The id of content to which note is being added. NOTE: It MUST NOT have hyphen/dash, else some function may break.
 * @returns {string}
 */
const getLocalStorageContentNotesKey = (bookKey, contentId) => `${getLocalStorageKey(LOCALSTORAGE_NOTES_KEY_PREFIX, bookKey)}-${contentId}`;

/**
 * Utility method to get the id of a content in the book corresponding to a key in localStorage. If the key does not have a structure as expected for a content-notes key, then null is returned.
 * @param {string} bookKey - A key specific to the html book.
 * @param {string} key - The key used in localStorage.
 * @returns {string|null}
 */
const getContentIdFromLocalStorageContentNotesKey = (bookKey, key) => {
	if (!key.startsWith(getLocalStorageKey(LOCALSTORAGE_NOTES_KEY_PREFIX, bookKey))) {
		return null;
	} else {
		return key.split('-')[2];
	}
};

/*
 * Type NotesObjectType = {[contentId:string]: {[noteId:string]: string}};
 */
 
 /**
  * Utility method to merge a new notes for a book into existing ones saved in localStorage. If the note does not already exist, then it is 
  * added. If a note already exists for a noteId, then it is modified/updated.
  * @param {string} bookKey - A key specific to the html book.
  * @param {NotesObjectType} notesObject - notes object with note(s) corresponding to content(s) that should be added/updated.
  */
const mergeNotesToExistingOnLocalStorage = (bookKey, notesObject) => {
	const localStorage = window.localStorage;
	for (const contentId in notesObject) {
		const contentNotesKey = getLocalStorageContentNotesKey(bookKey, contentId);
		const existingContentNotesObject = JSON.parse(localStorage.getItem(contentNotesKey) || '{}');
		const newContentNotesObject = {...existingContentNotesObject, ...notesObject[contentId]}; // make new notes or overwrite existing
		localStorage.setItem(contentNotesKey, JSON.stringify(newContentNotesObject));
	}
};

/**
 * Method to get all notes for a contentId in a book. The notes are pulled from localStorage
 * @param {string} bookKey - A key specific to the html book.
 * @param {string} contentId - The id of content-element in book corresponding to which the notes should be retrieved.
 * @returns {[{id: typeof keyof NotesObjectType[contentId]; text: typeof NotesObjectType[contentId][noteId]}]} - The returned notes are sorted in ascending order by notes-id. If no notes are found, then an empty list is returned.
 */
export const getNotesForContentIdFromLocalStorageAsIdSortedList = (bookKey, contentId) => {
	const contentNotesKey = getLocalStorageContentNotesKey(bookKey, contentId);
	const stringifiedContentNotesObject = localStorage.getItem(contentNotesKey);
	if (!stringifiedContentNotesObject) {
		return [];
	}
	const contentNotesObject = JSON.parse(stringifiedContentNotesObject);
	const contentNotesAsList = Object.keys(contentNotesObject).map((noteId) => ({id: noteId, text: contentNotesObject[noteId]}));
	contentNotesAsList.sort((elem1, elem2) => elem1.id < elem2.id ? -1 : 1);
	return contentNotesAsList;
};

/**
 * Utility method to get all notes corresponding to a book from the localStorage.
 * @param {string} bookKey - A key specific to the html book.
 * @return {NotesObjectType}
 */
const getAllNotesFromLocalStorage = (bookKey) => {
	const localStorage = window.localStorage;
	const allNotes = {};
	for(const contentNotesKey in localStorage) {
		const contentId = getContentIdFromLocalStorageContentNotesKey(bookKey, contentNotesKey);
		if (!contentId) {
			continue;
		}
		allNotes[contentId] = JSON.parse(localStorage.getItem(contentNotesKey));
	}
	return allNotes;
};

/**
 * Utility method to update the localStorage when notes are uploaded from a file. 
 * The newly added notes are merged with the existing ones (which may have any unsaved notes), and the name of file from where the 
 * notes are read is stored.
 * @param {string} bookKey - A key specific to the html book.
 * @param {string} noteFileName - The name of file from where notes are uploaded
 * @param {NotesObjectType} notesObject - newly uploaded notes
 */
const updateLocalStorageOnNoteUpload = (bookKey, noteFileName, notesObject) => {
	mergeNotesToExistingOnLocalStorage(bookKey, notesObject);
	window.localStorage.setItem(getLocalStorageKey(LOCALSTORAGE_NOTE_FILENAME_KEY_PREFIX, bookKey), noteFileName);
};

/**
 * Utility method to update the localStorage when notes are downloaded. 
 * The filename of the downloaded file is saved. The marker in localStorage to identify if there are any unsaved notes is reset.
 * @param {string} bookKey - A key specific to the html book.
 * @param {string} noteFileName - The name of file where the notes are downloaded to
 */
const updateLocalStorageOnNoteDownload = (bookKey, noteFileName) => {
	const localStorage = window.localStorage;
	localStorage.setItem(getLocalStorageKey(LOCALSTORAGE_NOTE_FILENAME_KEY_PREFIX, bookKey), noteFileName);
	localStorage.removeItem(getLocalStorageKey(LOCALSTORAGE_NOTE_HAS_CHANGES_KEY_PREFIX, bookKey));
};

/**
 * Utility method to update the localStorage when note add/update is made from the webpage.
 * The provided notes are merged to existing ones. A marker is added in localStorage to identify that there are unsaved notes.
 * @param {string} bookKey - A key specific to the html book.
 * @param {NotesObjectType} notesObject - Notes object with entries being added/updated
 */
const updateLocalStorageOnAddUpdateNote = (bookKey, notesObject) => {
	mergeNotesToExistingOnLocalStorage(bookKey, notesObject);
	window.localStorage.setItem(getLocalStorageKey(LOCALSTORAGE_NOTE_HAS_CHANGES_KEY_PREFIX, bookKey), 'true');
};

/**
 * Utility method to update the localStorage when note deletions are made from the webpage.
 * The noteIds for each contentId is deleted. A marker is added in localStorage to identify that there are unsaved notes.
 * @param {string} bookKey - A key specific to the html book.
 * @param {NotesObjectType} notesObject - Notes object with entries being deleted. NOTE that only the contentId and noteId from the `NotesObjectType` are used. The note-text is not used and can be anything.
 */
const updateLocalStorageOnDeleteNote = (bookKey, notesObject) => {
	const localStorage = window.localStorage;
	for (const contentId in notesObject) {
		const contentNotesKey = getLocalStorageContentNotesKey(bookKey, contentId);
		const stringifiedContentNotesObject = localStorage.getItem(contentNotesKey);
		if (!stringifiedContentNotesObject) {
			continue;
		}
		const contentNotesObject = JSON.parse(stringifiedContentNotesObject);
		for (const deleteNoteId in notesObject) {
			delete contentNotesObject[deleteNoteId];
		}
		if (Object.keys(contentNotesObject).length === 0) {
			localStorage.removeItem(contentNotesKey);
		} else {
			localStorage.setItem(contentNotesKey, JSON.stringify(contentNotesObject));
		}
	}
	localStorage.setItem(getLocalStorageKey(LOCALSTORAGE_NOTE_HAS_CHANGES_KEY_PREFIX, bookKey), 'true');
};

const hasChangesMessage = "There are changed notes. Please go to homepage and save the changes before exitting. Otherwise, the changes will be lost!";

/** 
 * Utility method to update the status (i.e., text, class) in the provided element to convey that notes have been successfully uploaded 
 * from the file.
 * @param {string} bookKey - A key specific to the html book.
 * @param {JQuery} noteStatusElementQuery - The `JQuery` element to update.
 */
const updateNoteStatusElementOnNoteUploadSuccess = (bookKey, noteStatusElementQuery) => {
	const localStorage = window.localStorage;
	const noteFileName = localStorage.getItem(getLocalStorageKey(LOCALSTORAGE_NOTE_FILENAME_KEY_PREFIX, bookKey));
	const hasChanges = localStorage.getItem(getLocalStorageKey(LOCALSTORAGE_NOTE_HAS_CHANGES_KEY_PREFIX, bookKey));
	noteStatusElementQuery.removeClass("alert-secondary alert-danger alert-warning alert-success");
	if (hasChanges) {
		noteStatusElementQuery.text(`Successfully uploaded file ${noteFileName}. NOTE: ${hasChangesMessage}`);
		noteStatusElementQuery.addClass("alert-warning");
	} else {
		noteStatusElementQuery.text(`Successfully uploaded file ${noteFileName}.`);
		noteStatusElementQuery.addClass("alert-success");
	}
};

/** 
 * Utility method to update the status (i.e., text, class) in the provided element to convey that the update of the note from a provided file
 * has failed.
 * @param {string} bookKey - A key specific to the html book.
 * @param {JQuery} noteStatusElementQuery - The `JQuery` element to update.
 * @param {string} noteFileName - The name of note file that failed upload.
 */
const updateNoteStatusElementOnNoteUploadFail = (bookKey, noteStatusElementQuery, noteFileName) => {
	const localStorage = window.localStorage;
	const existingNoteFileName = localStorage.getItem(getLocalStorageKey(LOCALSTORAGE_NOTE_FILENAME_KEY_PREFIX, bookKey));
	const hasChanges = localStorage.getItem(getLocalStorageKey(LOCALSTORAGE_NOTE_HAS_CHANGES_KEY_PREFIX, bookKey));
	const localHasChangesMessage = ` NOTE: ${hasChangesMessage}`;
	noteStatusElementQuery.text(`Failed to upload note file ${noteFileName}.${existingNoteFileName ? ' Also using previous uploaded notes.': ''}${hasChanges ? localHasChangesMessage: ''}`);
	noteStatusElementQuery.removeClass("alert-secondary alert-danger alert-warning alert-success");
	noteStatusElementQuery.addClass("alert-danger");
};

/** 
 * Utility method to update the status (i.e., text, class) in the provided element to convey that the notes have been downloaded.
 * @param {string} bookKey - A key specific to the html book.
 * @param {JQuery} noteStatusElementQuery - The `JQuery` element to update.
 */
const updateNoteStatusElementOnNoteDownload = (bookKey, noteStatusElementQuery) => {
	const localStorage = window.localStorage;
	const noteFileName = localStorage.getItem(getLocalStorageKey(LOCALSTORAGE_NOTE_FILENAME_KEY_PREFIX, bookKey));
	noteStatusElementQuery.text(`Succussfully downloaded file ${noteFileName}.`);
	noteStatusElementQuery.removeClass("alert-secondary alert-danger alert-warning alert-success");
	noteStatusElementQuery.addClass("alert-success");
};

/** 
 * Utility method to update the status (i.e., text, class) in the provided element to convey that there are unsaved notes.
 * @param {JQuery} noteStatusElementQuery - The `JQuery` element to update.
 */
const updateNoteStatusElementOnNoteChange = (noteStatusElementQuery) => {
	noteStatusElementQuery.text(hasChangesMessage);
	noteStatusElementQuery.removeClass("alert-secondary alert-danger alert-warning alert-success");
	noteStatusElementQuery.addClass("alert-warning");
};

/** 
 * Method to update the status (i.e., text, class) in the provided element to provide general information about the notes. This method is
 * expected to be used when a page is loaded for the first time.
 * @param {string} bookKey - A key specific to the html book.
 * @param {JQuery} noteStatusElementQuery - The `JQuery` element to update.
 */
export const updateNoteStatusElementOnPageLoad = (bookKey, noteStatusElementQuery) => {
	const localStorage = window.localStorage;
	const noteFileName = localStorage.getItem(getLocalStorageKey(LOCALSTORAGE_NOTE_FILENAME_KEY_PREFIX, bookKey));
	const hasChanges = localStorage.getItem(getLocalStorageKey(LOCALSTORAGE_NOTE_HAS_CHANGES_KEY_PREFIX, bookKey));
	noteStatusElementQuery.removeClass("alert-secondary alert-danger alert-warning alert-success");
	if (noteFileName) {
		if (hasChanges) {
			noteStatusElementQuery.text(`Added notes from file ${noteFileName}. NOTE: ${hasChangesMessage}`);
			noteStatusElementQuery.addClass("alert-warning");
		} else {
			noteStatusElementQuery.text(`Added notes from file ${noteFileName}.`);
			noteStatusElementQuery.addClass("alert-success");
		}
	} else {
		if (hasChanges) {
			noteStatusElementQuery.text(hasChangesMessage);
			noteStatusElementQuery.addClass("alert-warning");
		} else {
			noteStatusElementQuery.text("No notes have been added / uploaded");
			noteStatusElementQuery.addClass("alert-secondary");
		}
	}
};

/** 
 * Method to update the notes in localStorage and the status (i.e., text, class) in the provided element when notes are uploaded from a file.
 * @param {string} bookKey - A key specific to the html book.
 * @param {File} noteFile - File with notes that are being uploaded.
 * @param {JQuery} noteStatusElementQuery - The `JQuery` element to update.
 */
export const onUploadNoteFile = (bookKey, noteFile, noteStatusElementQuery) => {
	const onUploadNoteFileSuccess = (event) => {
		const uploadNotesObject = JSON.parse(event.target.result);
		updateLocalStorageOnNoteUpload(bookKey, noteFile.name, uploadNotesObject);
		updateNoteStatusElementOnNoteUploadSuccess(bookKey, noteStatusElementQuery);
		window.location.reload();  // to have the new notes get shown on the document when it is loaded
	};
	const onUploadNoteFileFail = (event) => {
		updateNoteStatusElementOnNoteUploadFail(bookKey, noteStatusElementQuery, noteFile.name);
	};
	getFileText(noteFile, onUploadNoteFileSuccess, onUploadNoteFileFail);
};

/** 
 * Method to update the notes in localStorage and the status (i.e., text, class) in the provided element when notes are downloaded to a file.
 * @param {string} bookKey - A key specific to the html book.
 * @param {File} downloadFileName - Name of file where notes are being downloaded to.
 * @param {JQuery} noteStatusElementQuery - The `JQuery` element to update.
 */
export const onDownloadNoteFile = (bookKey, downloadFileName, noteStatusElementQuery) => {
	const personalNotesBlob = new Blob( [JSON.stringify(getAllNotesFromLocalStorage(bookKey))], {type: 'application/json;charset=utf-8'});
	downloadBlobAsFile(personalNotesBlob, downloadFileName);
	updateLocalStorageOnNoteDownload(bookKey, downloadFileName);
	updateNoteStatusElementOnNoteDownload(bookKey, noteStatusElementQuery);
};

/** 
 * Method to update the notes in localStorage and the status (i.e., text, class) in the provided element when notes are added/updated 
 * from the webpage.
 * @param {string} bookKey - A key specific to the html book.
 * @param {NotesObjectType} notesObject - Object with new/updated note(s) for one/multiple contentId(s).
 * @param {JQuery} noteStatusElementQuery - The `JQuery` element to update.
 */
export const onNoteAddUpdate = (bookKey, notesObject, noteStatusElementQuery) => {
	updateLocalStorageOnAddUpdateNote(bookKey, notesObject);
	updateNoteStatusElementOnNoteChange(noteStatusElementQuery);
};

/** 
 * Method to update the notes in localStorage and the status (i.e., text, class) in the provided element when notes are deleted  
 * from the webpage.
 * @param {string} bookKey - A key specific to the html book.
 * @param {NotesObjectType} notesObject - Notes object with entries being deleted. NOTE that only the contentId and noteId from the `NotesObjectType` are used. The note-text is not used and can be anything.
 * @param {JQuery} noteStatusElementQuery - The `JQuery` element to update.
 */
export const onNoteDelete = (bookKey, notesObject, noteStatusElementQuery) => {
	updateLocalStorageOnDeleteNote(bookKey, notesObject);
	updateNoteStatusElementOnNoteChange(noteStatusElementQuery);
};