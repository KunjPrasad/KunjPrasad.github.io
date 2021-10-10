import { 
	onUploadNoteFile, 
	onDownloadNoteFile, 
	onNoteAddUpdate, 
	onNoteDelete, 
	getNotesForContentIdFromLocalStorageAsIdSortedList,
	updateNoteStatusElementOnPageLoad,
} from '/utilities/note-utils.js';

const bookKey = 'prodBackendDev';

const noteStatusElementClass = "note-status"; // one on every page
const noteStatusElementQuery = $(`.${noteStatusElementClass}`);
const addNoteButtonClass = "note-add"; // multiple on 1 page, on every page
const noteTextElementClass = "note-text";  // multiple on 1 page, on every page

// Utility method to make the html for note-text box
const getNoteHtml = (contentId, noteId, noteText) => `<textarea id="${noteId}" class="${noteTextElementClass}" rows="2" data-content-id="${contentId}">${noteText}</textarea>`
 
/**
 * Helper method to show the notes for all sections on the page and a button to enable adding more notes for the section.
 * This is done only for sections with numeric "id" values because, by design, it is expected that the authored content has numeric ids.
 */
const showNotesAndButtonAndStatus = () => {
	$("body [id]").after(function() { // NOTE: DO NOT use an arrow notation. The function body relies on `this` being different matches elements
		const contentId = $(this).attr('id');
		if(isNaN(contentId)) {
			return; // See https://stackoverflow.com/questions/175739/built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number -- combined with fact that the entries after which the "Add note" button must appear have numeric ids - by design.
		}
		const noteAppends = getNotesForContentIdFromLocalStorageAsIdSortedList(bookKey, contentId).map((note) => getNoteHtml(contentId, note.id, note.text));
		noteAppends.push(`<button class="${addNoteButtonClass}" data-content-id="${contentId}">Add note</button>`)
		return noteAppends.join('');
	});
	updateNoteStatusElementOnPageLoad(bookKey, noteStatusElementQuery);
};

/**
 * Helper method to enable notes interactivity. 
 * When the button to add notes is clicked, then a new box is added where note text can be added. The "id" for the note box is  made using
 * the time when the note is created. When any note element is blurred, then the note is updated. If the note does not have any text, then 
 * it is removed.
 */ 
const enableNotesInteractivity = () => {
	$(document.body).on("click", `.${addNoteButtonClass}`, (event) => {
		const noteId = `n${new Date().getTime()}`; // The book itself uses timestamps as id for each paragraphs, which is then used as contentId in the button. To distinguish this from noteId, which also uses numeric timestamp, a `n` prefix is added to noteId.
		const contentId = event.target.dataset.contentId;
		$(event.target).before(getNoteHtml(contentId, noteId, ''));
		$(`#${noteId}`).focus();
	});
	$(document.body).on("blur", `.${noteTextElementClass}`, (event) => {
		const newNoteTextValue = event.target.value;
		const contentId = $(event.target).attr('data-content-id');
		const noteId = $(event.target).attr('id');
		if (newNoteTextValue) {
			onNoteAddUpdate(bookKey, {[contentId]: {[noteId]: newNoteTextValue}}, noteStatusElementQuery);
		} else {
			onNoteDelete(bookKey, {[contentId]: {[noteId]: ''}}, noteStatusElementQuery);
			$(event.target).remove();
		}
	});
};

/**
 * Utility method with logic to be executed when homepage is loaded.
 * In addition to the common logic executed when non-homepage is loaded, i.e., displaying notes and button to add notes, and adding 
 * notes interactivity, the handlers for note-upload and download buttons are also setup. This is done because notes upload/download 
 * button is expected to show up only on the homepage.
 */
export const onHomepageLoad = () => {
	const noteUploadInputId = "note-file-upload-input"; // one, only on homepage
	$(`#${noteUploadInputId}`).change((event) => onUploadNoteFile(bookKey, event.target.files[0], noteStatusElementQuery));
	const noteDownloadButtonId = "note-file-download"; // one, only on homepage
	const downloadFileName = `notes-${bookKey}-${new Date().getTime()}.json`;
	$(`#${noteDownloadButtonId}`).click(() => onDownloadNoteFile(bookKey, downloadFileName, noteStatusElementQuery));
	onNonHomepageLoad();
};

/**
 * Utiity method with logic to be executed when non-homepage page is loaded.
 * If there are any notes, then those are loaded. A button to add more notes is displayed. The interactivity with notes is also loaded 
 * which enables modifying notes and adding more notes.
 */
export const onNonHomepageLoad = () => {
	showNotesAndButtonAndStatus();
	enableNotesInteractivity();
};
