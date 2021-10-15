/**
 * Utility method to sanitize a text.
 * Following sanitization are done: Replace `<` with `&lt;`; Replace `>` with `&gt;`
 * @param {string} text
 * @return {string}
 */
export const sanitizeText = (text) => {
	if (!text) {
		return text;
	} else {
		return text.replace('<','&lt;').replace('>','&gt;');
	}
};