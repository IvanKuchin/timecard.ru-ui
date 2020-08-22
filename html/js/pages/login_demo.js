login_demo_page = (function()
{
	var Init = function()
	{
		$("#user_role")
			.on("change", PrefillLoginFields_ClickHandler)
			.change();
	};

	var PrefillLoginFields_ClickHandler = function(e)
	{
		var	__login = {}, __pass = {};

		__login.agency		= "agency@timecard.ru";
		__login.subc		= "subc@timecard.ru";
		__login.approver	= "approver@timecard.ru";
		__pass.agency		= "123";
		__pass.subc			= "123";
		__pass.approver		= "123";

		$("#signinInputLogin")		.val(__login[$("#user_role").val()]);
		$("#signinInputPassword")	.val(__pass[$("#user_role").val()]);
	};

	return {
		Init: Init
	};
})();

