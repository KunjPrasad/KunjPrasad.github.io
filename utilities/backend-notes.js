let personalNotes = {}; // variable to collect personal notes. It is an object-type data, with key = string type contentId, and value = object type {text: [string], createdText: [string, with long valued datetime when note was created, ins tring format]}
let notesModifiedIndicator = false; // boolean flag to identify if notes have been modified by adding or removing a personal note. Changes by uploading file does not count.

/**
 * Utility method to identify if the notes have been modified.
 */
export const isNotesModified = () => notesModifiedIndicator;

/**
 * Utility method to get all notes for a content-id. If there are no notes, then an empty array is returned
 * @param [string] contentId - id of the content for which the note is being retrieved
 */
export const getAllNotesForContentId = (contentId)  => (personalNotes[contentId] || []);

/**
 * Utility method to get all notes.
 */
export const getAllNotes = ()  => personalNotes;

/**
 * Utility method to add a note for a content-id. It is added at end of existing notes array to maintain time-ordering.
 * @param [string] contentId - id of the content for which the note is being added
 * @param [string] noteText - new note text to add
 * @param [string=] noteCreatedText - the time of note creation, as long. Default is now
 */
export const addPersonalNote = (contentId, noteText, noteCreatedText=`${new Date().getTime()}`)  => {
	if (!personalNotes[contentId]) {
		personalNotes[contentId] = [];
	}
	personalNotes[contentId].push({text: noteText, createdText: noteCreatedText});
	notesModifiedIndicator = true;
};

/**
 * Utility method to update a note for a content-id.
 * @param [string] contentId - id of the content for which the note is being update
 * @param [string] noteText - updated note text
 * @param [string] noteCreatedText - in text form, the time when note is initially created. This is used to identify the note that needs to be updated
 */
export const updatePersonalNote = (contentId, noteText, noteCreatedText)  => {
	if (!personalNotes[contentId]) {
		return; // adding as a fail-safe. Ideally, this branch will never get called.
	}
	personalNotes[contentId].filter((note) => note.createdText === noteCreatedText).forEach((note) => {note.text = noteText});
	notesModifiedIndicator = true;
};

/**
 * Utility method to merge a notes object into the one existing.
 @param [Object] newNotes - An object of same type as `personalNotes`
 */
export const mergePersonalNotesToExisting = (newNotes) => {
	for (const contentId in newNotes) {
		if (!personalNotes[contentId]) {
			personalNotes[contentId] = [...newNotes[contentId]];
		} else {
			personalNotes[contentId] = [...personalNotes[contentId], ...newNotes[contentId]];
			personalNotes[contentId].sort((note1, note2) => note1.createdText < note2.createdText);
		}
	}
};

/**
 * Utility method to remove a note for a content-id.
 * @param [string] contentId - id of the content for which the note is being removed
 * @param [string] noteCreatedText - in text form, the time when note is created. This is used to identify the note that needs to be deleted
 */
export const removePersonalNote = (contentId, noteCreatedText)  => {
	if (!personalNotes[contentId]) {
		return; // adding as a fail-safe. Ideally, this branch will never get called.
	}
	personalNotes[contentId] = personalNotes[contentId].filter((note) => note.createdText !== noteCreatedText);
	notesModifiedIndicator = true;
};
