import { 
	onUploadNoteFile, 
	onDownloadNoteFile, 
	onNoteAddUpdate, 
	onNoteDelete, 
	getNotesForContentIdAsIdSortedList,
	updateNoteStatusElementOnPageLoad,
} from '/utilities/note-utils.js';

const bookKey = 'prodBackendDev';

const noteStatusElementClass = "note-status"; // one on every page
const noteStatusElementQuery = $(`.${noteStatusElementClass}`);
const addNoteButtonClass = "note-add"; // multiple on 1 page, on every page
const noteTextElementClass = "note-text";  // multiple on 1 page, on every page

const getNoteHtml = (contentId, noteId, noteText) => `<textarea id="${noteId}" class="${noteTextElementClass}" rows="2" data-content-id="${contentId}">${noteText}</textarea>`
 
const showNotesAndButtonAndStatus = () => {
	$("body [id]").after(function() { // NOTE: DO NOT use an arrow notation. The function body relies on `this` being different matches elements
		const contentId = $(this).attr('id');
		if(isNaN(contentId)) {
			return; // See https://stackoverflow.com/questions/175739/built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number -- combined with fact that the entries after which the "Add note" button must appear have numeric ids - by design.
		}
		const noteAppends = getNotesForContentIdAsIdSortedList(bookKey, contentId).map((note) => getNoteHtml(contentId, note.id, note.text));
		noteAppends.push(`<button class="${addNoteButtonClass}" data-content-id="${contentId}">Add note</button>`)
		return noteAppends.join('');
	});
	updateNoteStatusElementOnPageLoad(bookKey, noteStatusElementQuery);
};

const enableNotesInteractivity = () => {
	$(document.body).on("click", `.${addNoteButtonClass}`, (event) => {
		const noteId = `n${new Date().getTime()}`; // The book itself uses timestamps as id for each paragraphs, which is then used as contentId in the button. To distinguish this from noteId, which also uses numeric timestamp, a `n` prefix is added to noteId.
		const contentId = event.target.dataset.contentId;
		$(event.target).before(getNoteHtml(contentId, noteId, ''));
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
 * Utility method with logic to be executed when homepage is loaded
 */
export const onHomepageLoad = () => {
	const noteUploadInputId = "note-file-upload-input"; // one, only on homepage
	$(`#${noteUploadInputId}`).change((event) => onUploadNoteFile(bookKey, event.target.files[0], noteStatusElementQuery));
	const noteDownloadButtonId = "note-file-download"; // one, only on homepage
	const downloadFileName = `notes-${bookKey}-${new Date().getTime()}.json`;
	$(`#${noteDownloadButtonId}`).click(() => onDownloadNoteFile(bookKey, downloadFileName, noteStatusElementQuery));
	onNonHomepageLoad();
};

export const onNonHomepageLoad = () => {
	showNotesAndButtonAndStatus();
	enableNotesInteractivity();
};
