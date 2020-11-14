var		view_profile = view_profile || {};

view_profile = (function()
{
	"use strict";

	var		userProfile;
	var		addRecommendation = {};

	var		myUserID;
	var		myUserLogin;
	var		friendUserID;

	var	Init = function()
	{
		myUserID = $("#myUserID").data("myuserid");
		myUserLogin = $("#myUserID").data("mylogin");
		friendUserID = $("#friendLastName").data("friendid");

		DrawFriendAvatar($("#friendLastName").data("friendavatar"), $("#friendName").text(), $("#friendLastName").text());
		FillinUserProfile();
	};

	var FillinUserProfile = function()
	{
		$.getJSON("/cgi-bin/index.cgi?action=JSON_getUserProfile", {id: $("#friendLastName").data("friendid")})
			.done(function(data) {
				if(data.result === "success")
				{
					userProfile = data.users[0];

					if(system_calls.GetParamFromURL("scrollto").length) system_calls.ScrollWindowToElementID("#" + system_calls.GetParamFromURL("scrollto"));
				}
				else
				{
					console.debug("FillinUserProfile: ERROR: " + data.description);
				}
			})
			.fail(function() {
				system_calls.PopoverError("friendName", "ошибка ответа сервера");
				console.error("ERROR parsing JSON response");
			});

	};

	var	DrawFriendAvatar = function (friendImage, friendName, friendLastName)
	{
		var		canvasCtx; 

		$("#canvasForAvatar").attr("width", "160")
							.attr("height", "160")
							.addClass("canvas-big-avatar");
		canvasCtx = $("#canvasForAvatar")[0].getContext("2d");

		DrawUserAvatar(canvasCtx, friendImage, friendName, friendLastName);
	};

	return {
			Init: Init,
		};
})(); // --- view_profile object

