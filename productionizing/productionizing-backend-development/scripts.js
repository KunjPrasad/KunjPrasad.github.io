$(document ).ready(function() {
	attachNoteHandlers();
	// adding post-load operation:
	// -- if custom-note link is clicked, then after the page load, also update upload status
	prepareNavAnchorToLoadInMain({"1606703843": updateNoteUploadStatus});
	$(location.hash || "#1606665479").click(); // load section, or introduction
});

// constants used relating to upload of note file and upload status
const noteUploadStatusId = "prod-back-dev-note-upload-status";
let uploadedNoteFileData = {status: null, fileName: null, uploadDateTime: null};

/**
 * Utility method to update text in paragrah which shows the note-file upload status
 */
const updateNoteUploadStatus = () => {
	const noteUploadStatusNodeQuery = $(`#${noteUploadStatusId}`);
	if (!noteUploadStatusNodeQuery.length) {
		return; // fail-safe if there is no noteUploadStatus-id on page. Ideally, this will never be caled
	}
	if (!uploadedNoteFileData.status) {
		$(`#${noteUploadStatusId}`).text('No note file has been uploaded');
	} else {
		if (uploadedNoteFileData.status === 'SUCCESS') {
			$(`#${noteUploadStatusId}`).text(`Succussfully uploaded file ${uploadedNoteFileData.fileName} at ${uploadedNoteFileData.uploadDateTime}.`);
		} else {
			$(`#${noteUploadStatusId}`).text(`Failed an attempt to upload file ${uploadedNoteFileData.fileName} at ${uploadedNoteFileData.uploadDateTime}!`);
		}
	}
};

/**
 *  Utility method for use as callback after successful upload of note file
 * @param [string] uploadFile - uploaded file
 */
const onNoteUploadSuccess = (uploadFile) => {
	uploadedNoteFileData = {status: 'SUCCESS', fileName: uploadFile.name, uploadDateTime: new Date()};
	$(`#${noteUploadStatusId}`).text(`Succussfully uploaded file ${uploadedNoteFileData.fileName} at ${uploadedNoteFileData.uploadDateTime}.`);
};

/**
 *  Utility method for use as callback after failed upload of note file
 * @param [string] uploadFile - uploaded file
 */
const onNoteUploadError = (file) => {
	uploadedNoteFileData = {status: 'ERROR', fileName: uploadFile.name, uploadDateTime: new Date()};
	$(`#${noteUploadStatusId}`).text(`Failed an attempt to upload file ${uploadedNoteFileData.fileName} at ${uploadedNoteFileData.uploadDateTime}!! See console for error.`);
};
