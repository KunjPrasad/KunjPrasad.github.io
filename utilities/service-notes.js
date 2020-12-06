import { getAllNotes, mergePersonalNotesToExisting } from './backend-notes.js';
import { downloadBlobAsFile, getFileText  } from './utils-file.js';

/* Utility method to handle an error. For now, it means console-logging it */
const handleError = console.log;

/**
 * Utility method to initialize the personalNotes by reading from an uploaded json file
 * @param [File] uploadFile - uploaded file with notes
 * @param [function] onLoad - function to be called on successful  upload
 * @param [function] onLoad - function to be called on failed  upload
 */
export const uploadPersonalNotes = (uploadFile, onLoad, onError) => {
	const decoratedOnLoad = (event) => {
		try {
			mergePersonalNotesToExisting(JSON.parse(event.target.result) || {});
			onLoad(uploadFile); // to trigger any other actions
		} catch(error) {
			handleError(error);
			onError(uploadFile);
		}
	};
	const decoratedOnError = onError;  // don't know when it happens and so, don't know how to get error object. Haven't wired `handleError` as done for `decoratedOnLoad`
	getFileText(uploadFile, decoratedOnLoad, decoratedOnError);
};

/**
 * Utility method to download the personalNotes as a json file
 * @param [string=] fileNamePrefix - prefix to use for downloaded file name with note data. Defaults to `noPrefix`
 */
export const downloadPersonalNotes = (fileNamePrefix = 'noPrefix') => {
	const personalNotesBlob = new Blob( [JSON.stringify(getAllNotes())], {type: 'application/json;charset=utf-8'});
	const fileName = `personalNotes-${fileNamePrefix}-${new Date().getTime()}.json`
	downloadBlobAsFile(personalNotesBlob, fileName);
};
