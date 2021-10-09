$(document ).ready(function() {
	// To all immediate-child anchor-links inside nav, add a handler that clicking on element loads the corresponding content inside <main>
	$("nav > a").each(function() {
		$(this).on("click", function(event) {
			event.preventDefault();
			$("main").load($(this).attr('href'));
		});
	});
	$("#").click(); // load introduction
});