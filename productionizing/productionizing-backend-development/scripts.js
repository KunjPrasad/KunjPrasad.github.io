import { isNotesModified } from '/utilities/backend-notes.js';
import { downloadPersonalNotes, uploadPersonalNotes } from '/utilities/service-notes.js';
import { attachNoteHandlers, getNavAndMainElemIdFromLocationHash, prepareNavAnchorToLoadInMain, bindMainHashLinkToNavClick } from '/utilities/service-onload.js';

// constants used relating to upload of note file and upload status
const noteUploadStatusId = "prod-back-dev-note-upload-status";
let uploadedNoteFileData = {status: null, fileName: null, uploadDateTime: null};

/**
 *  Utility method to update the element displaying upload status for successful upload
 */
const updateUploadStatusSuccess = () => {
	const noteUploadStatusNodeQuery = $(`#${noteUploadStatusId}`);
	noteUploadStatusNodeQuery.text(`Succussfully uploaded file ${uploadedNoteFileData.fileName} at ${uploadedNoteFileData.uploadDateTime}.`);
	noteUploadStatusNodeQuery.removeClass("alert-secondary alert-danger");
	noteUploadStatusNodeQuery.addClass("alert-success");
};

/**
 *  Utility method to update the element displaying upload status for errored upload
 */
const updateUploadStatusError = () => {
	const noteUploadStatusNodeQuery = $(`#${noteUploadStatusId}`);
	noteUploadStatusNodeQuery.text(`Failed an attempt to upload file ${uploadedNoteFileData.fileName} at ${uploadedNoteFileData.uploadDateTime}!`);
	noteUploadStatusNodeQuery.removeClass("alert-secondary alert-success");
	noteUploadStatusNodeQuery.addClass("alert-danger");
};

/**
 *  Utility method to reset the element displaying upload status.
 */
const updateUploadStatusReset = () => {
	const noteUploadStatusNodeQuery = $(`#${noteUploadStatusId}`);
	noteUploadStatusNodeQuery.text('No note file has been uploaded');
	noteUploadStatusNodeQuery.removeClass("alert-secondary alert-success alert-danger");
	noteUploadStatusNodeQuery.addClass("alert-secondary");
};

/**
 * Utility method defining the handler for processing note-file uploaded by user
 */
export const onUploadNoteFileChange = (uploadFile) => {
	uploadPersonalNotes(
		uploadFile, 
		(uploadFile) => {
			uploadedNoteFileData = {status: 'SUCCESS', fileName: uploadFile.name, uploadDateTime: new Date()};
			updateUploadStatusSuccess();
		}, 
		(uploadFile) => {
			uploadedNoteFileData = {status: 'ERROR', fileName: uploadFile.name, uploadDateTime: new Date()};
			updateUploadStatusError();
		}, 
	);
}

const downFileNamePrefix = 'prodBackendDev';

/**
 * Utility method defining the handler for processing note-file download request
 */
export const onDownloadNoteFile = () => downloadPersonalNotes(downFileNamePrefix);

/**
 * Utility method to update text in paragrah which shows the note-file upload status
 */
const updateNoteUploadStatus = () => {
	const noteUploadStatusNodeQuery = $(`#${noteUploadStatusId}`);
	if (!noteUploadStatusNodeQuery.length) {
		return; // fail-safe if there is no noteUploadStatus-id on page. Ideally, this will never be called
	}
	if (!uploadedNoteFileData.status) {
		updateUploadStatusReset();
	} else {
		if (uploadedNoteFileData.status === 'SUCCESS') {
			updateUploadStatusSuccess();
		} else {
			updateUploadStatusError();
		}
	}
};

const noteModifiedStatusId = "prod-back-dev-note-modified-status";

/**
 * Utility method to update text in paragrah which shows the note-modified status
 */
const updateNoteModifiedStatus = () => {
	const noteModifiedStatusNodeQuery = $(`#${noteModifiedStatusId}`);
	if (!noteModifiedStatusNodeQuery.length) {
		return; // fail-safe if there is no noteModifiedStatus-id on page. Ideally, this will never be called
	}
	if (isNotesModified()) {
		noteModifiedStatusNodeQuery.text(`There are modified notes! Please save a copy of notes before exitting.`);
		noteModifiedStatusNodeQuery.removeClass("alert-secondary");
		noteModifiedStatusNodeQuery.addClass("alert-warning");
	} else {
		noteModifiedStatusNodeQuery.text(`There are no modified notes.`);
		noteModifiedStatusNodeQuery.removeClass("alert-warning");
		noteModifiedStatusNodeQuery.addClass("alert-secondary");
	}
};

const introductionNavAnchorId = "1606665479";
const personalNotesNavAnchorId = "1606703843";

/**
 * Utility method with logic to be executed when page is loaded
 */
export const onDocumentLoad = () => {
	attachNoteHandlers();
	//on clicking hash tag inside the <main> that instead wants to trigger a click on corresponding nav-item, do so
	bindMainHashLinkToNavClick();
	// adding post-load operation:
	// -- if custom-note link is clicked, then after the page load, also update upload status
	prepareNavAnchorToLoadInMain({
		[personalNotesNavAnchorId]: () => { updateNoteUploadStatus(); updateNoteModifiedStatus(); }
	});
	// load section, or introduction
	let {navElementId} = getNavAndMainElemIdFromLocationHash();
	$(`#${navElementId || introductionNavAnchorId}`).click(); 
};
