/**
 * Utility method to read text from an uploaded file.
 * @param {File} uploadFile - upload file that must be read for text content.
 * @param {function} onLoad - callback to execute on successful upload of a file
 * @param {function} onError - callback to execute on errored upload of a file
 */
export const getFileText = (uploadFile, onLoad, onError) => {
	const reader = new FileReader();
	reader.addEventListener('load', onLoad);
	reader.addEventListener('error', onError); 
	return reader.readAsText(uploadFile);
};

/**
 * Utility method to download a blob as a file.
 * @param {Blob} blob - blob data to download
 * @param {string} fileName - name of file getting downloaded
 */
export const downloadBlobAsFile = (blob, fileName = `download-${new Date().getTime()}`) => {
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

