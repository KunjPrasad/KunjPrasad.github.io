import { addPersonalNote, getAllNotesForContentId, removePersonalNote, updatePersonalNote } from './backend-notes.js';

/**
 * Utility method providing html text for the note.
 */
 const getNoteHtml = (contentId, noteText, noteCreatedText) => `<textarea class="note" rows="2" data-content-id="${contentId}" data-note-created-text="${noteCreatedText}">${noteText}</textarea>`
 
/**
 * Utility method to bridge add note functionality with implementation.
 */
 const onBlankNoteAdd = (event) => {
	const noteCreatedText = `${new Date().getTime()}`;
	const contentId = event.target.dataset.contentId;
	const emptyNoteText = '';
	addPersonalNote(contentId, emptyNoteText, noteCreatedText);
	$(event.target).before(getNoteHtml(contentId, emptyNoteText, noteCreatedText));
}

/**
 * Utility method to bridge update/remove note functionality with implementation.
 */
const onNoteTextBlur = (event) => {
	const newNoteTextValue = event.target.value;
	const contentId = $(event.target).attr('data-content-id');
	const noteCreatedText = $(event.target).attr('data-note-created-text');
	if (newNoteTextValue) {
		updatePersonalNote(contentId, newNoteTextValue, noteCreatedText);
	} else {
		removePersonalNote(contentId, noteCreatedText);
		$(event.target).remove();
	}
}

/**
 * Utility method to attach note handlers
 */
export const attachNoteHandlers = () => {
	$("main").on("blur", ".note", onNoteTextBlur);
	$("main").on("click", ".note-add", onBlankNoteAdd);
};

/**
 * Utility method to  add a handler for all immediate-child anchor-links inside nav, such that clicking on element loads the corresponding content inside <main>. It updates the hash in location. After the page loads, it is scroled to the top. All elements with "id" attribute are modified by adding any existing notes after it, followed by a button to add more note. Corresponding note related handlers are also wired. Finally, if the method is provided an argument identifying a function that must be run after the page is loaded, then that function is executed.
 * @param [Object] postLoadOperationMap - An object with key as id of anchor tag within nav, and value being a function that is executed after page is loaded
 */
export const prepareNavAnchorToLoadInMain = (postLoadOperationMap = {}) => {
	$("nav a").each(function() {
		$(this).on("click", function(event) {
			event.preventDefault();
			const anchorTagId = $(this).attr('id');
			location.hash = anchorTagId;
			const onLoadComplete = function(responseText, textStatus, jqXHR) {
				// not checking textStatus before proceeding, as shown in jquery docs, since failure case will not happen because no server call is involved
				$("main").scrollTop(0);
				$("main [id]").after(function() {
					const contentId = $(this).attr('id');
					if(isNaN(contentId)) {
						return; // See https://stackoverflow.com/questions/175739/built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number -- combined with fact that the entries after which the "Add note" button must appear have numeric ids - by design.
					}
					const noteAppends = getAllNotesForContentId(contentId).map((note) => getNoteHtml(contentId, note.text, note.createdText));
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
 * Utility method to bind handlers such that when links like `<a href='#{someNavItemId}' data-nav-click="true">...</a>` inside the <main> is clicked, then it simulates clicking of the corresponding nav item, rather than default behavior of simply focuing on that element.
 */
export const bindMainHashLinkToNavClick = () => {
	$("main").on("click", "a", (event) => {
		if(event.target.dataset.navClick === "true") {
			event.preventDefault();
			$(event.target.href.substring(event.target.href.indexOf("#"))).click();
		}
	});
};
