var	approval_notifications = approval_notifications || {};

approval_notifications = (function()
{
	'use strict';

	var Init = function()
	{
		UpdateAccountInfo();

		$("label[for=\"approval_timecard\"]")	.on("click", Switcher_ClickHandler);
		$("label[for=\"approval_bt\"]")			.on("click", Switcher_ClickHandler);
	};

	var UpdateAccountInfo = function()
	{
		$.getJSON('/cgi-bin/index.cgi?action=JSON_getUserProfile')
			.done(
				function(data) 
				{
					var		user_profile;

					if(data.result == "success")
					{
						user_profile = data.users[0];

						RenderApprovalNotifications(user_profile.pending_approval_notification_timecard, user_profile.pending_approval_notification_bt);
					}
					else
					{
						system_calls.PopoverError($("#firstName"), data.description);
					} // --- if(data.status == "success")
				})
			.fail(
				function(data) 
				{
					// --- Fail to block the account
					system_calls.PopoverError($("#firstName"), "Ошибка получаения данных");
				});
	};

	var	RenderApprovalNotifications = function(pending_approval_notification_timecard, pending_approval_notification_bt)
	{
		$("#approval_timecard")		.prop("checked", pending_approval_notification_timecard[0] == "Y" ? "checked" : "");
		$("#approval_bt")			.prop("checked", pending_approval_notification_bt[0] == "Y" ? "checked" : "");
	};

	var	Switcher_ClickHandler = function(e)
	{
		var		curr_tag = $(this);
		var		input_tag = $("#" + $(this).attr("for"));
		var		curr_value = !input_tag.prop("checked");

		$.getJSON(
			'/cgi-bin/' + input_tag.attr("data-script"),
			{
				action: input_tag.attr("data-action"),
				value: (curr_value ? "Y" : "N"),
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
				}
				else
				{
					// --- install previous value, due to error
					input_tag.prop("checked", !curr_value);

					system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
				}
			})
			.fail(function(e)
			{
				input_tag.prop("checked", !curr_value);
				system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
			})
			.always(function(e)
			{
			});

		return true;
	};

return {
	Init:Init
		};

})();

