
var	edit_profile = edit_profile || {};

edit_profile = (function()
{
'use strict';

var		MAX_NUMBER_PREVIEW = 3;
var		DATE_FORMAT_GLOBAL = "dd/mm/yy";

var 	JSON_jobTitleID = [];
var 	JSON_certificationVendors = [];
var 	JSON_certificationTracks = [];
var 	JSON_CompanyNameID = [];
var		JSON_AvatarList;  // --- must be global to get access from ShowActiveAvatar
var		JSON_geoCountry = [];
var		JSON_geoRegion = [];
var		JSON_geoLocality = [];
var		JSON_university = [];
var		JSON_school = [];
var		JSON_language = [];
var		JSON_skill = [];
var		JSON_book = [];
var		JSON_dataForProfile = {};
var		userProfile;
var		addCarrierCompany = {};
var		addCertification = {};
var		addCourse = {};
var		addSchool = {};
var		addUniversity = {};
var		addLanguage = {};
var		addSkill = {};
var		addBook = {};
var		addRecommendation = {};
var		AutocompleteList = [];

var		bonus_update_action = {
			airline:	"AJAX_updateAirlineBonusNumber",
			hotelchain: "AJAX_updateHotelchainBonusNumber",
			railroad:	"AJAX_updateRailroadBonusNumber"
		};

var		bonus_delete_action = {
			airline:	"AJAX_deleteAirlineBonusNumber",
			hotelchain:	"AJAX_deleteHotelchainBonusNumber",
			railroad:	"AJAX_deleteRailroadBonusNumber"
		};

var	Init = function()
{
	var		user_tag = $("#myUserID");

	GetUserProfileFromServer();

	$("#AreYouSure #Remove").on("click", AreYouSureRemoveHandler);

/*
	if(window.Worker)
	{
		var		helperWorker = new Worker("/js/pages/edit_profile_worker.js");

		helperWorker.onmessage = function(e)
		{
			JSON_dataForProfile = e.data.JSON_dataForProfile;
			JSON_geoCountry = e.data.JSON_geoCountry;
			JSON_geoRegion = e.data.JSON_geoRegion;
			JSON_geoLocality = e.data.JSON_geoLocality;

			AddDataForProfileCollapsibleInit();
		};

		setTimeout(function ()
			{
				helperWorker.postMessage("start");
			}, 3000);
	}
	else
	{
		setTimeout(function ()
			{
				// --- AJAX jobTitle download
				$.getJSON('/cgi-bin/index.cgi?action=AJAX_getDataForProfile', {param1: ''})
						.done(function(data) {
							JSON_dataForProfile = data;

							data.geo_country.forEach(function(item, i, arr)
							{
								JSON_geoCountry.push(system_calls.ConvertHTMLToText(item.title));
							});

							data.geo_region.forEach(function(item, i, arr)
							{
								JSON_geoRegion.push(system_calls.ConvertHTMLToText(item.title));
							});

							data.geo_locality.forEach(function(item, i, arr)
							{
								JSON_geoLocality.push(system_calls.ConvertHTMLToText(item.title));
							});

							AddDataForProfileCollapsibleInit();
						});
			}, 3000);
	} // --- End Worker
*/
	$("#DeleteAvatarDialogBox").dialog({
		autoOpen: false,
		modal: true,
		show: {effect: "drop", duration: 300, direction: "up"},
		hide: {effect: "drop", duration: 200, direction: "down"},
		buttons : {
			"Удалить" : function() {
				console.debug("ShowPreviewAvatar: deletion dialog: delete preview AJAX_deleteAvatar?id="+$(this).dialog("option", "id"));

				$(this).dialog("close");

				DeletePreviewAvatar($(this).dialog("option", "id"));

			},
			"Отмена" : function() {
				$(this).dialog("close");
			}
		}
	});

	$("#DeleteAvatarDialogBoxBS_Submit").on("click", function() {
		console.debug("removed avatar id " + $("#DeteledAvatarID_InBSForm").val());

		$("#DeleteAvatarDialogBoxBS").modal("hide");

		// --- Real avatar deletion after closing dialog to improve User Expirience
		DeletePreviewAvatar($("#DeteledAvatarID_InBSForm").val());
	});

	// --- Image uploader
	$(function () {
		// Change this to the location of your server-side upload handler:
		$('#fileupload').fileupload({
			url: '/cgi-bin/avataruploader.cgi',
			dataType: 'json',
			maxFileSize: 30 * 1024 * 1024,
			acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,


			done: function (e, data) {

				$.each(data.result, function(index, value)
					{
						if(value.result == "error")
						{
							console.debug("fileupload: done handler: ERROR uploading file [" + value.fileName + "] error code [" + value.textStatus + "]");
							if(value.textStatus == "wrong format")
							{
								$("#UploadAvatarErrorBS_ImageName").text(value.fileName);
								$("#UploadAvatarErrorBS").modal("show");
							}
						}

						if(value.result == "success")
						{
							console.debug("fileupload: done handler: uploading success [" + value.fileName + "]");
							edit_profile.DrawAllAvatars();
						}
					});

			},
			progressall: function (e, data) {
				var progress = parseInt(data.loaded / data.total * 100, 10);
				$('#progress .progress-bar').css(
					'width',
					progress + '%'
				);
			},
			fail: function (e, data) {
				alert("ошибка загрузки фаила: " + data.textStatus);
			}

		}).prop('disabled', !$.support.fileInput)
			.parent().addClass($.support.fileInput ? undefined : 'disabled');
	});

	$("#canvasForAvatar").on("click", function(e) 
										{ 
											if(JSON_AvatarList.length < 3)
											{
												$("#fileupload").click(); 
											}
											else
											{
												system_calls.PopoverError($(this), "Уже загружено 3-и аватарки.");
											}
										});

	// --- Smartway enrollment
	if(user_tag && user_tag.attr("data-smartway_enrolled") && (user_tag.attr("data-smartway_enrolled") == "false"))
	{
		$("#SmartwayEnrollModal_Button").show(200);
		$("#SmartwayEnrollModal_Button").on("click", SmartwayEnrollModal_ClickHandler);
		$("#SmartwayEnrollModal .submit").on("click", SmartwayEnrollSubmit_ClickHandler);
	}

	// --- sms login block
	sms_confirmation.SetCountryCodeSelector	("#country_code");
	sms_confirmation.SetPhoneNumberSelector	("#phone_number");
	sms_confirmation.SetTriggerSelector		("#submitConfirmPhoneNumber");
	sms_confirmation.SetSuccessCallback		(function(param) { system_calls.PopoverInfo($("#submitConfirmPhoneNumber"), "Телефон подтвержден"); });
	sms_confirmation.SetFailCallback		(function(param) { system_calls.PopoverInfo($("#submitConfirmPhoneNumber"), "Телефон НЕ подтвержден"); });
	sms_confirmation.SetScript1				("account.cgi");
	sms_confirmation.SetAction1				("AJAX_sendPhoneConfirmationSMS");
	sms_confirmation.SetScript2				("account.cgi");
	sms_confirmation.SetAction2				("AJAX_confirmPhoneNumber");

	$("#collapsible_new_avia_bonus_program .new_program")
														.autocomplete({
															source: "/cgi-bin/ajax_anyrole_1.cgi?action=AJAX_getAviaBonusAutocompleteList",
															select: AviaBonus_Autocomplete_SelectHandler,
														});

	$("#collapsible_new_railroad_bonus_program .new_program")
														.autocomplete({
															source: "/cgi-bin/ajax_anyrole_1.cgi?action=AJAX_getAviaBonusAutocompleteList",
															select: RailroadBonus_Autocomplete_SelectHandler,
														});

	$("#collapsible_new_hotelchain_bonus_program .new_program")
														.autocomplete({
															source: "/cgi-bin/ajax_anyrole_1.cgi?action=AJAX_getAviaBonusAutocompleteList",
															select: HotelchainBonus_Autocomplete_SelectHandler,
														});

	$("#collapsible_new_avia_bonus_program button").on("click", SubmitBonusProgram_ClickHandler);
	$("#collapsible_new_railroad_bonus_program button").on("click", SubmitBonusProgram_ClickHandler);
	$("#collapsible_new_hotelchain_bonus_program button").on("click", SubmitBonusProgram_ClickHandler);


	ScrollToElementID("#" + system_calls.GetParamFromURL("scrollto"));
};

var	GetUserProfileFromServer = function()
{
	$.getJSON('/cgi-bin/index.cgi?action=JSON_getUserProfile', {param1: "_"})
		.done(function(data) {
			if(data.result === "success")
			{
				userProfile = data.users[0];
				DrawAllAvatars();
				RenderUserName();
				RenderPhone();
				RenderUserSex();
				RenderUserBirthday();
				RenderUserPassport();
				RenderUserForeignPassport();
				RenderAirlineBonuses(userProfile.bonuses_airlines);
				RenderHotelchainBonuses(userProfile.bonuses_hotel_chains);
				RenderRailroadsBonuses(userProfile.bonuses_railroads);
				
				// InitBirthdayAccessLabel();
				// RenderCity();
			}
			else
			{
				console.debug("Init: ERROR: " + data.description);
			}
		})
		.fail(function() {
			console.error("Init:JSON_getUserProfile: error parse JSON response");
		});
};

var	ScrollToElementID = function(elementID)
{
	if((elementID.length > 1) && $(elementID).length) // --- elementID is "#XXXX"
		system_calls.ScrollWindowToElementID(elementID);
};

var	UpdateUserSex = function(userSex)
{
	$.getJSON('/cgi-bin/account.cgi?action=AJAX_changeUserSex', {userSex: userSex})
		.done(function(data) {
			if(data.result === "success")
			{
			}
			else
			{
				console.debug("UpdateUserSex: ERROR: " + data.description);
			}
		});
};

var	RenderUserSex = function()
{
	var		result = $();
	var		currentEmploymentText = "";
	var		elementID;

	if(typeof(userProfile) == "undefined")
	{
		return;
	}

	if(userProfile.userSex == "male") elementID = "#sexMale";
	if(userProfile.userSex == "female") elementID = "#sexFemale";

	$(elementID).prop("checked", true);

	$("input#sexMale").on("click", function() { UpdateUserSex("male"); });
	$("input#sexFemale").on("click", function () { UpdateUserSex("female"); });

};

var	RenderUserBirthday = function()
{
	var	temp_date;
	var	birthday_input_value = "";
	var	birthday = new Date();

	if(userProfile.birthday.length)
	{
		temp_date = userProfile.birthday.split('-');
		if(temp_date.length == 3)
		{
			birthday = new Date(parseInt(temp_date[0]), parseInt(temp_date[1]) - 1, parseInt(temp_date[2]));
			birthday_input_value = system_calls.GetFormattedDateFromSeconds(birthday.getTime()/1000, "DD/MM/YYYY");
		}
		else
		{
			console.error("fail with date format(" + userProfile.birthday + ") must be YYYY-MM-DD");
		}
	}

	$(".birthday")
		.on("change", system_calls.UpdateInputFieldOnServer)
		.attr("data-db_value", birthday_input_value)
		.val(birthday_input_value)
		.datepicker({
			dateFormat: DATE_FORMAT_GLOBAL,

			firstDay: 1,
			dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
			dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
			monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
			monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
			changeMonth: true,
			changeYear: true,
			defaultDate: "+0d",
			numberOfMonths: 1,
			yearRange: "1940:2030",
			showOtherMonths: true,
			selectOtherMonths: true
		});
};

var	RenderPhone = function()
{
	$("#country_code").val(userProfile.country_code);
	$("#phone_number").val(userProfile.phone);
};

var	RenderUserName = function()
{
	$("#first_name_ru")
		.on("change", system_calls.UpdateInputFieldOnServer)
		.attr("data-db_value", userProfile.name)
		.val(userProfile.name);

	$("#last_name_ru")
		.on("change", system_calls.UpdateInputFieldOnServer)
		.attr("data-db_value", userProfile.nameLast)
		.val(userProfile.nameLast);

	$("#middle_name_ru")
		.on("change", system_calls.UpdateInputFieldOnServer)
		.attr("data-db_value", userProfile.nameMiddle)
		.val(userProfile.nameMiddle);
};

var	RenderUserPassport = function()
{
	var	temp_date = userProfile.passport_issue_date.split('-');
	var	passport_issue_date = new Date();
	var	date_input_value = "";


	if(temp_date.length == 3)
	{
		if(temp_date[0] == "1900")
		{
			// --- date is not set
		}
		else
		{
			passport_issue_date = new Date(parseInt(temp_date[0]), parseInt(temp_date[1]) - 1, parseInt(temp_date[2]));
			date_input_value = system_calls.GetFormattedDateFromSeconds(passport_issue_date.getTime()/1000, "DD/MM/YYYY");
		}
	}
	else
	{
		console.error("fail with date format(" + userProfile.passport_issue_date + ") must be YYYY-MM-DD");
	}

	$("#passport_series")
		.on("change", system_calls.UpdateInputFieldOnServer)
		.attr("data-db_value", userProfile.passport_series)
		.val(userProfile.passport_series);

	$("#passport_number")
		.on("change", system_calls.UpdateInputFieldOnServer)
		.attr("data-db_value", userProfile.passport_number)
		.val(userProfile.passport_number);

	$(".passport_issue_date")
		.on("change", system_calls.UpdateInputFieldOnServer)
		.attr("data-db_value", date_input_value)
		.val(date_input_value)
		.datepicker({
		    dateFormat: DATE_FORMAT_GLOBAL,

			firstDay: 1,
			dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
			dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
			monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
			monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
			changeMonth: true,
			changeYear: true,
			defaultDate: "+0d",
			numberOfMonths: 1,
			yearRange: "1960:2030",
			showOtherMonths: true,
			selectOtherMonths: true
		});

	$("#passport_issue_authority")
		.on("change", system_calls.UpdateInputFieldOnServer)
		.attr("data-db_value", userProfile.passport_issue_authority)
		.val(userProfile.passport_issue_authority);

};

var	RenderUserForeignPassport = function()
{
	var	temp_date = userProfile.foreign_passport_expiration_date.split('-');
	var	foreign_passport_expiration_date = new Date();
	var	date_input_value = "";

	if(temp_date.length == 3)
	{
		if(temp_date[0] == "1900")
		{
			// --- date is not set
		}
		else
		{
			foreign_passport_expiration_date = new Date(parseInt(temp_date[0]), parseInt(temp_date[1]) - 1, parseInt(temp_date[2]));
			date_input_value =system_calls.GetFormattedDateFromSeconds(foreign_passport_expiration_date.getTime()/1000, "DD/MM/YYYY");
		}
	}
	else
	{
		console.error("fail with date format(" + userProfile.foreign_passport_expiration_date + ") must be YYYY-MM-DD");
	}

	$("#first_name_en")
		.on("change", system_calls.UpdateInputFieldOnServer)
		.attr("data-db_value", userProfile.first_name_en)
		.val(userProfile.first_name_en);

	$("#last_name_en")
		.on("change", system_calls.UpdateInputFieldOnServer)
		.attr("data-db_value", userProfile.last_name_en)
		.val(userProfile.last_name_en);

	$("#middle_name_en")
		.on("change", system_calls.UpdateInputFieldOnServer)
		.attr("data-db_value", userProfile.middle_name_en)
		.val(userProfile.middle_name_en);

	$("#foreign_passport_number")
		.on("change", system_calls.UpdateInputFieldOnServer)
		.attr("data-db_value", userProfile.foreign_passport_number)
		.val(userProfile.foreign_passport_number);

	$(".foreign_passport_expiration_date")
		.on("change", system_calls.UpdateInputFieldOnServer)
		.attr("data-db_value", date_input_value)
		.val(date_input_value)
		.datepicker({
		    dateFormat: DATE_FORMAT_GLOBAL,

			firstDay: 1,
			dayNames: [ "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота" ],
			dayNamesMin: [ "Вc", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" ],
			monthNames: [ "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь" ],
			monthNamesShort: [ "Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек" ],
			changeMonth: true,
			changeYear: true,
			defaultDate: "+0d",
			numberOfMonths: 1,
			yearRange: "1960:2030",
			showOtherMonths: true,
			selectOtherMonths: true
		});
};

var DrawTextAvatar = function(context, size)
{
	var	ctx = document.getElementById(context).getContext("2d");

	ctx.clearRect(0,0,size,size);

	ctx.beginPath();
	ctx.arc(size/2,size/2, size/2, 0,2*Math.PI);
	ctx.closePath();
	ctx.fillStyle = "grey";
	ctx.fill();

	ctx.font = "normal "+size*3/8+"pt Calibri";
	ctx.textAlign = "center";
	ctx.fillStyle = "white";
	ctx.fillText(system_calls.GetUserInitials(userProfile.name, userProfile.nameLast), size/2,size*21/32);
};

var	DeletePreviewAvatar = function (id)
{
	$.ajax({
		url:"/cgi-bin/index.cgi",
		data: {action:"AJAX_deleteAvatar", id:id, value:""}
	}).done(DrawAllAvatars);
};

	var ShowPreviewAvatar = function (context, image, isActive, id)
	{

		var DrawBigAvatar = function()
		{
			var		ctxMain = document.getElementById("canvasForAvatar").getContext("2d");
			var 	x1 = 0, x2 = 150, y1 = 0, y2 = 150, radius = 10;
			var		sMinEdge = Math.min(pic.width, pic.height);

			// console.debug("DrawBigAvatar: click handler event [entryID="+id+"]");

			ctxMain.clearRect(0,0,150,150);
			ctxMain.save();
			ctxMain.beginPath();
			ctxMain.moveTo(radius, 0);
			ctxMain.lineTo(x2 - radius, 0);
			ctxMain.quadraticCurveTo(x2,0, x2,radius);
			ctxMain.lineTo(x2, y2 - radius);
			ctxMain.quadraticCurveTo(x2,y2, x2-radius,y2);
			ctxMain.lineTo(radius, y2);
			ctxMain.quadraticCurveTo(0,y2, 0,y2-radius);
			ctxMain.lineTo(0, radius);
			ctxMain.quadraticCurveTo(0,0, radius,0);
			ctxMain.clip();

			ctxMain.drawImage(pic, (pic.width - sMinEdge) / 2, (pic.height - sMinEdge) / 2, sMinEdge, sMinEdge, 0,0,150,150);
			ctxMain.restore();
		};

		var	ctx = document.getElementById(context).getContext("2d");
		var pic = new Image();

		if(context == "canvasForAvatarPreview0")
		{
			// --- Generation avatar text preview
			DrawTextAvatar(context, 20);

			// --- Hide "delete" cross due to delete text avatar impossible
			$("#canvasForAvatarPreview0_del").hide();

			document.getElementById(context+"_overlay").addEventListener('click', function()
				{
					// --- mark all preview inactive
					JSON_AvatarList.forEach(function(item)
											{
												item.isActive = "0";
											});

					DrawTextAvatar("canvasForAvatar", 150);

					$.ajax({
						url:"/cgi-bin/index.cgi",
						data: {action:"AJAX_updateActiveAvatar", id:"-1", value:""}
					}).done();

				}
			);
			if(isActive == 1) { DrawTextAvatar("canvasForAvatar", 150); }
		}
		else
		{

			pic.src = image;
			pic.onload = function ()
			{
				var		sMinEdge = Math.min(pic.width, pic.height);


				// console.debug("ShowPreviewAvatar("+context+","+image+"): onLoad handler event [entryID="+id+"]");
				ctx.drawImage(this, (pic.width - sMinEdge) / 2, (pic.height - sMinEdge) / 2, sMinEdge, sMinEdge,0,0,20,20);
				if(id > 0)
				{

					document.getElementById(context+"_overlay").addEventListener('click', function()
					{
						// --- mark clicked preview active
						JSON_AvatarList.forEach(function(item)
												{
													item.isActive = "0";
													if(item.avatarID == id)
													{
														item.isActive = "1";
													}
												});
						DrawBigAvatar();

						$.ajax({
							url:"/cgi-bin/index.cgi",
							data: {action:"AJAX_updateActiveAvatar", id:id, value:""}
						}).done(function() {});
					});

					document.getElementById(context+"_del").addEventListener('click', function()
					{
						// $("#DeleteAvatarDialogBox").dialog("option", "id", id);
						// $("#DeleteAvatarDialogBox").dialog("open");

						$("#DeteledAvatarID_InBSForm").val(id);
						$("#DeleteAvatarDialogBoxBS").modal("show");


					});

					if(isActive == 1) { DrawBigAvatar(); }
				}

			};
		}
	};

	var filterInactiveAvatars = function(item)
	{
		if (item.isActive == "1")
		{
			return true;
		}
		return false;
	};

	var ShowActiveAvatar = function()
	{
		if(JSON_AvatarList.filter(filterInactiveAvatars).length === 0)
		{
			DrawTextAvatar("canvasForAvatar", 150);
		}
		DrawTextAvatar("canvasForAvatarPreview0", 20);
	};

	var DrawAllAvatars = function()
	{
	// --- AJAX avatar list download
	$.getJSON('/cgi-bin/index.cgi?action=JSON_getAvatarList', {param1: ''})
		.done(function(data) {
			var		i;

			JSON_AvatarList = data;

			ShowActiveAvatar();

			i = 0;
			ShowPreviewAvatar("canvasForAvatarPreview" + i++, "");
			JSON_AvatarList.forEach
				(function (entry)
					{
						if(i <= MAX_NUMBER_PREVIEW)
						{
							ShowPreviewAvatar("canvasForAvatarPreview" + i++, "/images/avatars/avatars" + entry.folder + "/" + entry.filename, entry.isActive, entry.avatarID);
						}
					}
				);
			if(i < 4)
			{
				for(;i < 4; i++)
				{
					ShowPreviewAvatar("canvasForAvatarPreview" + i, "/images/pages/edit_profile/cloud_arrow.jpg", 0 /*entry.isActive*/, -2/*entry.avatarID*/);
				}
				$("#fileupload").attr("disabled", false);
				$("#spanForFileUploadButton").addClass("btn-success");
				$("#spanForFileUploadButton").removeClass("btn-default");
			}
			else
			{
				$("#fileupload").attr("disabled", true);
				$("#spanForFileUploadButton").addClass("btn-default");
				$("#spanForFileUploadButton").removeClass("btn-success");

			}
		});
	};

	var	AreYouSureRemoveHandler = function() {
		var		affectedID = $("#AreYouSure #Remove").data("id");
		var		affectedAction = $("#AreYouSure #Remove").data("action");
		var		affectedScript = $("#AreYouSure #Remove").data("script");

		if(typeof(affectedScript) == "undefined") affectedScript = "";
		if(!affectedScript.length) affectedScript = "index.cgi";
		$("#AreYouSure").modal('hide');

		$.getJSON('/cgi-bin/' + affectedScript + '?action=' + affectedAction, {id: affectedID})
			.done(function(data) {
				if(data.result === "success")
				{
				}
				else
				{
					console.debug("AreYouSureRemoveHandler: ERROR: " + data.description);
				}
			});

		// --- update GUI has to be inside getJSON->done->if(success).
		// --- To improve User Expirience (react on user actions immediately)
		// ---	 I'm updating GUI immediately after click, not waiting server response
		if((affectedAction == "AJAX_deleteAirlineBonusNumber") && affectedID)		$("#avia_bonus_list .__program_id_" + affectedID).hide(250);
		if((affectedAction == "AJAX_deleteHotelchainBonusNumber") && affectedID)	$("#hotelchain_bonus_list .__program_id_" + affectedID).hide(250);
		if((affectedAction == "AJAX_deleteRailroadBonusNumber") && affectedID)		$("#railroad_bonus_list .__program_id_" + affectedID).hide(250);

	};

	var	ErrorModal = function(errorMessage)
	{
		$("#ErrorModal_ResultText").empty().append(errorMessage);
		$("#ErrorModal").modal("show");
	};

	var	AviaBonus_Autocomplete_SelectHandler = function(event, ui)
	{
		var		id = ui.item.id;
		var 	label = ui.item.label;
		var		curr_tag = $(this);

		curr_tag.attr("data-id", id);
	};

	var	RailroadBonus_Autocomplete_SelectHandler = function(event, ui)
	{
		var		id = ui.item.id;
		var 	label = ui.item.label;
		var		curr_tag = $(this);

		curr_tag.attr("data-id", id);
	};

	var	HotelchainBonus_Autocomplete_SelectHandler = function(event, ui)
	{
		var		id = ui.item.id;
		var 	label = ui.item.label;
		var		curr_tag = $(this);

		curr_tag.attr("data-id", id);
	};

	var	SubmitBonusProgram_ClickHandler = function(e)
	{
		var	curr_tag		= $(this);
		var	action			= curr_tag.attr("data-action");
		var	program_id_tag	= curr_tag.closest(".row").find(".new_program");
		var	program_id		= program_id_tag.attr("data-id");
		var	number_tag		= curr_tag.closest(".row").find(".new_bonus_number");
		var	number			= number_tag.val();

		if(program_id && program_id.length)
		{
			if(number.length)
			{
				curr_tag.button("loading");

				$.getJSON(
					'/cgi-bin/ajax_anyrole_1.cgi',
					{
						action: action,
						program_id: program_id,
						number: number,
					})
					.done(function(data)
					{
						if(data.result == "success")
						{
							curr_tag.closest(".collapse").collapse("hide");

							if(program_id_tag.prop("disabled"))
							{
								// --- don't change attributes
							}
							else
							{
								program_id_tag.val("");
								program_id_tag.attr("data-id", "");
							}
							number_tag.val("");

							if(action == "AJAX_addAviaBonusNumber")			RenderAirlineBonuses(data.bonuses_airlines);
							if(action == "AJAX_addRailroadBonusNumber")		RenderRailroadsBonuses(data.bonuses_railroads);
							if(action == "AJAX_addHotelchainBonusNumber")	RenderHotelchainBonuses(data.bonuses_hotel_chains);
						}
						else
						{
							system_calls.PopoverInfo(curr_tag.parent(), data.description);
						}
					})
					.fail(function(data)
					{
						system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
					})
					.always(function()
					{
						setTimeout(function()
						{
							curr_tag.button("reset");
						}, 200);
					});
			}
			else
			{
				system_calls.PopoverError(curr_tag, "Введите номер участника програмы");
			}
		}
		else
		{
			system_calls.PopoverError(curr_tag, "Выберите бонусную программу из выпадающего списка");
		}
	};

	var	GeneralBonuses_GetDOM = function(bonuses, type)
	{
		var		result = $();

		bonuses.forEach(function(item)
		{
			var		row					= $("<div>")	.addClass("row __program_id_" + item.id);
			var		col_program_name	= $("<div>")	.addClass("col-xs-5 col-md-4");
			var		col_number			= $("<div>")	.addClass("col-xs-5 col-md-7");
			var		col_remove			= $("<div>")	.addClass("col-xs-2 col-md-1");
			var		remove_button		= $("<i>")		.addClass("fa fa-times-circle padding_close float_right cursor_pointer animate_close_onhover");
			var		input_tag			= $("<input>")	.addClass("transparent");

			if(item.programs[0].description_rus.length) col_program_name.append(item.programs[0].description_rus);
			else if(item.programs[0].description_eng.length) col_program_name.append(item.programs[0].description_eng);
			else col_program_name.append(item.programs[0].code);

			input_tag
				.attr("data-script", "ajax_anyrole_1.cgi")
				.attr("data-action", bonus_update_action[type])
				.attr("data-id", item.id)
				.attr("data-db_value", item.number)
				.on("change", system_calls.UpdateInputFieldOnServer)
				.val(item.number);

			remove_button.on("click", function()
								{
									$("#AreYouSure #Remove").data("id", item.id);
									$("#AreYouSure #Remove").data("action", bonus_delete_action[type]);
									$("#AreYouSure #Remove").data("script", "ajax_anyrole_1.cgi");
									$("#AreYouSure").modal("show");
								});

			row
				.append(col_program_name)
				.append(col_number.append(input_tag).append($("<label>")))
				.append(col_remove.append(remove_button));

			result = result.add(row);
		});

		return result;
	};

	var	RenderAirlineBonuses = function(bonuses)
	{
		$("#avia_bonus_list").empty().append(GeneralBonuses_GetDOM(bonuses, "airline"));
	};

	var	RenderHotelchainBonuses = function(bonuses)
	{
		$("#hotelchain_bonus_list").empty().append(GeneralBonuses_GetDOM(bonuses, "hotelchain"));
	};

	var	RenderRailroadsBonuses = function(bonuses)
	{
		$("#railroad_bonus_list").empty().append(GeneralBonuses_GetDOM(bonuses, "railroad"));
	};

	var	CheckValidity_SmartwayEnrollment = function()
	{
		var	error_message = "";

		if($("#foreign_passport_number").val().length === 0)
		{
			error_message = "Укажите номер заграничного паспорта";
			system_calls.PopoverError($("#foreign_passport_number"), error_message);
		}
		else if($(".foreign_passport_expiration_date").val().length === 0)
		{
			error_message = "Укажите дату окончания заграничного паспорта";
			system_calls.PopoverError($(".foreign_passport_expiration_date"), error_message);
		}
		else if($("#last_name_en").val().length === 0)
		{
			error_message = "Укажите фамилию как в заграничном паспорте";
			system_calls.PopoverError($("#last_name_en"), error_message);
		}
		else if($("#first_name_en").val().length === 0)
		{
			error_message = "Укажите имя как в заграничном паспорте";
			system_calls.PopoverError($("#first_name_en"), error_message);
		}
		else if($("#last_name_ru").val().length === 0)
		{
			error_message = "Укажите фамилию";
			system_calls.PopoverError($("#last_name_ru"), error_message);
		}
		else if($("#first_name_ru").val().length === 0)
		{
			error_message = "Укажите имя";
			system_calls.PopoverError($("#first_name_ru"), error_message);
		}
		else if($(".passport_issue_date").val().length === 0)
		{
			error_message = "Укажите дату выдачи российского паспорта";
			system_calls.PopoverError($(".passport_issue_date"), error_message);
		}
		else if($("#passport_series").val().length === 0)
		{
			error_message = "Укажите серию российского паспорта";
			system_calls.PopoverError($("#passport_series"), error_message);
		}
		else if($("#passport_number").val().length === 0)
		{
			error_message = "Укажите номер российского паспорта";
			system_calls.PopoverError($("#passport_number"), error_message);
		}
		else if($("#phone_number").val().length === 0)
		{
			error_message = "Укажите номер телефона";
			system_calls.PopoverError($("#phone_number"), error_message);
		}
		else if($(".birthday").val().length === 0)
		{
			error_message = "Укажите дату вашего рождения";
			system_calls.PopoverError($(".birthday"), error_message);
		}

		return error_message;
	};
 
	var SmartwayEnrollModal_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var target = $(curr_tag.attr("data-target"));
		var	error_message = CheckValidity_SmartwayEnrollment();

		if(error_message.length === 0)
		{
			target.modal("show");
		}
		else
		{
			system_calls.PopoverError(curr_tag, error_message);
		}
	};

	var SmartwayEnrollSubmit_ClickHandler = function(e)
	{
		var	curr_tag = $(this);


		curr_tag.button("loading");

		$.getJSON('/cgi-bin/subcontractor.cgi?action=AJAX_enrollSmartway')
			.done(function(data) {
				if(data.result === "success")
				{
					$("#SmartwayEnrollModal").modal("hide");
					setTimeout(function() { 
									$("#SmartwayEnrollModal_Button").hide(200); 
									$(".dropdown.smartway").show(200);
									window.location.href = "/cgi-bin/subcontractor.cgi?action=subcontractor_travel_search_template&rand=" + Math.random()*98764387654357;
								}, 200);
				}
				else
				{
					system_calls.PopoverError(curr_tag, data.description);
				}
			})
			.fail(function() {
				system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
			})
			.always(function() {
				setTimeout(function() { curr_tag.button("reset"); }, 200);
			});

	};

	return {
		Init: Init,
		DrawAllAvatars: DrawAllAvatars,
		userProfile: userProfile,
	};

})();
