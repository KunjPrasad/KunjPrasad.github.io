$(document ).ready(function() {
	prepareNavAnchorToLoadInMain();
	$(location.hash || "#1606665479").click(); // load section, or introduction
});