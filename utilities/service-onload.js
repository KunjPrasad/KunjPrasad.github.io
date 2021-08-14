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
 * The location hash can be one of 2 forms: "#1234", or "#1234/5678". Former occurs when a <nav> element is clicked whose id is "1234" and the intention is to scroll to top of <main> after rendering the content. Latter occurs when a <nav> element is clicked whose id is "1234" and the intention is to scroll to an element rendered inside <main> whose id is "5678". This method takes the location hash and returns the nav element-id (i.e., "1234" in both cases), and main element-id if it exists (i.e., undefined in first case, and "5678" in second case). If the location.hash does not exist or is falsy, then `undefined` is returned for both.
 * @returns [{navElementId: string|undefined, mainElementId: string|undefined}]
 */
export const getNavAndMainElemIdFromLocationHash = () => {
	if (!location.hash || !location.hash.trim()) {
		return {navElementId: undefined, mainElementId: undefined};
	}
	const locationHashSplitArr = location.hash.substring(1).split("/");
	if (locationHashSplitArr.length === 1) {
		return {navElementId: locationHashSplitArr[0], mainElementId: undefined};
	} else {
		return {navElementId: locationHashSplitArr[0], mainElementId: locationHashSplitArr[1]};
	}
};

/**
 * Utility method to  add a handler for all immediate-child anchor-links inside <nav>, such that clicking on element loads the corresponding content inside <main>. It updates the location-hash if the existing one corresponds to a different nav anchor element. After the page loads, it is scrolled to the top or to a particular id. All elements in <main> with "id" attribute are modified by adding any existing notes after it, followed by a button to add more note. Corresponding note related handlers are also wired. Finally, if the method is provided an argument identifying a function that must be run after the page is loaded, then that function is executed.
 * @param [Object] postLoadOperationMap - An object with key as id of anchor tag within nav, and value being a function that is executed after page is loaded
 */
export const prepareNavAnchorToLoadInMain = (postLoadOperationMap = {}) => {
	$("nav a").each(function() {
		$(this).on("click", function(event) { // `this` refers to each "nav a" element, so don't use a fat arrow notation, else that'll "early bind" this to something unexpected
			event.preventDefault();
			const anchorTagId = $(this).attr('id');
			let {navElementId, mainElementId} = getNavAndMainElemIdFromLocationHash();
			if (anchorTagId !== navElementId) {
				navElementId = anchorTagId;
				mainElementId = undefined;
				location.hash = navElementId;
			}
			
			const onLoadComplete = function(responseText, textStatus, jqXHR) {
				// not checking textStatus before proceeding, as shown in jquery docs, since failure case will not happen because no server call is involved
				if (mainElementId) {
					$("main").scrollTop(Math.floor($(`#${mainElementId}`).offset().top - $("main").offset().top + $("main").scrollTop()));
				} else {
					$("main").scrollTop(0);
				}
				$("main [id]").after(function() {
					const contentId = $(this).attr('id'); // `this` refers to each "main [id]" element, so don't early bind when defining the function
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
 * Utility method to bind handlers such that when links like `<a href='#{someItemId}' data-nav-id="navId">...</a>` inside the <main> is clicked, then it simulates clicking of the corresponding nav item, rather than default behavior of simply focusing on that element. If `someItemId` and `navId` are same, then it implies that the `navId` is clicked and corresponding page is loaded in <main> and scrolled to top. When they are different, it means that `navId` is clicked and corresponding page is loaded in <main> but it is scrolled to `someItemId`. The `location.hash` is changed accordingly to achieve this behavior.
 */
export const bindMainHashLinkToNavClick = () => {
	$("main").on("click", "a", (event) => {
		if (event.target.dataset.navId) {
			event.preventDefault();
			const newNavElementId = event.target.dataset.navId;
			const newMainElementId = event.target.href.substring(event.target.href.indexOf("#")+1);
			if (newNavElementId === newMainElementId) {
				location.hash = newNavElementId;
			} else {
				location.hash = `${newNavElementId}/${newMainElementId}`;
			}
			$(`#${newNavElementId}`).click(); // trigger `click` on <nav> element so it does the page load and scroll based on location hash
		}
	});
};
