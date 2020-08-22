var		view_company_profile = view_company_profile || {};

view_company_profile = (function()
{
	'use strict';

	var		company_profile_global;
	var		company_id_global;

	var	Init = function()
	{
		company_id_global = new RegExp('profile\\/([0-9]+)').exec(window.location.href)[1];
		FillinCompanyProfile();
	};

	var FillinCompanyProfile = function()
	{
		$.getJSON('/cgi-bin/ajax_anyrole_1.cgi?action=AJAX_getCompanyInfo', {id: company_id_global})
			.done(function(data) {
				if(data.result === "success")
				{
					company_profile_global = data.companies || [];

					RenderCompanyInfo();

					if(system_calls.GetParamFromURL("scrollto").length) system_calls.ScrollWindowToElementID("#" + system_calls.GetParamFromURL("scrollto"));
				}
				else
				{
					console.debug("FillinCompanyProfile: ERROR: " + data.description);
				}
			})
			.fail(function() {
				system_calls.PopoverError("view_company_profile", "Ошибка ответа сервера (parsing JSON)");
			});

	};

	var RenderCompanyInfo = function()
	{
		$("#view_company_profile").append(system_calls.GetCompanyInfo_DOM(company_profile_global));
	};

	return {
			Init: Init
		};
})(); // --- view_company_profile object

