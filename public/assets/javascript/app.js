function showNote(event) {
	event.preventDefault();
	var id = $(this).attr("value");
	$("#addnote").fadeIn(300).css("display", "flex");
	$("#add-note").attr("value", id);
	$.get("/" + id, function(data) {
		$("#article-title").text(data.title);
		$.get("/note/" + id, function(data) {
			if (data) {
				$("#note-title").val(data.title);
				$("#note-body").val(data.body);
			}
		});
	});
}

function addNote(event) {
	event.preventDefault();
	var id = $(this).attr("value");
	var obj = {
		title: $("#note-title").val().trim(),
		body: $("#note-body").val().trim()
	};
	$.post("/note/" + id, obj, function(data) {
		window.location.href = "/saved";
	});
}

function changeStatus() {
	var status = $(this).attr("value");
	if (status === "Saved") {
		$(this).html("Unsave");
	}
};

function changeBack() {
	$(this).html($(this).attr("value"));
}

$(document).on("click", ".addnote-button", showNote);
$(document).on("click", "#add-note", addNote);
$(".status").hover(changeStatus, changeBack);
$("#close-note").on("click", function() {
	$("#addnote").fadeOut(300);
});