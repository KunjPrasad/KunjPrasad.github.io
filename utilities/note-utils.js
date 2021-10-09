import { downloadBlobAsFile, getFileText  } from '/utilities/file-utils.js';

const LOCALSTORAGE_NOTE_FILENAME_KEY_PREFIX = "noteFilename";
const LOCALSTORAGE_NOTE_HAS_CHANGES_KEY_PREFIX = "noteHasChanges";
const LOCALSTORAGE_NOTES_KEY_PREFIX = "notes";

const getLocalStorageKey = (localStorageKeyPrefix, bookKey) => `${localStorageKeyPrefix}-${bookKey}`;

const getContentNotesKey = (bookKey, contentId) => `${getLocalStorageKey(LOCALSTORAGE_NOTES_KEY_PREFIX, bookKey)}-${contentId}`;
const getContentIdFromContentNotesKey = (bookKey, key) => {
	if (!key.startsWith(getLocalStorageKey(LOCALSTORAGE_NOTES_KEY_PREFIX, bookKey))) {
		return null;
	} else {
		return key.split('-')[2];
	}
};

const mergeNotesToExisting = (bookKey, notesObject /*Type{[contentId:string]: {[noteId:string]: string}}*/) => {
	const localStorage = window.localStorage;
	for (const contentId in notesObject) {
		const contentNotesKey = getContentNotesKey(bookKey, contentId);
		const existingContentNotesObject = JSON.parse(localStorage.getItem(contentNotesKey) || '{}');
		const newContentNotesObject = {...existingContentNotesObject, ...notesObject[contentId]}; // make new notes or overwrite existing
		localStorage.setItem(contentNotesKey, JSON.stringify(newContentNotesObject));
	}
};

export const getNotesForContentIdAsIdSortedList = (bookKey, contentId) => {
	const contentNotesKey = getContentNotesKey(bookKey, contentId);
	const stringifiedContentNotesObject = localStorage.getItem(contentNotesKey);
	if (!stringifiedContentNotesObject) {
		return [];
	}
	const contentNotesObject = JSON.parse(stringifiedContentNotesObject);
	const contentNotesAsList = Object.keys(contentNotesObject).map((noteId) => ({id: noteId, text: contentNotesObject[noteId]}));
	contentNotesAsList.sort((elem1, elem2) => elem1.id < elem2.id ? -1 : 1);
	return contentNotesAsList;
};

const getAllNotes = (bookKey) => {
	const localStorage = window.localStorage;
	const allNotes = {};
	for(const contentNotesKey in localStorage) {
		const contentId = getContentIdFromContentNotesKey(bookKey, contentNotesKey);
		if (!contentId) {
			continue;
		}
		allNotes[contentId] = JSON.parse(localStorage.getItem(contentNotesKey));
	}
	return allNotes;
};

const updateLocalStorageOnNoteUpload = (bookKey, noteFileName, notesObject) => {
	mergeNotesToExisting(bookKey, notesObject);
	window.localStorage.setItem(getLocalStorageKey(LOCALSTORAGE_NOTE_FILENAME_KEY_PREFIX, bookKey), noteFileName);
};

const updateLocalStorageOnNoteDownload = (bookKey, noteFileName) => {
	const localStorage = window.localStorage;
	localStorage.setItem(getLocalStorageKey(LOCALSTORAGE_NOTE_FILENAME_KEY_PREFIX, bookKey), noteFileName);
	localStorage.removeItem(getLocalStorageKey(LOCALSTORAGE_NOTE_HAS_CHANGES_KEY_PREFIX, bookKey));
};

const updateLocalStorageOnAddUpdateNote = (bookKey, notesObject) => {
	mergeNotesToExisting(bookKey, notesObject);
	window.localStorage.setItem(getLocalStorageKey(LOCALSTORAGE_NOTE_HAS_CHANGES_KEY_PREFIX, bookKey), 'true');
};

const updateLocalStorageOnDeleteNote = (bookKey, notesObject) => {
	const localStorage = window.localStorage;
	for (const contentId in notesObject) {
		const contentNotesKey = getContentNotesKey(bookKey, contentId);
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

const updateNoteStatusElementOnNoteUploadFail = (bookKey, noteStatusElementQuery, noteFileName) => {
	const localStorage = window.localStorage;
	const existingNoteFileName = localStorage.getItem(getLocalStorageKey(LOCALSTORAGE_NOTE_FILENAME_KEY_PREFIX, bookKey));
	const hasChanges = localStorage.getItem(getLocalStorageKey(LOCALSTORAGE_NOTE_HAS_CHANGES_KEY_PREFIX, bookKey));
	const localHasChangesMessage = ` NOTE: ${hasChangesMessage}`;
	noteStatusElementQuery.text(`Failed to upload note file ${noteFileName}.${existingNoteFileName ? ' Also using previous uploaded notes.': ''}${hasChanges ? localHasChangesMessage: ''}`);
	noteStatusElementQuery.removeClass("alert-secondary alert-danger alert-warning alert-success");
	noteStatusElementQuery.addClass("alert-danger");
};

const updateNoteStatusElementOnNoteDownload = (bookKey, noteStatusElementQuery) => {
	const localStorage = window.localStorage;
	const noteFileName = localStorage.getItem(getLocalStorageKey(LOCALSTORAGE_NOTE_FILENAME_KEY_PREFIX, bookKey));
	noteStatusElementQuery.text(`Succussfully downloaded file ${noteFileName}.`);
	noteStatusElementQuery.removeClass("alert-secondary alert-danger alert-warning alert-success");
	noteStatusElementQuery.addClass("alert-success");
};

const updateNoteStatusElementOnNoteChange = (noteStatusElementQuery) => {
	noteStatusElementQuery.text(hasChangesMessage);
	noteStatusElementQuery.removeClass("alert-secondary alert-danger alert-warning alert-success");
	noteStatusElementQuery.addClass("alert-warning");
};

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

export const onDownloadNoteFile = (bookKey, downloadFileName, noteStatusElementQuery) => {
	const personalNotesBlob = new Blob( [JSON.stringify(getAllNotes(bookKey))], {type: 'application/json;charset=utf-8'});
	downloadBlobAsFile(personalNotesBlob, downloadFileName);
	updateLocalStorageOnNoteDownload(bookKey, downloadFileName);
	updateNoteStatusElementOnNoteDownload(bookKey, noteStatusElementQuery);
};

export const onNoteAddUpdate = (bookKey, notesObject, noteStatusElementQuery) => {
	updateLocalStorageOnAddUpdateNote(bookKey, notesObject);
	updateNoteStatusElementOnNoteChange(noteStatusElementQuery);
};

export const onNoteDelete = (bookKey, notesObject, noteStatusElementQuery) => {
	updateLocalStorageOnDeleteNote(bookKey, notesObject);
	updateNoteStatusElementOnNoteChange(noteStatusElementQuery);
};