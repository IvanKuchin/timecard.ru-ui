/*jslint devel: true, indent: 4, maxerr: 50*/
/*globals $:false localStorage:false location: false*/
/*globals localStorage:false*/
/*globals location:false*/
/*globals document:false*/
/*globals window:false*/
/*globals Image:false*/
/*globals jQuery:false*/
/*globals Notification:false*/
/*globals setTimeout:false*/
/*globals navigator:false*/
/*globals module:false*/
/*globals define:false*/

// --- change it in (chat.js, common.js, localy.h)
var FREQUENCY_ECHO_REQUEST = 60;
var FREQUENCY_USRENOTIFICATION_REQUEST = 60 * 5;
var FREQUENCY_RANDOM_FACTOR = 10;

// --- change it in (common.js, localy.h)
var	SOW_EXPIRATION_BUFFER = 31;

// -- global var used because of setTimeout don't support parameters in IE9
var	navMenu_search = navMenu_search || {};
var	navMenu_chat = navMenu_chat || {};
var navMenu_userNotification = navMenu_userNotification || {};
var	system_calls = system_calls || {};
var	system_notifications = system_notifications || {};
var userRequestList;
var	userCache = userCache || {};
var	gift_list = gift_list || {};

system_calls = (function()
{
	"use strict";
	var	userSignedIn = false;
	var	firstRun = true; // --- used to fire one time running func depends on userSignedIn
	var	companyTypes = ["___","ООО","ОАО","ПАО","ЗАО","Группа","ИП","ЧОП","Концерн","Конгломерат","Кооператив","ТСЖ","Холдинг","Корпорация","НИИ"].sort();
	var	eventTypes = {invitee: "По приглашению", everyone: "Открыто для всех"};
	var	startTime = {"0:00":"0:00", "0:30":"0:30", "1:00":"1:00", "1:30":"1:30", "2:00":"2:00", "2:30":"2:30", "3:00":"3:00", "3:30":"3:30", "4:00":"4:00", "4:30":"4:30", "5:00":"5:00", "5:30":"5:30", "6:00":"6:00", "6:30":"6:30", "7:00":"7:00", "7:30":"7:30", "8:00":"8:00", "8:30":"8:30", "9:00":"9:00", "9:30":"9:30", "10:00":"10:00", "10:30":"10:30", "11:00":"11:00", "11:30":"11:30", "12:00":"12:00", "12:30":"12:30", "13:00":"13:00", "13:30":"13:30", "14:00":"14:00", "14:30":"14:30", "15:00":"15:00", "15:30":"15:30", "16:00":"16:00", "16:30":"16:30", "17:00":"17:00", "17:30":"17:30", "18:00":"18:00", "18:30":"18:30", "19:00":"19:00", "19:30":"19:30", "20:00":"20:00", "20:30":"20:30", "21:00":"21:00", "21:30":"21:30", "22:00":"22:00", "22:30":"22:30", "23:00":"23:00", "23:30":"23:30"};
	var	holidays = ["2018-01-01","2018-01-02","2018-01-03","2018-01-04","2018-01-05","2018-01-06"];
	var	TIMECARD_REPORT_TIME_FORMAT = "DD MMMM YYYY hh:mm";
	var	TIMECARD_REPORT_DATE_FORMAT = "DD MMMM YYYY";

	var	globalScrollPrevOffset = -1;
	var	current_script_global = "";

	var Init = function()
	{
		// --- Turn of AJAX caching
		$.ajaxSetup({ cache: false });

		// --- Animate shadow on logo
		$("#imageLogo").on("mouseover", function() { $(this).addClass("box-shadow--8dp"); });
		$("#imageLogo").on("mouseout", function() { $(this).removeClass("box-shadow--8dp"); });

		// --- Friendship buttons
		$("#ButtonFriendshipRemovalYes").on('click', function()
			{
				var clickedButton = $(this).data("clickedButton");

				$("#DialogFriendshipRemovalYesNo").modal('hide');

				clickedButton.data("action", "disconnect");
				clickedButton.click();
			});

		$("#DialogFriendshipRemovalYesNo").on('shown.bs.modal',
			function()
			{
				$("#DialogFriendshipRemovalYesNo button.btn.btn-default").focus();
			});


		// --- Friends href
		$("#navbar-my_network").on('click', function()
			{
				window.location.href = "/my_network?rand=" + Math.random()*98765432123456;
			} );

		// --- Сhat href
		$("#navbar-chat").on('click', function()
			{
				window.location.href = "/chat?rand=" + Math.random()*98765432123456;
			} );

		// --- Notification href
		$("#navbar-notification").on('click', function()
			{
				window.location.href = "/user_notifications?rand=" + Math.random()*98765432123456;
			} );

		// --- Menu drop down on mouse over
		jQuery('ul.nav li.dropdown').mouseenter(function() {
		  jQuery(this).find('.dropdown-menu').stop(true, true).delay(200).fadeIn();
		});
		jQuery('ul.nav li.dropdown').mouseleave(function() {
		  jQuery(this).find('.dropdown-menu').stop(true, true).delay(200).fadeOut();
		});

		// --- Check availability / sign-in
		window.setTimeout(SendEchoRequest, 1000);


		NavigationMenuUpdate();
	};

	var NavigationMenuUpdate = function()
	{
		var		user_tag = $("#myUserID");

		// --- Main search
		$("#navMenuSearchText").on("input", navMenu_search.OnInputHandler)
								.on("keyup", navMenu_search.OnKeyupHandler);
		$("#navMenuSearchSubmit").on("click", navMenu_search.OnSubmitClickHandler);

		// --- smartway
		if(user_tag && user_tag.attr("data-smartway_enrolled") && (user_tag.attr("data-smartway_enrolled") == "true"))
			$("li.dropdown.smartway").show(100);
	};

	var	ReplaceUIToGuest = function()
	{
		var		liTag = $("<li>");
		var		hrefTag = $("<a>")	.attr("href", "/login?rand=" + GetUUID())
									.append("Регистрация");

		// --- replace navigation menu to guest
		$("#NavigationMenu ul").empty();
		$("#NavigationMenu ul").first().append(liTag.append(hrefTag));

		// --- remove friendship buttons
		$("button.friendshipButton").remove();
	};

	var	GetUUID = function()
	{
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) 
			{
				var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
			});
	};

	var	isUserSignedin = function()
	{
		return userSignedIn;
	};

	var	SetUserSignedout = function()
	{
		userSignedIn = false;
		ReplaceUIToGuest();
	};

	var	SetUserSignedin = function()
	{
		userSignedIn = true;
	};

	var	GetIntoPublicZone = function()
	{
		window.location.replace("/autologin?rand=" + Math.random()*98765432123456);
	};

	function isTouchBasedUA() {
	  try{ document.createEvent("TouchEvent"); return true; }
	  catch(e){ return false; }
	}

	function isOrientationPortrait()
	{
		return ($(window).height() > $(window).width() ? true : false);
	}

	function isOrientationLandscape()
	{
		return ($(window).width() > $(window).height() ? true : false);
	}

	var	RemoveSpaces = function(text)
	{
		var result = text;

		result = result.replace(/ /g, "");
		return result;
	};

	var CutLongMessages = function(message, len)
	{
	 	if(message.length > len)
		{
	 		return message.substr(0, len) + "...";
		}

	 	return message;
	};

	var	PopoverError = function(tagID, message, placement)
	{
		var		alarm_tag;
		var		attr_id = "";
		var		error_message = "";
		var		loop_counter = 0;
		var		original_tag = tagID;
		var		display_timeout = Math.min(Math.max(30, message.length) * 100, 10000);

		if(placement) {} else { placement = "top"; }

		if(typeof(tagID) == "string") 		{ alarm_tag = $("#" + tagID); attr_id = tagID; }
		else if(typeof(tagID) == "object")	{ alarm_tag = tagID; attr_id = tagID.attr("id"); }
		else console.error("unknown tagID type(" + typeof(tagID) + ")");

		console.error("ERROR: tagID(" + attr_id + ") " + message);

		while(alarm_tag.is(":visible") === false)
		{
			alarm_tag = alarm_tag.parent();

			if(loop_counter++ > 5)
			{
				error_message = "fail to find visible parent to " + original_tag.attr("id");
				break;
			}
		}

		if(error_message.length === 0)
		{
			if(typeof alarm_tag != "undefined")
			{
				alarm_tag
					.attr("disabled", "disabled")
					.popover({"content": message, "placement":placement, "html": true})
					.popover("show");

				if(alarm_tag.parent().hasClass("has-feedback"))
				{
					alarm_tag
						.parent()
						.removeClass("has-success")
						.addClass("has-feedback has-error");
				}

				setTimeout(function ()
					{
						alarm_tag
							.removeAttr("disabled")
							.popover("destroy");
						if(alarm_tag.parent().hasClass("has-feedback"))
						{
							alarm_tag
								.parent()
								.removeClass("has-feedback has-error");
						}
					}, display_timeout);
			}
		}
		else
		{
			console.error(error_message);
		}
	};

	var	PopoverInfo = function(tagID, message, html)
	{
		var		alarm_tag;
		var		error_message = "";
		var		loop_counter = 0;
		var		original_tag = tagID;
		var		display_timeout = Math.min(Math.max(30, message.length) * 100, 10000);

		if(html) {} else { html = false; }

		if(typeof(tagID) == "string") 		{ alarm_tag = $("#" + tagID); }
		else if(typeof(tagID) == "object")	{ alarm_tag = tagID; }
		else console.error("unknown tagID type(" + typeof(tagID) + ")");

		while(alarm_tag.is(":visible") === false)
		{
			alarm_tag = alarm_tag.parent();

			if(loop_counter++ > 5)
			{
				error_message = "fail to find visible parent to " + original_tag;
				break;
			}
		}

		if(error_message.length === 0)
		{
			if(typeof alarm_tag != "undefined")
			{
				$(alarm_tag)
					.attr("disabled", "disabled")
					.popover({"content": message, "placement":"top", html: html})
					.popover("show");
				setTimeout(function ()
				{
					$(alarm_tag)
						.removeAttr("disabled")
						.popover("destroy");
				}, display_timeout);
			}
		}
		else
		{
			console.error(error_message);
		}
	};

	var	AlertError = function(tagID, message)
	{
		$("#" + tagID).addClass("animateClass");
		$("#" + tagID).addClass("form-group alert alert-danger");
		$("#" + tagID).append(message);

		setTimeout(function ()
			{
				$("#" + tagID).empty().removeClass("form-group alert alert-danger");
			}, 3000);
	};

	var FilterUnsupportedUTF8Symbols = function(plainText)
	{
		var	result = String(plainText);

		result = result.replace(/–/img, "-");
		result = result.replace(/•/img, "*");
		result = result.replace(/\"/img, "&quot;");
		result = result.replace(/\\/img, "&#92;");
		result = result.replace(/^\s+/, '');
		result = result.replace(/\s+$/, '');

		return result;
	};

	var	PrebuiltInitValue = function(htmlText)
	{
		var	result = String(htmlText);

		result = result.replace(/&amp;/img, "&");

		return result;
	};

	var ConvertHTMLToText = function(htmlText)
	{
		var	result = String(htmlText);

		result = result.replace(/<br>/img, "\n");
		result = result.replace(/&amp;/img, "&");
		result = result.replace(/&lt;/img, "<");
		result = result.replace(/&gt;/img, ">");
		result = result.replace(/•/img, "*");
		result = result.replace(/&quot;/img, "\"");
		result = result.replace(/&#92;/img, "\\");
		result = result.replace(/&#39;/img, "'");
		result = result.replace(/&#35;/img, "№");
		result = result.replace(/^\s+/, '');
		result = result.replace(/\s+$/, '');

		return result;
	};

	var ConvertTextToHTML = function(plainText)
	{
		var	result = String(plainText);

		result = FilterUnsupportedUTF8Symbols(result);
		result = result.replace(/</img, "&lt;");
		result = result.replace(/>/img, "&gt;");
		result = result.replace(/\n/img, "<br>");
		result = result.replace(/•/img, "*");
		result = result.replace(/^\s+/, '');
		result = result.replace(/\s+$/, '');

		return result;
	};

	var	ConvertMonthNameToNumber = function(srcStr)
	{
		var		dstStr = String(srcStr);

		dstStr = dstStr.replace(/Январь/i, "01");
		dstStr = dstStr.replace(/Янв/i, "01");
		dstStr = dstStr.replace(/Февраль/i, "02");
		dstStr = dstStr.replace(/Фев/i, "02");
		dstStr = dstStr.replace(/Март/i, "03");
		dstStr = dstStr.replace(/Мар/i, "03");
		dstStr = dstStr.replace(/Апрель/i, "04");
		dstStr = dstStr.replace(/Апр/i, "04");
		dstStr = dstStr.replace(/Май/i, "05");
		dstStr = dstStr.replace(/Июнь/i, "06");
		dstStr = dstStr.replace(/Июн/i, "06");
		dstStr = dstStr.replace(/Июль/i, "07");
		dstStr = dstStr.replace(/Июл/i, "07");
		dstStr = dstStr.replace(/Август/i, "08");
		dstStr = dstStr.replace(/Авг/i, "08");
		dstStr = dstStr.replace(/Сентябрь/i, "09");
		dstStr = dstStr.replace(/Сент/i, "09");
		dstStr = dstStr.replace(/Сен/i, "09");
		dstStr = dstStr.replace(/Октябрь/i, "10");
		dstStr = dstStr.replace(/Окт/i, "10");
		dstStr = dstStr.replace(/Ноябрь/i, "11");
		dstStr = dstStr.replace(/Ноя/i, "11");
		dstStr = dstStr.replace(/Декабрь/i, "12");
		dstStr = dstStr.replace(/Дек/i, "12");

		return dstStr;
	};

	var	ConvertMonthNumberToAbbrName = function(srcStr)
	{
		var		dstStr = String(srcStr);

		dstStr = dstStr.replace(/^0?1$/i, "Янв");
		dstStr = dstStr.replace(/^0?2$/i, "Фев");
		dstStr = dstStr.replace(/^0?3$/i, "Мар");
		dstStr = dstStr.replace(/^0?4$/i, "Апр");
		dstStr = dstStr.replace(/^0?5$/i, "Май");
		dstStr = dstStr.replace(/^0?6$/i, "Июн");
		dstStr = dstStr.replace(/^0?7$/i, "Июл");
		dstStr = dstStr.replace(/^0?8$/i, "Авг");
		dstStr = dstStr.replace(/^0?9$/i, "Сен");
		dstStr = dstStr.replace(/^10$/i, "Окт");
		dstStr = dstStr.replace(/^11$/i, "Ноя");
		dstStr = dstStr.replace(/^12$/i, "Дек");

		return dstStr;
	};

	var	ConvertMonthNumberToFullName = function(srcStr)
	{
		var		dstStr = String(srcStr);

		dstStr = dstStr.replace(/^0?1$/i, "Января");
		dstStr = dstStr.replace(/^0?2$/i, "Февраля");
		dstStr = dstStr.replace(/^0?3$/i, "Марта");
		dstStr = dstStr.replace(/^0?4$/i, "Апреля");
		dstStr = dstStr.replace(/^0?5$/i, "Мая");
		dstStr = dstStr.replace(/^0?6$/i, "Июня");
		dstStr = dstStr.replace(/^0?7$/i, "Июля");
		dstStr = dstStr.replace(/^0?8$/i, "Августа");
		dstStr = dstStr.replace(/^0?9$/i, "Сентября");
		dstStr = dstStr.replace(/^10$/i, "Октября");
		dstStr = dstStr.replace(/^11$/i, "Ноября");
		dstStr = dstStr.replace(/^12$/i, "Декабря");

		return dstStr;
	};

	// Convert from SQL format to seconds
	// SQL: yyyy-mm-dd (for ex: 1980-08-15)
	// seconds: dd MM yyyy (for ex: 15 Aug 1980)
	var	ConvertDateSQLToSec = function(sqlDate)
	{
		var		dateArr = sqlDate.split(/-/);
		var		date_obj = new Date(dateArr[0], parseInt(dateArr[1]) - 1, dateArr[2], 12, 0, 0);

		return date_obj.getTime() / 1000;
	};

	// Convert from SQL format to HumaReadable
	// SQL: yyyy-mm-dd (for ex: 1980-08-15)
	// Human readable: dd MM yyyy (for ex: 15 Aug 1980)
	var	ConvertDateSQLToHuman = function(sqlDate)
	{
		var		dateArr = sqlDate.split(/-/);

		return (((parseInt(dateArr[2])  < 10) && (dateArr[2].length == 1)) ? "0" + dateArr[2] : dateArr[2]) + " " + ConvertMonthNumberToAbbrName(dateArr[1]) + " " + dateArr[0];
	};

	// Convert from SQL format to HumaReadable
	// SQL: dd/mm/yyyy (for ex: 15/08/1980)
	// Human readable: dd MM yyyy (for ex: 15 Aug 1980)
	var	ConvertDateRussiaToHuman = function(sqlDate)
	{
		var		dateArr = sqlDate.split(/\//);

		return dateArr[0] + " " + ConvertMonthNumberToAbbrName(dateArr[1]) + " " + (((parseInt(dateArr[2])  < 10) && (dateArr[2].length == 1)) ? "0" + dateArr[2] : dateArr[2]);
	};

	// Convert from SQL format to HumaReadable
	// SQL: dd/mm/yyyy (for ex: 15/08/1980)
	// Human readable: dd MM (for ex: 15 Августа)
	var	ConvertDateRussiaToHumanWithoutYear = function(sqlDate)
	{
		var		dateArr = sqlDate.split(/\//);

		return dateArr[0] + " " + ConvertMonthNumberToFullName(dateArr[1]);
	};

	// Convert from SQL format to HumaReadable
	// SQL: dd/mm/yyyy (for ex: 15/08/1980)
	// Human readable: dd MM (for ex: 15 Августа 1980)
	var	ConvertDateRussiaToHumanFullMonth = function(sqlDate)
	{
		var		dateArr = sqlDate.split(/\//);

		return dateArr[0] + " " + ConvertMonthNumberToFullName(dateArr[1]) + " " + (((parseInt(dateArr[2])  < 10) && (dateArr[2].length == 1)) ? "0" + dateArr[2] : dateArr[2]);
	};

	var	GetLocalizedDateNoTimeFromTimestamp = function(timestampEvent)
	{
		var		result;

		result = timestampEvent.getDate() + " " + system_calls.ConvertMonthNumberToAbbrName( (timestampEvent.getMonth() + 1) ) + " " + timestampEvent.getFullYear();

		return result;
	};

	var	GetLocalizedDateFromTimestamp = function(timestampEvent)
	{
		var		result;

		result = (timestampEvent.getHours() < 10 ? "0" : "") + timestampEvent.getHours() + ":" + (timestampEvent.getMinutes() < 10 ? "0" : "") + timestampEvent.getMinutes() + ":" + (timestampEvent.getSeconds() < 10 ? "0" : "") + timestampEvent.getSeconds() + " " + timestampEvent.getDate() + " " + system_calls.ConvertMonthNumberToAbbrName( (timestampEvent.getMonth() + 1) ) + " " + timestampEvent.getFullYear();

		return result;
	};

	var	GetLocalizedDateTimeFromTimestamp = function(timestampEvent)
	{
		var		result;

		result =  timestampEvent.getDate() + " " + system_calls.ConvertMonthNumberToAbbrName( (timestampEvent.getMonth() + 1) ) + " " + timestampEvent.getFullYear() + " в " + (timestampEvent.getHours() < 10 ? "0" : "") + timestampEvent.getHours() + ":" + (timestampEvent.getMinutes() < 10 ? "0" : "") + timestampEvent.getMinutes() + ":" + (timestampEvent.getSeconds() < 10 ? "0" : "") + timestampEvent.getSeconds();

		return result;
	};

	// --- input seconds since 1970 to event
	// --- output example: 2017-5-2
	var	GetSQLFormatedDateNoTimeFromTimestamp = function(timestampEvent)
	{
		var		result;

		result = timestampEvent.getFullYear() + "-" + String(timestampEvent.getMonth() + 1) + "-" + timestampEvent.getDate();

		return result;
	};


	// --- input: seconds since 1970 GMT
	// --- output: example: 2 Май 2017
	var	GetLocalizedDateNoTimeFromSeconds = function(seconds)
	{
		var		timestampEvent = new Date(GetMsecSinceEpoch(seconds));
		return GetLocalizedDateNoTimeFromTimestamp(timestampEvent);
	};

	// --- input: seconds since 1970 GMT
	// --- output: example: 13:34:01 2 Май 2017
	var	GetLocalizedDateFromSeconds = function(seconds)
	{
		var		timestampEvent = new Date(GetMsecSinceEpoch(seconds));

		return GetLocalizedDateFromTimestamp(timestampEvent);
	};

	// --- private function
	// --- input: seconds since 1970 GMT
	// --- output: example: 2 Май 2017 в 13:34:01
	var	GetLocalizedDateTimeFromSeconds = function(seconds)
	{
		var		timestampEvent = new Date(GetMsecSinceEpoch(seconds));

		return GetLocalizedDateTimeFromTimestamp(timestampEvent);
	};

	var	GetLocalizedDateFromDelta = function(seconds)
	{
		var		timestampNow = new Date();
		var		timestampEvent = new Date(timestampNow.getTime() - ((typeof(seconds) == "string") ? parseInt(seconds) : seconds) * 1000);

		return GetLocalizedDateFromTimestamp(timestampEvent);
	};

	// --- input: format
	// ---		YYYY - year (2012)
	// ---		YYY - year, don't show if same as now
	// ---		YY - year (12)
	// ---		MM - month (08)
	// ---		MMM - short month (Авг)
	// ---		MMMM - spelled month (Августа)
	// ---		DD - day
	// ---		HH - hour
	// ---		hh - hour
	// ---		mm - mins
	// ---		ss - seconds
	var	GetFormattedDateFromSeconds = function(seconds, format)
	{
		var		result = "";

		if(typeof(format) == "undefined")
		{
			console.error("format parameter mandatory");
		}
		else
		{
			var		timestamp = new Date(GetMsecSinceEpoch(seconds));
			var		timestampNow = new Date();

			result = format;

			if(format.match(/\bYYYY\b/)) result = result.replace(/\bYYYY\b/g, timestamp.getFullYear());
			if(format.match(/\bYYY\b/)) result = result.replace(/\bYYY\b/g, timestamp.getYear() == timestampNow.getYear() ? "" : timestamp.getFullYear());
			if(format.match(/\bYY\b/)) result = result.replace(/\bYY\b/g, "'" + String(timestamp.getYear() - 100) );
			if(format.match(/\bMM\b/)) result = result.replace(/\bMM\b/g, timestamp.getMonth() + 1);
			if(format.match(/\bMMM\b/)) result = result.replace(/\bMMM\b/g, ConvertMonthNumberToAbbrName(timestamp.getMonth() + 1));
			if(format.match(/\bMMMM\b/)) result = result.replace(/\bMMMM\b/g, ConvertMonthNumberToFullName(timestamp.getMonth() + 1));
			if(format.match(/\bDD\b/)) result = result.replace(/\bDD\b/g, timestamp.getDate());
			if(format.match(/\bHH\b/)) result = result.replace(/\bHH\b/g, timestamp.getHours());
			if(format.match(/\bhh\b/)) result = result.replace(/\bhh\b/g, timestamp.getHours());
			if(format.match(/\bmm\b/)) result = result.replace(/\bmm\b/g, (timestamp.getMinutes() < 10 ? "0" : "") + timestamp.getMinutes());
			if(format.match(/\bss\b/)) result = result.replace(/\bss\b/g, (timestamp.getSeconds() < 10 ? "0" : "") + timestamp.getSeconds());
		}

		return result;
	};

	var	GetSQLFormatedDateNoTimeFromSeconds = function(seconds)
	{
		var		timestampEvent = new Date(GetMsecSinceEpoch(seconds));

		return GetSQLFormatedDateNoTimeFromTimestamp(timestampEvent);
	};

	var	GetDurationSpellingInHoursAndMinutes = function(seconds)
	{
		var	hours = Math.trunc(seconds / 3600);
		var	mins = Math.trunc((seconds % 3600) / 60);

		return "" + hours + " " + system_calls.GetHoursSpelling(hours) + " " + mins + " " + system_calls.GetMinutesSpelling(mins);
	};

	var	GetMinutesSpelling = function(units)
	{
		var		result = "";

		if((units >= 5) && (units <= 20)) { result = "минут"; }
		else if(units % 10 == 1) { result = "минута"; }
		else if((units % 10 >= 2) && (units % 10 <= 4)) { result = "минуты"; }
		else { result = "минут"; }

		return result;
	};

	var	GetHoursSpelling = function(units)
	{
		var		result = "";

		if((units >= 5) && (units <= 20)) { result = "часов"; }
		else if(units % 10 == 1) { result = "час"; }
		else if((units % 10 >= 2) && (units % 10 <= 4)) { result = "часа"; }
		else { result = "часов"; }

		return result;
	};

	var	GetDaysSpelling = function(units)
	{
		var		result = "";

		if((units >= 5) && (units <= 20)) { result = "дней"; }
		else if(units % 10 == 1) { result = "день"; }
		else if((units % 10 >= 2) && (units % 10 <= 4)) { result = "дня"; }
		else { result = "дней"; }

		return result;
	};

	var	GetMonthsSpelling = function(units)
	{
		var		result = "";

		if((units >= 5) && (units <= 20)) { result = "месяцев"; }
		else if(units % 10 == 1) { result = "месяц"; }
		else if((units % 10 >= 2) && (units % 10 <= 4)) { result = "месяца"; }
		else { result = "месяцев"; }

		return result;
	};

	var	GetYearsSpelling = function(units)
	{
		var		result = "";

		if((units >= 5) && (units <= 20)) { result = "лет"; }
		else if(units % 10 == 1) { result = "год"; }
		else if((units % 10 >= 2) && (units % 10 <= 4)) { result = "года"; }
		else { result = "лет"; }

		return result;
	};

	var	GetSpellingMonthName = function(id)
	{
		var		result;

		if(id == 1) result = "января";
		if(id == 2) result = "февраля";
		if(id == 3) result = "марта";
		if(id == 4) result = "апреля";
		if(id == 5) result = "мая";
		if(id == 6) result = "июня";
		if(id == 7) result = "июля";
		if(id == 8) result = "августа";
		if(id == 9) result = "сентября";
		if(id == 10) result = "октября";
		if(id == 11) result = "ноября";
		if(id == 12) result = "декабря";

		return	result;
	};

	var	GetLocalizedDateFromSecondsHumanFormat = function(seconds)
	{
		var		timestampEvent = new Date(GetMsecSinceEpoch());
		var		timestampNow = new Date();
		var		diffYears = timestampNow.getFullYear() - timestampEvent.getFullYear();
		var		diffMonths = timestampNow.getMonth() - timestampEvent.getMonth();
		var		diffDays = timestampNow.getDate() - timestampEvent.getDate();
		var		diffHours = timestampNow.getHours() - timestampEvent.getHours();
		var		diffMins = timestampNow.getMinutes() - timestampEvent.getMinutes();
		var		months;

		var		result = "";

		if((diffYears > 1) || ((diffYears == 1) && (diffMonths >= 0)))
		{
			result = timestampEvent.getDate() + " " + GetSpellingMonthName(timestampEvent.getMonth() + 1) + " " + timestampEvent.getFullYear();
		}
		else if((diffYears == 1) && (diffMonths < 0))
		{
			months = 12 - (timestampEvent.getMonth() + 1) + (timestampNow.getMonth() + 1);

			if(months == 1) { result = "прошлый месяц"; }
			else if(months == 2) { result = "позапрошлый месяц"; }
			else if(months == 6) { result = "пол года назад"; }
			else { result  = months + " " + GetMonthsSpelling(months) + " назад"; }
		}
		else if(diffMonths)
		{
			months = (timestampNow.getMonth() + 1) - (timestampEvent.getMonth() + 1);

			if(months == 1) { result = "прошлый месяц"; }
			else if(months == 2) { result = "позапрошлый месяц"; }
			else if(months == 6) { result = "пол года назад"; }
			else { result  = months + " " + GetMonthsSpelling(months) + " назад"; }
		}

		result = result + " назад";

		return result;
	};

	// --- returns DST offset in minutes between NOW() and Jan 1
	var GetDSTOffsetNow = function()
	{
		var tsNow = new Date();
		var tsJan = new Date(tsNow.getFullYear(), 0, 1);

		return tsJan.getTimezoneOffset() - tsNow.getTimezoneOffset();
	};


	// --- private !!! don't use it from outside classes
	var	GetMsecSinceEpoch = function(seconds)
	{
		var		result = ((typeof(seconds) == "string") ? parseInt(seconds) : seconds) * 1000;

		// --- DST fixing
		// --- Explanation:
		// --- JavaScript returning timedifference taking DST into consideration
		// --- MySQL  returning timedifference doesn't taking DST into consideration
		// --- discrepancy appears between MySQL and JavaScript
		// result -= GetDSTOffsetNow() * 60 * 1000;

		return 	result;
	};

	// --- input: second since 1970
	// --- output: DD/mm/YYYY (for ex: 02/05/2017)
	var	GetLocalizedRUFormatDateNoTimeFromSeconds = function(seconds)
	{
		var msecSince1970 = GetMsecSinceEpoch(seconds);
		var	d1 = new Date(msecSince1970);
		var	day =  d1.getDate();
		var	mon = d1.getMonth() + 1;
		var	year = d1.getYear() + 1900;

		if(day < 10) day = "0" + day;
		if(mon < 10) mon = "0" + mon;

		return (day + "/" + mon + "/" + year);
	};

	// --- input: 0
	// --- output: 31 декабря 1969
	var	GetLocalizedDateInHumanFormatSecSince1970 = function(seconds)
	{
		var		msecSince1970 = GetMsecSinceEpoch(seconds);

		return(GetLocalizedDateInHumanFormatMsecSince1970(msecSince1970) + " назад");
	};

	// --- input: 3600 000
	// --- output: 1 час
	var	GetLocalizedDateInHumanFormatMsecSinceEvent = function(secSinceEvent)
	{
		var		timestampNow = new Date();
		// var		timestamp1970 = new Date(1970, 0, 1);

		return(GetLocalizedDateInHumanFormatMsecSince1970(timestampNow.getTime() - secSinceEvent));
	};

	// --- private !!! don't use it from outside classes
	var	GetLocalizedDateInHumanFormatMsecSince1970 = function(msecEventSince1970)
	{
		var		timestampNow = new Date();
		var		timestampEvent = new Date(msecEventSince1970);

		var		differenceFromNow = (timestampNow.getTime() - msecEventSince1970) / 1000;

		var		minutes, hours, days, months;

		var		result = "";

		if(differenceFromNow < 60 * 60)
		{
			minutes = Math.floor(differenceFromNow / 60);

			result  =  minutes + " " + GetMinutesSpelling(minutes);
		}
		else if(differenceFromNow < 24 * 60 * 60)
		{
			hours = Math.floor(differenceFromNow / (60 * 60));

			result  = hours + " " + GetHoursSpelling(hours);
		}
		else if(differenceFromNow < 30 * 24 * 60 * 60)
		{
			days = Math.floor(differenceFromNow / (24 * 60 * 60));

			result  = days + " " + GetDaysSpelling(days);
		}
		else if(differenceFromNow < 12 * 30 * 24 * 60 * 60)
		{
			months = Math.floor(differenceFromNow / (30 * 24 * 60 * 60));
			days = Math.floor((differenceFromNow - months * 30 * 24 * 60 * 60) / (24 * 60 * 60));

			result  = months + " " + GetMonthsSpelling(months) + " " + days + " " + GetDaysSpelling(days);
		}
		else
		{
			result = timestampEvent.getDate() + " " + GetSpellingMonthName(timestampEvent.getMonth() + 1) + " " + timestampEvent.getFullYear();
		}

		return result;
	};


	// --- input: duration in seconds
	// --- output:	5 дней
	// --- 			2 месяца
	// --- 			1 год 2 месяца
	// --- 			3 года 11 месяцев
	// ---                           ^^^^^^ (no days, no hours, no minutes)
	var	GetLocalizedWorkDurationFromDelta = function(seconds)
	{
		var		result = "";
		var		minutes, hours, days, months, years;

		if(seconds < 60 * 60)
		{
			minutes = Math.floor(seconds / 60);

			result  =  minutes + " " + GetMinutesSpelling(minutes);
		}
		else if(seconds < 24 * 60 * 60)
		{
			hours = Math.floor(seconds / (60 * 60));

			result  = hours + " " + GetHoursSpelling(hours);
		}
		else if(seconds < 30 * 24 * 60 * 60)
		{
			days = Math.floor(seconds / (24 * 60 * 60));


			result  = days + " " + GetDaysSpelling(days);
		}
		else if(seconds < 365 * 24 * 60 * 60)
		{
			months = Math.floor(seconds / (30 * 24 * 60 * 60));

			result  = months + " " + GetMonthsSpelling(months);
		}
		else
		{
			years = Math.floor(seconds / (365 * 24 * 60 * 60));
			months = Math.floor((seconds - years * 365 * 24 * 60 * 60) / (30 * 24 * 60 * 60));

			result  = years + " " + GetYearsSpelling(years) + (parseInt(months) ? " " + months + " " + GetMonthsSpelling(months) : "");
		}

		return result;
	};

	var	GetGenderedPhrase = function(object, commonPhrase, malePhrase, femalePhrase)
	{
		var		result = commonPhrase;
		var		temp;

		if((typeof(object.srcObj) != "undefined") && (typeof(object.srcObj.sex) != "undefined"))
			temp = object.srcObj.sex;
		else if(typeof(object.userSex) != "undefined")
			temp = object.userSex;
		else if(typeof(object.notificationFriendUserSex) != "undefined")
			temp = object.notificationFriendUserSex;

		if(temp == "male") result = malePhrase;
		else if(temp == "female") result = femalePhrase;

		return	result;
	};

	var GetGenderedActionCategoryTitle = function(feedItem)
	{
		if(feedItem.actionTypesId == "11")
		{
			// --- message write

			// --- fix category title for events
			if((typeof(feedItem.dstObj) == "object") && (typeof(feedItem.dstObj.type) == "string") && (feedItem.dstObj.type == "event"))
			{
				var	titleAddon = " во время события <a href=\"/event/" + feedItem.dstObj.link + "?rand=" + Math.random() * 234567890987 + "\">" + feedItem.dstObj.name + "</a>";

				feedItem.actionCategoryTitle += titleAddon;
				feedItem.actionCategoryTitleMale += titleAddon;
				feedItem.actionCategoryTitleFemale += titleAddon;
			}
		}

		return GetGenderedPhrase(feedItem, feedItem.actionCategoryTitle, feedItem.actionCategoryTitleMale, feedItem.actionCategoryTitleFemale);
	};

	var GetGenderedActionTypeTitle = function(feedItem)
	{
		return GetGenderedPhrase(feedItem, feedItem.actionTypesTitle, feedItem.actionTypesTitleMale, feedItem.actionTypesTitleFemale);
	};

	var SendEchoRequest = function()
	{
		$.getJSON(
			'/cgi-bin/system.cgi',
			{action:"EchoRequest"})
			.done(function(data)
				{
					if(data.type == "EchoResponse")
					{
						if(data.session == "true")
						{
							if(data.user == "true")
							{
								SetUserSignedin();

								if(firstRun)
								{
									// --- Check system notifications
									window.setTimeout(system_calls.GetUserRequestNotifications, 1200);

									// --- if any action has to be done after user sign-up
									// --- for example: user was invited to event, but not registered
									if($.cookie("initialactionid")) window.location.replace("/invite/" + $.cookie("initialactionid") + "?rand=" + system_calls.GetUUID());

									firstRun = false;
								}
							}
							else
							{
								// --- no need to redirect to public zone
								// --- this will brake Guest view of news_feed

								SetUserSignedout();
							}
						}
						else
						{

							SetUserSignedout();

							// --- Clear session must be here
							// --- Explanation:
							// ---		Once sessison timed out, EchoRequest will return "session" == false
							// ---		This mean that cookie and persistence must be cleared.
							// ---		Otherwise: double redirect to autologin
							// ---			Redirect to index.cgi/action=autologin will define that cookies are incorrect, expire cookie and redirect to autologin again
							ClearSession();
							GetIntoPublicZone();
						}
					}
				}
			);

		// --- check session expiration once per minute
		window.setTimeout(SendEchoRequest, (FREQUENCY_ECHO_REQUEST + (Math.random() * FREQUENCY_RANDOM_FACTOR - FREQUENCY_RANDOM_FACTOR / 2)) * 1000);
	};


	var GetUserRequestNotifications = function()
	{
		if(isUserSignedin())
		{
			$.getJSON(
				'/cgi-bin/system.cgi',
				{action:"GetUserRequestNotifications"})
				.done(function(data)
					{
						if(data.type == "UnreadUserNotifications")
						{
							if(data.session == "true")
							{
								if(data.user == "true")
								{
									{
										var	badgeSpan = $("<span/>").addClass("badge")
																	.addClass("badge-danger");

										if(data.friendshipNotificationsArray.length > 0)
										{
											badgeSpan.append(data.friendshipNotificationsArray.length);
										}

										$("#user-requests-ahref .badge").remove();
										$("#user-requests-ahref").append(badgeSpan);
									}

									navMenu_userNotification.InitilizeData(data.userNotificationsArray);
									navMenu_userNotification.BuildUserNotificationList();

									userRequestList = data;

									window.setTimeout(BuildUserRequestList, 1000);
								}
								else
								{
									console.error("system_calls.GetUserRequestNotifications: DoneHandler: ERROR: guest user");
								}
							}
							else
							{
								console.error("system_calls.GetUserRequestNotifications: DoneHandler: ERROR: session does not exists on server, session must be deleted, parent window must be redirected");

								ClearSession();
								GetIntoPublicZone();
							}
						}
					}
				);

		} // --- if(isUserSignedin())
		else
		{
			// --- user not signed in (no need to check notifications)
		}

		// --- check system notifications
		// --- add random +-5 sec
		window.setTimeout(system_calls.GetUserRequestNotifications, (FREQUENCY_USRENOTIFICATION_REQUEST + (Math.random() * FREQUENCY_RANDOM_FACTOR - FREQUENCY_RANDOM_FACTOR / 2)) * 1000);

		// console.debug('system_calls.GetUserRequestNotifications: end');
	};


	var BuildUserRequestList = function()
	{
		var		resultDOM = $();
		var		userCounter = 0;

		var CutUserName19Symbols = function(userName)
		{
		 	if(userName.length > 19)
		 	{
		 		return userName.substr(0, 19) + "...";
		 	}

		 	return userName;
		};

		userRequestList.friendshipNotificationsArray.forEach(
			function(item, i, arr)
			{

				$.getJSON
				(
					'/cgi-bin/system.cgi',
					{ action: 'GetUserInfo', userID: item.friendID }
				)
				.done(
					function(result)
					{
						var		userInfo = result.userArray[0];
						var		userSpan = $("<span/>").addClass("RequestUserListSpan");
						var		buttonSpan = $("<span/>");
						var		liUser = $("<li/>").addClass("dropdown-menu-li-higher");
						var		liDivider = $("<li/>").addClass("divider");
						var		buttonAccept = $("<button>").addClass("btn btn-primary")
															.append("Принять")
															.data("action", "confirm");
						var		buttonReject = $("<button>").addClass("btn btn-default")
															.append("Отказаться")
															.data("action", "disconnect");
						var		canvasAvatar = $("<canvas/>")	.attr("width", "30")
																.attr("height", "30")
																.addClass('canvas-big-avatar')
																.addClass("RequestUserListOverrideCanvasSize");

						// --- update cache with this user
						userCache.UpdateWithUser(userInfo);

						// --- use the global counter due to getJSON may be returned not in right order
						// --- firstly for user #2
						// --- secondly for user #1
						userCounter++;

						Object.keys(userInfo).forEach(function(itemChild, i, arr) {
							buttonReject.data(itemChild, userInfo[itemChild]);
							buttonAccept.data(itemChild, userInfo[itemChild]);
						});

						buttonReject.on("click", FriendshipButtonClickHandler);
						buttonAccept.on("click", FriendshipButtonClickHandler);


						resultDOM = resultDOM.add(liUser);

						var hrefTemp = $("<a/>").attr("href", "/userprofile/" + userInfo.id)
												.addClass("RequestUserListHrefLineHeigh")
												.append(CutUserName19Symbols(userInfo.name + " " + userInfo.nameLast));
						userSpan.append(canvasAvatar)
								.append(hrefTemp)
								.append(buttonSpan);
						buttonSpan
								.append(buttonAccept)
								.append(" ")
								.append(buttonReject);

						DrawUserAvatar(canvasAvatar[0].getContext("2d"), userInfo.avatar, userInfo.name, userInfo.nameLast);

						liUser.append(userSpan);

						if(userCounter < arr.length)
						{
							resultDOM = resultDOM.add(liDivider);
						}

						if(userCounter == arr.length)
						{
							$("#user-requests-ul").empty()
													.append(resultDOM);
						}

					}
				);


			}
		); // --- data.notofocationsArray.forEach()
	};

	var	ScrollWindowToElementID = function(elementID)
	{
		if($(elementID).length)
		{
			var	elementOffset 			= $(elementID).position().top;
			var	elementClientHeight 	= $(elementID)[0].clientHeight;
			var	windowScrollTop			= $(window).scrollTop();
			var	windowHeight			= $(window).height();

			console.debug("ScrollWindowToElementID: prevOffset[" + globalScrollPrevOffset + "] == scroll len to elem = " + (elementOffset - windowScrollTop));

			// --- scroll only if
			// --- 1) scroll length to element > 10
			// --- 2) scroll from previous to current cycles is successfull (page was scrolled)
			// if((Math.abs(elementOffset - windowScrollTop) > 10) && (!globalScrollPrevOffset || (globalScrollPrevOffset > Math.abs(elementOffset - windowScrollTop))))
			if((Math.abs(elementOffset - windowScrollTop) > 10) && (globalScrollPrevOffset != (elementOffset - windowScrollTop)))
			{
				globalScrollPrevOffset = elementOffset - windowScrollTop;

				$('body').animate({scrollTop: elementOffset }, 400);
				$('html').animate({scrollTop: elementOffset }, 400);

				setTimeout(function() { ScrollWindowToElementID(elementID); }, 600);
			}
			else
			{
				globalScrollPrevOffset = 0;
			}
		}
	};

	var	ScrollToAndHighlight = function(scrollTo_elementID, highlight_elementID)
	{
		if($(scrollTo_elementID).length)
		{
			if($(highlight_elementID).length) {}
			else { highlight_elementID = scrollTo_elementID; }

			setTimeout(function() { $(highlight_elementID).addClass("highlight_with_marker"); }, 250);
			setTimeout(function() { $(highlight_elementID).removeClass("highlight_with_marker"); }, 2500);

			ScrollWindowToElementID(scrollTo_elementID);
		}
	};

	var	GetParamFromURL = function(paramName)
	{
		var result = "";
		var	tmp = new RegExp('[\?&]' + paramName + '=([^&#]*)').exec(window.location.href);

		if(tmp && tmp.length) result = tmp[1];

		return result;
	};

	// --- build "management" buttons and put it into DOM-model
	// --- input
	// ---		companyInfo - info from GetUserListInJSONFormat
	// ---		housingTag - tag where buttons have to be placed to
	var RenderCompanyManagementButton = function(companyInfo, housingTag, callbackFunc)
	{
		var		buttonCompany1;

		buttonCompany1 = $("<button/>").data("action", "");
		Object.keys(companyInfo).forEach(function(itemChild, i, arr) {
			buttonCompany1.data(itemChild, companyInfo[itemChild]);
		});

		if(companyInfo.isMine == "1")
		{
			buttonCompany1.append($("<span>").addClass("glyphicon glyphicon-pencil"))
							.removeClass()
							.addClass("btn btn-primary form-control")
							.data("action", "companyProfileEdit")
							.attr("title", "Редактировать")
							.tooltip({ animation: "animated bounceIn", placement: "top" });
		}
		else if(companyInfo.isFree == "1")
		{
			buttonCompany1.append($("<span>").addClass("glyphicon glyphicon-plus"))
							.removeClass()
							.addClass("btn btn-success form-control")
							.data("action", "companyProfileTakeOwnership")
							.attr("data-loading-text", "<span class='fa fa-refresh fa-spin fa-fw animateClass'></span>")
							.attr("title", "Моя компания !")
							.attr("data-target", "#PosessionAlertModal")
							.attr("data-toggle", "modal")
							.tooltip({ animation: "animated bounceIn", placement: "top" });
		}
		else
		{
			buttonCompany1.append($("<span>").addClass("glyphicon glyphicon-question-sign"))
							.removeClass()
							.addClass("btn btn-danger form-control")
							.data("action", "companyProfileRequestOwnership")
							.attr("title", "Отправить запрос")
							.attr("data-target", "#PosessionRequestModal")
							.attr("data-toggle", "modal")
							.tooltip({ animation: "animated bounceIn", placement: "top" });
		}

		buttonCompany1.on("click", callbackFunc);

		housingTag.append(buttonCompany1);
	}; // --- RenderFriendshipButtons

	var	amIMeetingHost = function(eventInfo)
	{
		var		myUserID = $("#myUserID").data("myuserid");
		var		result = false;

		if((typeof(myUserID) == "number") && myUserID)
		{
			eventInfo.hosts.forEach(function(item)
				{
					if(item.user_id == myUserID) result = true;
				});
		}

		return	result;
	};

	// --- build "management" buttons and put it into DOM-model
	// --- input
	// ---		eventInfo - info from GetUserListInJSONFormat
	// ---		housingTag - tag where buttons have to be placed to
	var RenderEventManagementButton = function(eventInfo, housingTag, callbackFunc)
	{
		var		buttonEvent1;

		buttonEvent1 = $("<button/>").data("action", "");
		Object.keys(eventInfo).forEach(function(itemChild, i, arr) {
			buttonEvent1.data(itemChild, eventInfo[itemChild]);
		});

		if(amIMeetingHost(eventInfo))
		{
			buttonEvent1.append($("<span>").addClass("glyphicon glyphicon-pencil"))
							.removeClass()
							.addClass("btn btn-primary form-control")
							.data("action", "eventProfileEdit")
							.attr("title", "Редактировать")
							.tooltip({ animation: "animated bounceIn", placement: "top" });

			buttonEvent1.on("click", callbackFunc);

			housingTag.append(buttonEvent1);
		}

	}; // --- RenderFriendshipButtons

	// --- build "management" buttons and put it into DOM-model
	// --- input
	// ---		groupInfo - info from GetUserListInJSONFormat
	// ---		housingTag - tag where buttons have to be placed to
	var RenderGroupManagementButton = function(groupInfo, housingTag, callbackFunc)
	{
		var		buttonGroup1;

		buttonGroup1 = $("<button/>").data("action", "");
		Object.keys(groupInfo).forEach(function(itemChild, i, arr) {
			buttonGroup1.data(itemChild, groupInfo[itemChild]);
		});

		if(groupInfo.isMine == "1")
		{
			buttonGroup1.append($("<span>").addClass("glyphicon glyphicon-pencil"))
							.removeClass()
							.addClass("btn btn-primary form-control")
							.data("action", "groupProfileEdit")
							.attr("title", "Редактировать")
							.tooltip({ animation: "animated bounceIn", placement: "top" });

			buttonGroup1.on("click", callbackFunc);

			housingTag.append(buttonGroup1);
		}

	}; // --- RenderFriendshipButtons

	// --- input:
	//            callbackFunc - function called on click event
	var	BuildCompanySingleBlock = function(item, i, arr, callbackFunc)
	{
		var 	divContainer, divRow, divColLogo, tagA3, tagImg3, divInfo, tagA5, spanSMButton, tagCanvas3, tagUl5;
		var		tagButtonFriend1;
		var		tagButtonFriend2;
		var		divRowXSButtons, divColXSButtons;

		divContainer= $("<div/>").addClass("container");
		divRow 		= $("<div/>").addClass("row container");
		divColLogo 	= $("<div/>").addClass("col-lg-1 col-md-1 col-sm-2 hidden-xs margin_top_bottom_15_0");
		tagA3   	= $("<a>").attr("href", "/company/" + item.link + "?rand=" + Math.random() * 1234567890);
		// tagImg3 	= $("<img>").attr("src", item["avatar"])
		//                         .attr("height", "80");
		tagCanvas3	= $("<canvas>").attr("width", "80")
									.attr("height", "80")
									.addClass('canvas-big-logo');
		divInfo 		= $("<div/>").addClass("col-sm-10 col-xs-12 single_block box-shadow--6dp");
		tagA5   		= $("<a>").attr("href", "/company/" + item.link + "?rand=" + Math.random() * 1234567890);
		spanSMButton	= $("<span>").addClass("hidden-xs pull-right");
		divRowXSButtons = $("<div>").addClass("row");
		divColXSButtons = $("<div>").addClass("col-xs-12 visible-xs-inline margin_top_bottom_0_15");

		RenderCompanyManagementButton(item, spanSMButton, callbackFunc);
		RenderCompanyManagementButton(item, divColXSButtons, callbackFunc);

		divContainer.append(divRow)
					.append(divRowXSButtons.append(divColXSButtons));
		divRow 		.append(divColLogo)
				    .append(divInfo);
		divColLogo	.append(tagA3);
		tagA3		.append(tagImg3);
		tagA3		.append(tagCanvas3);
		divInfo		.append(spanSMButton);
		divInfo		.append(tagA5);
		tagA5		.append("<span><h4>" + item.name + "</h4></span>");
		// --- OOO Cisco Systems vs Cisco Systems
		// tagA5		.append("<span><h4>" + item.type + " " + item.name + "</h4></span>");

		RenderCompanyLogo(tagCanvas3[0].getContext("2d"), (item.logo_filename.length ? "/images/companies/" + item.logo_folder + "/" + item.logo_filename : ""), item.name, "");

		return divContainer;
	};

	// --- input:
	//            callbackFunc - function called on click event
	var	BuildEventSingleBlock = function(item, i, arr, callbackFunc)
	{
		var		container, divRow, divColLogo, tagCanvasLink, tagImg3, divInfo, tagA5, spanSMButton, tagCanvas3, tagUl5;
		var		tagButtonFriend1;
		var		tagButtonFriend2;
		var		divRowXSButtons, divColXSButtons;

		container	= $("");
		divRow		= $("<div/>").addClass("row");
		divColLogo	= $("<div/>").addClass("col-lg-1 col-md-1 col-sm-2 hidden-xs margin_top_bottom_15_0");
		tagCanvasLink		= $("<a>").attr("href", "/event/" + item.link + "?rand=" + GetUUID());
		// tagImg3 	= $("<img>").attr("src", item["avatar"])
		//                         .attr("height", "80");
		tagCanvas3	= $("<canvas>").attr("width", "80")
									.attr("height", "80")
									.addClass('canvas-big-logo');
		divInfo 		= $("<div/>").addClass("col-sm-10 col-xs-12 single_block box-shadow--6dp");
		tagA5   		= $("<a>").attr("href", "/event/" + item.link + "?rand=" + GetUUID());
		spanSMButton	= $("<span>").addClass("hidden-xs pull-right");
		divRowXSButtons = $("<div>").addClass("row");
		divColXSButtons = $("<div>").addClass("col-xs-12 visible-xs-inline margin_top_bottom_0_15");

		if(typeof(callbackFunc) == "function")
		{
			RenderEventManagementButton(item, spanSMButton, callbackFunc);
			RenderEventManagementButton(item, divColXSButtons, callbackFunc);
		}

		container = container	.add(divRow)
								.add(divRowXSButtons.append(divColXSButtons));
		divRow 		.append(divColLogo)
				    .append(divInfo);
		divColLogo	.append(tagCanvasLink);
		// tagCanvasLink.append(tagImg3);

		if(item.isBlocked == "Y")
		{
			var		fa_stack_lock = $("<span>")	.addClass("fa-stack fa-lg")
												.append($("<i>").addClass("fa fa-circle-o fa-stack-2x fa-inverse"))
												.append($("<i>").addClass("fa fa-lock fa-stack-1x fa-inverse"));

			tagCanvasLink.append(
				$("<div>")	.addClass("blockedevent")
							.append(tagCanvas3)
							.append($("<div>").append(fa_stack_lock))
			);
		}
		else
		{
			tagCanvasLink.append(tagCanvas3);
		}

		divInfo		.append(spanSMButton);
		divInfo		.append(tagA5)
					.append("<div>" + item.address + "</div>");
		tagA5		.append("<span class=\"h4\">" + item.title + " <small> " + GetLocalizedDateTimeFromSeconds(item.startTimestamp) + "</small></span> ");

		RenderCompanyLogo(tagCanvas3[0].getContext("2d"), (item.logo_filename.length ? "/images/events/" + item.logo_folder + "/" + item.logo_filename : ""), item.title, "");

		return container;
	};


	// --- input:
	//            callbackFunc - function called on click event
	var	BuildGroupSingleBlock = function(item, i, arr, callbackFunc)
	{
		var 	divContainer, divRow, divColLogo, tagA3, tagImg3, divInfo, tagA5, spanSMButton, tagCanvas3, tagUl5;
		var		tagButtonFriend1;
		var		tagButtonFriend2;
		var		divRowXSButtons, divColXSButtons;

		divContainer= $("<div/>").addClass("container");
		divRow 		= $("<div/>").addClass("row");
		divColLogo 	= $("<div/>").addClass("col-lg-1 col-md-1 col-sm-2 hidden-xs margin_top_bottom_15_0");
		tagA3   	= $("<a>").attr("href", "/group/" + item.link + "?rand=" + GetUUID());
		// tagImg3 	= $("<img>").attr("src", item["avatar"])
		//                         .attr("height", "80");
		tagCanvas3	= $("<canvas>").attr("width", "80")
									.attr("height", "80")
									.addClass('canvas-big-logo');
		divInfo 		= $("<div/>").addClass("col-sm-10 col-xs-12 single_block box-shadow--6dp");
		tagA5   		= $("<a>").attr("href", "/group/" + item.link + "?rand=" + GetUUID());
		spanSMButton	= $("<span>").addClass("hidden-xs pull-right");
		divRowXSButtons = $("<div>").addClass("row");
		divColXSButtons = $("<div>").addClass("col-xs-12 visible-xs-inline margin_top_bottom_0_15");

		RenderGroupManagementButton(item, spanSMButton, callbackFunc);
		RenderGroupManagementButton(item, divColXSButtons, callbackFunc);

		divContainer.append(divRow)
					.append(divRowXSButtons.append(divColXSButtons));
		divRow 		.append(divColLogo)
				    .append(divInfo);
		divColLogo	.append(tagA3);
		tagA3		.append(tagImg3);
		tagA3		.append(tagCanvas3);
		divInfo		.append(spanSMButton);
		divInfo		.append(tagA5);
		tagA5		.append("<span><h4>" + item.title + "</h4></span>");

		RenderCompanyLogo(tagCanvas3[0].getContext("2d"), (item.logo_filename.length ? "/images/groups/" + item.logo_folder + "/" + item.logo_filename : ""), item.title, "");

		return divContainer;
	};

	// --- build "frindship" buttons and put them into DOM-model
	// --- input
	// ---		friendInfo - info from GetUserListInJSONFormat
	// ---		housingTag - tag where buttons have to be placed to
	var RenderFriendshipButtons = function(friendInfo, housingTag)
	{
		if(isUserSignedin())
		{
			var		tagButtonFriend1, tagButtonFriend2;

			tagButtonFriend1 = $("<button/>").data("action", "");
			tagButtonFriend2 = $("<button/>").data("action", "");
			Object.keys(friendInfo).forEach(function(itemChild, i, arr) {
				tagButtonFriend1.data(itemChild, friendInfo[itemChild]);
				tagButtonFriend2.data(itemChild, friendInfo[itemChild]);
			});
			if(friendInfo.userFriendship == "empty")
			{
				tagButtonFriend1.append("Добавить в друзья")
								.removeClass()
								.addClass("btn btn-primary form-control friendshipButton")
								.data("action", "requested");
			}
			else if(friendInfo.userFriendship == "confirmed")
			{
				tagButtonFriend1.addClass("btn btn-default form-control friendshipButton")
								.append("Удалить из друзей")
								.data("action", "disconnectDialog");
			}
			else if(friendInfo.userFriendship == "requested")
			{
				tagButtonFriend1.addClass("btn btn-primary friendshipButton")
								.append("Подтвердить")
								.data("action", "confirm");
				tagButtonFriend2.addClass("btn btn-default friendshipButton")
								.append("Отказаться")
								.data("action", "disconnect");
			}
			else if(friendInfo.userFriendship == "requesting")
			{
				tagButtonFriend1.append("Отменить запрос дружбы")
								.removeClass()
								.addClass("btn btn-default form-control friendshipButton")
								.data("action", "disconnect");
			}
			else if(friendInfo.userFriendship == "blocked")
			{
				tagButtonFriend1.addClass("btn btn-default form-control friendshipButton")
								.append("Снять блокировку")
								.data("action", "disconnect");
			}
			else if(friendInfo.userFriendship == "ignored")
			{
				tagButtonFriend1.addClass("btn btn-default form-control friendshipButton")
								.append("Игнорируется")
								.data("action", "requested");
			}
			else
			{
				tagButtonFriend1.addClass("btn btn-primary form-control friendshipButton")
								.append("Добавить в друзья")
								.data("action", "requested");
				console.error("BuildFoundFriendSingleBlock: ERROR: unknown friendship status [" + item.userFriendship + "]");
			}

			tagButtonFriend1.on("click", FriendshipButtonClickHandler);
			tagButtonFriend2.on("click", FriendshipButtonClickHandler);

			housingTag.append(tagButtonFriend1);
			if(tagButtonFriend2.data("action").length > 0)
			{
				housingTag.append(" ")
						.append(tagButtonFriend2);
			}
		}

	}; // --- RenderFriendshipButtons

	var FriendshipButtonClickHandler = function(e)
	{
		var		handlerButton = $(this);

		if(handlerButton.data("action") == "disconnectDialog")
		{
			$("#ButtonFriendshipRemovalYes").data("clickedButton", handlerButton);
			$("#DialogFriendshipRemovalYesNo").modal('show');
		}
		else
		{
			handlerButton.addClass("disabled");
			handlerButton.text("Ожидайте ...");

			$.getJSON(
				'/cgi-bin/index.cgi',
				{action:"AJAX_setFindFriend_FriendshipStatus", friendID:handlerButton.data("id"), status:handlerButton.data("action")})
				.done(function(data) {
						console.debug("AJAX_setFindFriend_FriendshipStatus.done(): sucess");

						if(data.result == "ok")
						{
							console.debug("AJAX_setFindFriend_FriendshipStatus.done(): success");

							handlerButton.removeClass("disabled");
							if(handlerButton.data("action") == "requested")
							{
								handlerButton.text("Отменить запрос дружбы");
								handlerButton.removeClass().addClass("btn").addClass("btn-default");
								handlerButton.data("action", "disconnect");
							}
							else if(handlerButton.data("action") == "requesting")
							{
								handlerButton.text("Добавить в друзья");
								handlerButton.removeClass().addClass("btn").addClass("btn-primary");
								handlerButton.data("action", "requested");
							}
							else if(handlerButton.data("action") == "disconnect")
							{
								handlerButton.text("Добавить в друзья");
								handlerButton.removeClass().addClass("btn").addClass("btn-primary");
								handlerButton.data("action", "requested");

								// --- remove "accept" buttonAccept
								handlerButton.siblings().remove();
							}
							else if(handlerButton.data("action") == "confirm")
							{
								handlerButton.text("Убрать из друзей");
								handlerButton.removeClass().addClass("btn").addClass("btn-default");
								handlerButton.data("action", "disconnect");

								// --- remove "reject" buttonAccept
								handlerButton.siblings().remove();
							}
							else
							{
								console.debug("AJAX_setFindFriend_FriendshipStatus.done(): unknown friendship status button");
								handlerButton.text("Добавить в друзья");
								handlerButton.removeClass().addClass("btn").addClass("btn-primary");
								handlerButton.data("action", "requested");
							}


						}
						else
						{
							console.debug("AJAX_setFindFriend_FriendshipStatus.done(): " + data.result + " [" + data.description + "]");

							handlerButton.text("Ошибка");
							handlerButton.removeClass("btn-default")
										 .removeClass("btn-primary")
										 .addClass("btn-danger", 300);

							console.debug("AJAX_setFindFriend_FriendshipStatus.done(): need to notify the Requester");
						}

					}); // --- getJSON.done()
		}
	};

	// --- private function
	// --- build "chat" buttons and put them into DOM-model
	// --- input
	// ---		friendInfo - info from GetUserListInJSONFormat
	// ---		housingTag - tag where buttons have to be placed to
	var RenderChatButton = function(friendInfo, housingTag)
	{
		// var		buttonChat = $("<button>").append($("<img>").attr("src", "/images/pages/common/chat.png").addClass("width_18"))
		var		buttonChat = $("<button>").append($("<span>").addClass("fa fa-comment-o fa-lg width_18"))
											.addClass("btn btn-primary");

		Object.keys(friendInfo).forEach(function(itemChild, i, arr) {
			buttonChat.data(itemChild, friendInfo[itemChild]);
		});

		buttonChat.on("click", function() {
			window.location.href = "/chat/" + $(this).data("id") + "?rand=" + Math.floor(Math.random() * 1000000000);
		});

		housingTag.append(buttonChat);
	};

	var GlobalBuildFoundFriendSingleBlock = function(item, i, arr)
	{
		var 	tagDiv1, tagDiv2, tagDiv3, tagA3, tagImg3, tagDiv4, tagA5, tagSpan5, tagCanvas3, tagCity;
		var		tagButtonFriend1;
		var		tagButtonFriend2;
		var		tagDivButtons;

		tagDiv1 	= $("<div/>").addClass("container");
		tagDiv2 	= $("<div/>").addClass("row container");
		tagDiv3 	= $("<div/>").addClass("col-lg-1 col-md-1 col-sm-2 col-xs-3 margin_top_bottom_15_0");
		tagA3   	= $("<a>").attr("href", "/userprofile/" + item.id + "?rand=" + Math.random() * 234567890);
		// tagImg3 	= $("<img>").attr("src", item["avatar"])
		//                         .attr("height", "80");
		tagCanvas3	= $("<canvas>").attr("width", "80")
									.attr("height", "80")
									.addClass('canvas-big-avatar');
		tagDiv4 	= $("<div/>").addClass("col-md-10 col-xs-12  single_block box-shadow--6dp");
		tagA5   	= $("<a>").attr("href", "/userprofile/" + item.id + "?rand=" + Math.random() * 234567890);
		tagSpan5	= $("<span>").addClass("hidden-xs float_right");
		tagCity		= item.currentCity;
		tagDivButtons = $("<div>").addClass("col-xs-9 visible-xs-inline margin_top_bottom_15_0");

		RenderFriendshipButtons(item, tagSpan5);
		RenderFriendshipButtons(item, tagDivButtons);
		// RenderChatButton(item, tagSpan5);
		// RenderChatButton(item, tagDivButtons);

		tagDiv1.append(tagDiv2);
		tagDiv2 .append(tagDiv3)
				.append(tagDivButtons)
			    .append(tagDiv4);
		tagDiv3.append(tagA3);
		tagA3.append(tagImg3);
		tagA3.append(tagCanvas3);
		tagDiv4.append(tagSpan5);
		tagDiv4.append(tagA5);
		tagA5.append("<span><h4>" + item.name + " " + item.nameLast + "</h4></span>");

		tagDiv4.append(tagCity);

/*
		item.currentEmployment.forEach(function(item)
			{
				tagUl5.append("<dt>" + item.company + "</dt>");
				tagUl5.append("<dd>" + item.title + "</dd>");
			});
*/
		DrawUserAvatar(tagCanvas3[0].getContext("2d"), item.avatar, item.name, item.nameLast);

		return tagDiv1;
	};

	var DrawCompanyImage = function(context, imageURL, avatarSize)
	{

		var x1 = 0, x2 = avatarSize, y1 = 0, y2 = avatarSize, radius = avatarSize / 8;
		var		pic = new Image();

		pic.onload = function() {
			// var		sMaxEdge = Math.max(pic.width, pic.height);
			// var		sX = (pic.width - sMaxEdge) / 2, sY = (pic.height - sMaxEdge) / 2, sWidth = sMaxEdge, sHeight = sMaxEdge;
			// var		dX = 0, dY = 0, dWidth = avatarSize, dHeight = avatarSize;

			var		canvasW = avatarSize, canvasH = avatarSize;
			var		sWidth = pic.width, sHeight = pic.height;
			var		ratioW = canvasW/sWidth, ratioH = canvasH/sHeight;
			var		minRatio = Math.min(ratioW, ratioH);
			var		dWidth = sWidth*minRatio, dHeight = sHeight*minRatio;
			var		dX = (canvasW - dWidth)/2, dY = (canvasH - dHeight)/2;

			context.clearRect(0,0,avatarSize,avatarSize);
			// context.save();
			context.beginPath();
			context.moveTo(radius, 0);
			context.lineTo(x2 - radius, 0);
			context.quadraticCurveTo(x2,0, x2,radius);
			context.lineTo(x2, y2 - radius);
			context.quadraticCurveTo(x2,y2, x2-radius,y2);
			context.lineTo(radius, y2);
			context.quadraticCurveTo(0,y2, 0,y2-radius);
			context.lineTo(0, radius);
			context.quadraticCurveTo(0,0, radius,0);

			context.drawImage(pic, 0, 0, sWidth, sHeight, dX, dY, dWidth, dHeight);
			// context.restore();
		};
		pic.src = imageURL;
	};

	var RenderCompanyLogo = function(canvas, logoPath, company_name, not_used_param)
	{

		if((logoPath == "empty") || (logoPath === ""))
		{
			// --- canvas.canvas.width returning width of canvas
			DrawTextLogo(canvas, GetCompanyInitials(company_name), canvas.canvas.width);
		}
		else
		{
			DrawCompanyImage(canvas, logoPath, canvas.canvas.width);
		}
	};
	// --- avatar part end

	// --- rating rendering
	// --- input:
	// ---			additionalClass - could be used to find all ratings for the same entity
	// ---			initValue - currently selected element
	// ---			callBack - function to call after change rating
	// --- output: DOMmodel
	var	RenderRating = function(additionalClass, initValue, callbackFunc)
	{
		var		RatingSelectionItem = function(e)
		{
			var		currTag = $(this);
			var		currRating = currTag.data("rating");

			callbackFunc(currRating);
		};

		var		uniqueID = "";

		do
		{
			uniqueID = Math.floor(Math.random() * 100000000);
		} while($("div#rating" + uniqueID).length);


		var		bookRating = $("<div>").addClass("rating")
									.addClass(additionalClass)
									.attr("id", "rating" + uniqueID);
		var		star5 = $("<input>").attr("type", "radio")
									.attr("id", "rating_5_" + uniqueID)
									.attr("data-rating", "5")
									.on("click", RatingSelectionItem)
									.attr("name", "rating" + uniqueID);
		var		star4 = $("<input>").attr("type", "radio")
									.attr("id", "rating_4_" + uniqueID)
									.attr("data-rating", "4")
									.on("click", RatingSelectionItem)
									.attr("name", "rating" + uniqueID);
		var		star3 = $("<input>").attr("type", "radio")
									.attr("id", "rating_3_" + uniqueID)
									.attr("data-rating", "3")
									.on("click", RatingSelectionItem)
									.attr("name", "rating" + uniqueID);
		var		star2 = $("<input>").attr("type", "radio")
									.attr("id", "rating_2_" + uniqueID)
									.attr("data-rating", "2")
									.on("click", RatingSelectionItem)
									.attr("name", "rating" + uniqueID);
		var		star1 = $("<input>").attr("type", "radio")
									.attr("id", "rating_1_" + uniqueID)
									.attr("data-rating", "1")
									.on("click", RatingSelectionItem)
									.attr("name", "rating" + uniqueID);
		var		label5 = $("<label>").attr("for", "rating_5_" + uniqueID)
									.attr("title", "супер !")
									.tooltip({ animation: "animated bounceIn", placement: "top" });
		var		label4 = $("<label>").attr("for", "rating_4_" + uniqueID);
		var		label3 = $("<label>").attr("for", "rating_3_" + uniqueID);
		var		label2 = $("<label>").attr("for", "rating_2_" + uniqueID);
		var		label1 = $("<label>").attr("for", "rating_1_" + uniqueID)
									.attr("title", "не понравилось")
									.tooltip({ animation: "animated bounceIn", placement: "top" });


		bookRating	.append(star5).append(label5)
					.append(star4).append(label4)
					.append(star3).append(label3)
					.append(star2).append(label2)
					.append(star1).append(label1);

		if(initValue == 1) star1.attr("checked", true);
		if(initValue == 2) star2.attr("checked", true);
		if(initValue == 3) star3.attr("checked", true);
		if(initValue == 4) star4.attr("checked", true);
		if(initValue == 5) star5.attr("checked", true);

		return bookRating;
	};

	// --- start avatar piece
	var	DrawCompanyLogoAvatar = function(context, imageURL, avatarSize)
	{

		var x1 = 0, x2 = avatarSize, y1 = 0, y2 = avatarSize, radius = avatarSize / 8;
		var		pic = new Image();

		pic.src = imageURL;
		pic.onload = function() {
			var		sMaxEdge = Math.max(pic.width, pic.height);
			var		scale = sMaxEdge / avatarSize;
			var		dWidth = pic.width / scale;
			var		dHeight = pic.height / scale;

			context.clearRect(0,0,avatarSize,avatarSize);
			context.save();
			context.beginPath();
			// --- company logo should not have rounded corners
	/*
			context.moveTo(radius, 0);
			context.lineTo(x2 - radius, 0);
			context.quadraticCurveTo(x2,0, x2,radius);
			context.lineTo(x2, y2 - radius);
			context.quadraticCurveTo(x2,y2, x2-radius,y2);
			context.lineTo(radius, y2);
			context.quadraticCurveTo(0,y2, 0,y2-radius);
			context.lineTo(0, radius);
			context.quadraticCurveTo(0,0, radius,0);
			context.clip();
	*/
			// context.drawImage(pic, (pic.width - sMaxEdge) / 2, (pic.height - sMaxEdge) / 2, sMaxEdge, sMaxEdge, 0, 0, avatarSize, avatarSize);
			context.drawImage(pic, 0, 0, pic.width, pic.height, (avatarSize - dWidth) / 2, (avatarSize - dHeight) / 2, dWidth, dHeight);
			context.restore();
		};
	};

	var DrawPictureAvatar = function(context, imageURL, avatarSize)
	{

		var x1 = 0, x2 = avatarSize, y1 = 0, y2 = avatarSize, radius = avatarSize / 8;
		var		pic = new Image();

		pic.src = imageURL;
		pic.onload = function() {
			var		sMinEdge = Math.min(pic.width, pic.height);


			context.clearRect(0,0,avatarSize,avatarSize);
			context.save();
			context.beginPath();
			context.moveTo(radius, 0);
			context.lineTo(x2 - radius, 0);
			context.quadraticCurveTo(x2,0, x2,radius);
			context.lineTo(x2, y2 - radius);
			context.quadraticCurveTo(x2,y2, x2-radius,y2);
			context.lineTo(radius, y2);
			context.quadraticCurveTo(0,y2, 0,y2-radius);
			context.lineTo(0, radius);
			context.quadraticCurveTo(0,0, radius,0);
			context.clip();

			context.drawImage(pic, (pic.width - sMinEdge) / 2, (pic.height - sMinEdge) / 2, sMinEdge, sMinEdge, 0, 0, avatarSize, avatarSize);
			context.restore();
		};
	};

	var DrawTextLogo = function(context, company_initials, size)
	{
		var		avatarSize = size;

		context.clearRect(0, 0, avatarSize, avatarSize);

		context.beginPath();
		context.rect(0, 0, avatarSize, avatarSize);
		context.closePath();
		context.fillStyle = "grey";
		context.fill();

		context.font = "normal "+avatarSize*3/8+"pt Calibri";
		context.textAlign = "center";
		context.fillStyle = "white";
		context.fillText(company_initials, avatarSize/2,avatarSize*21/32);
	};

	var DrawTextAvatar = function(context, userInitials, size)
	{
		var		avatarSize = size;

		context.clearRect(0, 0, avatarSize, avatarSize);

		context.beginPath();
		context.arc(avatarSize/2,avatarSize/2, avatarSize/2, 0,2*Math.PI);
		context.closePath();
		context.fillStyle = "grey";
		context.fill();

		context.font = "normal "+avatarSize*3/8+"pt Calibri";
		context.textAlign = "center";
		context.fillStyle = "white";
		context.fillText(userInitials, avatarSize/2,avatarSize*21/32);
	};

	var GetUserInitials = function(firstName, lastName)
	{
		var	result = "";

		if(typeof(firstName) != "undefined")
		{
			firstName = firstName.trimStart().trimEnd();
			if(firstName.length > 0) { result += firstName[0]; }
		}
		if(typeof(lastName) != "undefined")
		{
			lastName = lastName.trimStart().trimEnd();
			if(lastName.length > 0) { result += lastName[0]; }
		}

		return result;
	};

	var GetCompanyInitials = function(company_name)
	{
		var		result = "";
		var		company_name_wo_type = company_name;
		var		word_arr = [];
		var		i, word;

		companyTypes.forEach(function(company_type) { company_name_wo_type = company_name_wo_type.replace(company_type + " ", ""); });
		company_name_wo_type.replace("\"", "");
		company_name_wo_type.replace("'", "");
		company_name_wo_type = company_name_wo_type.trimStart().trimEnd();

		word_arr = company_name_wo_type.split(" ");

		for(i = 0; (i < word_arr.length) && (result.length < 2); ++i)
		{
			word = word_arr[i];

			if(word && word.length) result += word[0];
		}

		for(i = 0; (i < word_arr.length) && (result.length < 2); ++i)
		{
			word = word_arr[i];

			if(word && (word.length > 1)) result += word[1];
		}

		return result;
	};
	// --- finish avatar piece

	var	GetPluralWordSpelling = function(__number, var1, var2, var3)
	{
		var result = "";

		if((typeof(__number) == "number") && __number)
		{
			__number = __number % 100;

			if(((__number % 10) == 1) && (Math.floor(__number / 10) != 1))
			{
				result = var1;
			}
			else if(((__number % 10) >= 1) && ((__number % 10) <= 4) && (Math.floor(__number / 10) != 1))
			{
				result = var2;
			}
			else
			{
				result = var3;
			}
		}

		return result;
	};

	var	GetSpelledKidsNumber = function(kidsNumber)
	{
		var		kidsText = "";

		if((typeof(kidsNumber) == "number") && kidsNumber)
		{
			if(((kidsNumber % 10) == 1) && (Math.floor(kidsNumber / 10) != 1))
			{
				kidsText += "ребенок";
			}
			else if(((kidsNumber % 10) <= 4) && (Math.floor(kidsNumber / 10) != 1))
			{
				kidsText += "ребенка";
			}
			else
			{
				kidsText += "детей";
			}
		}

		return kidsText;
	};

	var	GetSpelledAdultsNumber = function(adultsNumber)
	{
		var		adultsText = "";

		if((typeof(adultsNumber) == "number") && adultsNumber)
		{
			if(adultsNumber == 1)
			{
				adultsText = " взрослый";
			}
			else
			{
				adultsText = " взрослых";
			}
		}

		return adultsText;
	};

	var GetSpelledAdultsKidsNumber = function(adultsNumber, kidsNumber)
	{
		var		adultsText = GetSpelledAdultsNumber(adultsNumber);
		var		kidsText = GetSpelledKidsNumber(kidsNumber);


		return (adultsNumber  ? " +" + adultsNumber + adultsText : "") + (kidsNumber ? " +" + kidsNumber + " " + kidsText : "");
	};

	var	ReplaceTextLinkToURL = function(srcText)
	{
		// --- url is everything before space or HTML-tag (for example: <br>)
		var		urlRegEx = /(https?:\/\/[^\s<]+)/g;
		var		resultText;

		resultText = srcText.replace(urlRegEx, function(url) {
			var		urlText = url;

			if(url.length > 32) urlText = url.substring(0, 32) + " ...";

			return '<a href="' + url + '" target="blank">' + urlText + '</a>';
		});

		return resultText;
	};

	var LongestWord = function(text)
	{
		var	lenghtyWord = "";
		var	lenghtyWordIdx = 0;
		var	wordsArr;

		// --- remove www links
		text = text.replace(/https?:\/\/[^\s<]+/g, "");
		wordsArr = text.match(/[^\s]+/g) || [""];

		wordsArr.forEach(function (item, i, arr) { if(item.length >= lenghtyWord.length) { lenghtyWord = item; lenghtyWordIdx = i; } });

		return wordsArr[lenghtyWordIdx];
	};

	var LongestWordSize = function(text)
	{
		var	lenghtyWord = LongestWord(text);

		return lenghtyWord.length;
	};

	var	DataURItoBlob = function (dataURI)
	{
		// convert base64/URLEncoded data component to raw binary data held in a string
		var byteString;
		if (dataURI.split(',')[0].indexOf('base64') >= 0)
			byteString = atob(dataURI.split(',')[1]);
		else
			byteString = unescape(dataURI.split(',')[1]);

		// separate out the mime component
		var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

		// write the bytes of the string to a typed array
		var ia = new Uint8Array(byteString.length);
		for (var i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i);
		}

		return new Blob([ia], {type:mimeString});
	};

/*
	var	GetBlob_ScaledDownTo640x480 = function(originalImg)
	{
		var		tmpCanvas = document.createElement("canvas");
		var		tmpCanvasCtx = tmpCanvas.getContext("2d");
		var		imgFromCanvas = new Image();

		tmpCanvas.width = originalImg.naturalWidth;
		tmpCanvas.height = originalImg.naturalHeight;

		tmpCanvasCtx.drawImage(originalImg, 0, 0);

		imgFromCanvas = tmpCanvas.toDataURL("image/jpeg", 0.92);
		return DataURItoBlob(imgFromCanvas);
	};
*/

	var	isPdf = function (f_name)
	{
		var	f_ext = "";

		if(f_name) f_ext = f_name.substr(f_name.lastIndexOf(".") + 1);
		
		return (f_ext == "pdf");
	};


	// --- this function resizes canvas to keep shape of original picture
	var	DrawImgOnCanvas_ScaleImgDownTo640x480 = function(tmpCanvas, originalImg)
	{
		var		tmpCanvasCtx = tmpCanvas.getContext("2d");
		var		maxWidth = 640, maxHeight = 480;
		var		origWidth = originalImg.naturalWidth, origHeight = originalImg.naturalHeight;
		var		scaleW = maxWidth / origWidth, scaleH = maxHeight / origHeight;
		var		scale = Math.min(scaleW, scaleH);
		var		finalW, finalH;

		if(scale > 1) scale = 1;
		finalH = scale * origHeight;
		finalW = scale * origWidth;

		tmpCanvas.width = finalW;
		tmpCanvas.height = finalH;

		tmpCanvasCtx.drawImage(originalImg, 0, 0, origWidth, origHeight, 0, 0, finalW, finalH);
	};

	var	GetBlob_ScaledDownTo640x480 = function(originalImg)
	{
		var		tmpCanvas = document.createElement("canvas");
		var		imgFromCanvas = new Image();

		var		tmpCanvasCtx = tmpCanvas.getContext("2d");
		var		maxWidth = 640, maxHeight = 480;
		var		origWidth = originalImg.naturalWidth, origHeight = originalImg.naturalHeight;
		var		scaleW = maxWidth / origWidth, scaleH = maxHeight / origHeight;
		var		scale = Math.min(scaleW, scaleH);
		var		finalW, finalH;

		if(scale > 1) scale = 1;
		finalH = scale * origHeight;
		finalW = scale * origWidth;

		tmpCanvas.width = finalW;
		tmpCanvas.height = finalH;

		tmpCanvasCtx.drawImage(originalImg, 0, 0, origWidth, origHeight, 0, 0, finalW, finalH);

		imgFromCanvas = tmpCanvas.toDataURL("image/jpeg", 0.92);
		return DataURItoBlob(imgFromCanvas);
	};




	var	GetCurrentGridOption = function()
	{
		var winWidth =  $(window).width();
		var	result = "";

		if(winWidth < 768 ){
			result = "xs";
		}else if( winWidth <= 991){
			result = "sm";
		}else if( winWidth <= 1199){
			result = "md";
		}else{
			result = "lg";
		}

		return	result;
	};

	var	Position_InputHandler = function(e)
	{
		var	curr_tag = $(this);
		var	currentValue = curr_tag.val();

		if(currentValue.length)
		{
			$.getJSON(
				'/cgi-bin/ajax_anyrole_1.cgi',
				{
					action: "AJAX_getPositionAutocompleteList",
					position: currentValue,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						CreateAutocompleteWithSelectCallback(curr_tag, data.autocomplete_list, function() {});
					}
					else
					{
						console.debug(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(e)
				{
					console.error(curr_tag, "Ошибка ответа сервера");
				});
		}
	};

	var	CreateAutocompleteWithSelectCallback = function(elem, srcData, selectCallback)
	{

		if((typeof srcData == "object") && srcData.length)
		{
			if((typeof elem == "object") && elem.length && srcData.length && (typeof selectCallback == "function"))
			{
				srcData.forEach(function(item)
				{
					item.label = ConvertHTMLToText(item.label);
				});
				
				// if(elem.autocomplete( "instance")) elem.autocomplete("remove");
				elem.autocomplete({
					delay : 0,
					source: srcData,
					minLength: 1,
					select: selectCallback,
					close: function (event, ui)
					{
						// console.debug ("CreateAutocompleteWithSelectCallback: close event handler");
					},
					create: function () {
						// console.debug ("CreateAutocompleteWithSelectCallback: _create event handler");
					},
					_renderMenu: function (ul, items)  // --- requres plugin only
					{
						var	that = this;
						currentCategory = "";
						$.each( items, function( index, item ) {
							var li;
							if ( item.category != currentCategory ) {
								ul.append( "<li class='ui-autocomplete-category'>" + item.category + "</li>");
								currentCategory = item.category;
							}
							li = that._renderItemData( ul, item );
							if ( item.category ) {
								li.attr( "aria-label", item.category + " : " + item.label );
							}
						});
					}
				});
			}
			else
			{
				console.error("CreateAutocompleteWithSelectCallback:ERROR: srcData or (" + elem + ") is empty or callback(" + selectCallback + ") is not a function");
			}
		}
		else
		{
			// --- autocomplete list is empty
		}
	};

	var	isElementInList = function(item_id, list)
	{
		var		result = false;

		if(item_id.length && list.length)
		{
			for(var i = 0; i < list.length; ++i)
			{
				if(list[i].id == item_id)
				{
					result = true;
					break;
				}
			}
		}

		return result;
	};


	var	isIDInTheJQueryList = function(id, list)
	{
		var		result = false;

		list.each(function()
		{
			var		currTag = $(this);
			if(currTag.data("id") == id) result = true;
		});

		return result;
	};

	var	RemoveCompanyTypeFromSpelling = function(full_name)
	{
		var		result = full_name;

		companyTypes.forEach(function(company_type)
		{
			result = result.replace(company_type, "");
		});

		return result;
	};

	var FillArrayWithNumbers = function(n) 
	{
        var arr = Array.apply(null, Array(n));
        return arr.map(function (x, i) { return i; });
    };

	var isAdvancedUpload = function() {
		var div = document.createElement('div');
		return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
	};

	var	AddDragNDropFile = function(tag, DropHandler)
	{
		if(isAdvancedUpload())
		{
			tag
				.on("drag"		, function(e) { e.preventDefault(); e.stopPropagation(); })
				.on("dragstart"	, function(e) { e.preventDefault(); e.stopPropagation(); })
				.on("dragend"	, function(e) { e.preventDefault(); e.stopPropagation(); })
				.on("dragover"	, function(e) { e.preventDefault(); e.stopPropagation(); })
				.on("dragenter"	, function(e) { e.preventDefault(); e.stopPropagation(); })
				.on("dragleave"	, function(e) { e.preventDefault(); e.stopPropagation(); })
				.on("drop"		, function(e) { e.preventDefault(); e.stopPropagation(); })

				.on("dragover"	, function(e) { tag.addClass("is-dragover"); })
				.on("dragenter"	, function(e) { tag.addClass("is-dragover"); })

				.on("dragleave"	, function(e) { tag.removeClass("is-dragover"); })
				.on("dragend"	, function(e) { tag.removeClass("is-dragover"); })
				.on("drop"		, function(e) { tag.removeClass("is-dragover"); SetExpenseItemDocTagAttributes(tag, "", e.originalEvent.dataTransfer.files[0]); });
		}
		else
		{
			console.debug("drag-n-drop is not supported");
		}
	};

	// --- Companies
	var	GetCompanyInfo_DOM = function(companies)
	{
		var		result = $();

		var		RenderOGRN = function(dom) { $("#ogrn_info_placeholder").empty().append(dom); };
		var		RenderKPP = function(dom)  { $("#kpp_info_placeholder").empty().append(dom); };

		companies.forEach(function(company_obj)
		{
			var		row_company_name			= $("<div>").addClass("row highlight_onhover");
			var		row_company_desc			= $("<div>").addClass("row highlight_onhover");
			var		row_company_weblink			= $("<div>").addClass("row highlight_onhover");
			var		row_company_legal_add		= $("<div>").addClass("row highlight_onhover");
			var		row_company_mail_add		= $("<div>").addClass("row highlight_onhover");
			var		row_company_inn				= $("<div>").addClass("row highlight_onhover");
			var		row_company_bank			= $("<div>").addClass("row highlight_onhover");
			var		row_company_bank_acc		= $("<div>").addClass("row highlight_onhover");
			var		row_company_ogrn			= $("<div>").addClass("row highlight_onhover");
			var		row_company_kpp				= $("<div>").addClass("row highlight_onhover");

			var		col_company_name1			= $("<div>").addClass("col-xs-2 col-md-1");
			var		col_company_name2			= $("<div>").addClass("col-xs-9 col-md-10 col-md-offset-1  col-xs-offset-1");
			var		col_company_desc1			= $("<div>").addClass("col-xs-3 col-md-2");
			var		col_company_desc2			= $("<div>").addClass("col-xs-9 col-md-10 col-md-offset-1 col-xs-offset-1");
			var		col_company_weblink1		= $("<div>").addClass("col-xs-3 col-md-2");
			var		col_company_weblink2		= $("<div>").addClass("col-xs-9 col-md-10");
			var		col_company_legal_add1		= $("<div>").addClass("col-xs-3 col-md-2");
			var		col_company_legal_add2		= $("<div>").addClass("col-xs-9 col-md-10");
			var		col_company_mail_add1		= $("<div>").addClass("col-xs-3 col-md-2");
			var		col_company_mail_add2		= $("<div>").addClass("col-xs-9 col-md-10");
			var		col_company_inn1			= $("<div>").addClass("col-xs-3 col-md-2");
			var		col_company_inn2			= $("<div>").addClass("col-xs-9 col-md-10");
			var		col_company_bank1			= $("<div>").addClass("col-xs-3 col-md-2");
			var		col_company_bank2			= $("<div>").addClass("col-xs-9 col-md-10");
			var		col_company_bank_acc1		= $("<div>").addClass("col-xs-3 col-md-2");
			var		col_company_bank_acc2		= $("<div>").addClass("col-xs-9 col-md-10");
			var		col_company_ogrn1			= $("<div>").addClass("col-xs-3 col-md-2");
			var		col_company_ogrn2			= $("<div>").addClass("col-xs-9 col-md-10 __company_ogrn_" + company_obj.id);
			var		col_company_kpp1			= $("<div>").addClass("col-xs-3 col-md-2");
			var		col_company_kpp2			= $("<div>").addClass("col-xs-9 col-md-10 __company_kpp_" + company_obj.id);

			var		info_obj1					= new InfoObj();
			var		info_obj2					= new InfoObj();
			var		info_obj3					= new InfoObj();
			var		bank_obj					= info_obj1.GetDOM("BANK", "fake_param");
												  info_obj1.SetInfoDOM(GetBankInfo_DOM(company_obj.banks[0]));
			var		ogrn_obj					= info_obj2.GetDOM("OGRN", ".__company_ogrn_" + company_obj.id);
			var		kpp_obj						= info_obj3.GetDOM("KPP", ".__company_kpp_" + company_obj.id);

			var		logo_canvas					= $("<canvas>")
													.attr("width", "80")
													.attr("height", "80")
													.addClass('canvas-big-logo');
			var		logo_path					= (company_obj.logo_filename.length ? "/images/companies/" + company_obj.logo_folder + "/" + company_obj.logo_filename : "");
			var		company_logo				= system_calls.RenderCompanyLogo(logo_canvas[0].getContext("2d"), logo_path, company_obj.name, "fake");

			row_company_name
				.append(col_company_name1.append(logo_canvas))
				.append(col_company_name2.append(company_obj.webSite.length ? $("<a>").attr("href", company_obj.webSite).attr("target", "_blank").append(company_obj.name) : company_obj.name))
				.append(col_company_desc2.append(company_obj.description));
			row_company_weblink
				.append(col_company_weblink1.append("Ссылка:"))
				.append(col_company_weblink2.append(company_obj.webSite));
			row_company_legal_add
				.append(col_company_legal_add1.append("Юр. адрес:"))
				.append(col_company_legal_add2.append(company_obj.legal_geo_zip[0].zip + " " + company_obj.legal_geo_zip[0].locality.region.country.title + " " + company_obj.legal_geo_zip[0].locality.region.title + " " + company_obj.legal_geo_zip[0].locality.title + " " + company_obj.legal_address));
			row_company_mail_add
				.append(col_company_mail_add1.append("Почтовый адрес:"))
				.append(col_company_mail_add2.append(company_obj.mailing_geo_zip[0].zip + " " + company_obj.mailing_geo_zip[0].locality.region.country.title + " " + company_obj.mailing_geo_zip[0].locality.region.title + " " + company_obj.mailing_geo_zip[0].locality.title + " " + company_obj.mailing_address));
			row_company_inn
				.append(col_company_inn1.append("ИНН:"))
				.append(col_company_inn2.append(company_obj.tin));
			row_company_bank
				.append(col_company_bank1.append("Банк: ").append(bank_obj.button))
				.append(col_company_bank2.append(company_obj.banks[0].title + ", БИК: " + company_obj.banks[0].bik + ", к/с: " + company_obj.banks[0].account));
			row_company_bank_acc
				.append(col_company_bank_acc1.append("Р/С:"))
				.append(col_company_bank_acc2.append(company_obj.account));
			row_company_ogrn
				.append(col_company_ogrn1.append("ОГРН: ").append(ogrn_obj.button))
				.append(col_company_ogrn2.append(company_obj.ogrn));
			row_company_kpp
				.append(col_company_kpp1.append("КПП: ").append(kpp_obj.button))
				.append(col_company_kpp2.append(company_obj.kpp));

			result = result.add(row_company_name);
			result = result.add(row_company_desc);
			result = result.add(row_company_legal_add);
			result = result.add(row_company_mail_add);
			result = result.add(row_company_inn);
			result = result.add(bank_obj.info);
			result = result.add(row_company_bank);
			result = result.add(row_company_bank_acc);
			result = result.add(ogrn_obj.info);
			result = result.add(row_company_ogrn);
			result = result.add(kpp_obj.info);
			result = result.add(row_company_kpp);
		});

		return result;
	};





	// --- EXIF part

	var	Exif_RemoveClasses = function($img)
	{
		var		classes = $img.attr("class").split(" ");

		classes.forEach(function(class_name)
		{
			if(class_name.search("exif_") === 0)
				$img.removeClass(class_name);
		});
	};

	var	Exif_FixOrientation = function ($img)
	{
        EXIF.getData($img[0], function()
        {
            // console.log('Exif=', EXIF.getTag(this, "Orientation"));
            switch(parseInt(EXIF.getTag(this, "Orientation")))
            {
                case 2:
                    $img.addClass('exif_flip'); break;
                case 3:
                    $img.addClass('exif_rotate-180'); break;
                case 4:
                    $img.addClass('exif_flip-and-rotate-180'); break;
                case 5:
                    $img.addClass('exif_flip-and-rotate-270'); break;
                case 6:
                    $img.addClass('exif_rotate-90'); break;
                case 7:
                    $img.addClass('exif_flip-and-rotate-90'); break;
                case 8:
                    $img.addClass('exif_rotate-270'); break;
            }
        });
	};





	//--- timecard part

	var	GetTimecardHead = function(timecard, holiday_calendar)
	{
		var		result = $();
		var		row = $("<tr>");
		var		current_period_length;
		var		i;
		var		temp = [];
		var		period_start, period_end;
		var		tempDate;
		var		dateTitle;
		var		holiday_name;
		var		td_tag;

		temp = timecard.period_start.split("-");
		if(temp.length == 3)
		{
			period_start = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));

			temp = timecard.period_end.split("-");
			if(temp.length == 3)
			{
				period_end = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));

				current_period_length = (period_end - period_start) / 86400000;

				row.append("<td class=\"padding_sides_5\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>");
				row.append("<td class=\"padding_sides_5\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>");
				row.append("<td class=\"padding_sides_5\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>");

				tempDate = period_start;
				i = 0;

				do
				{
					td_tag = $("<td>");

					dateTitle = "";
					holiday_name = GetHolidayName(tempDate, holiday_calendar);

					if(holiday_name.length)
					{
						td_tag
							.attr("title", holiday_name);
							// .attr("data-toggle", "tooltip")
							// .attr("data-placement", "top")
							// .tooltip({ animation: "animated bounceIn", placement: "top" });
					}

					if(current_period_length < 10) dateTitle += tempDate.getDate() + " " + system_calls.ConvertMonthNumberToAbbrName(tempDate.getMonth() + 1);
					else dateTitle = tempDate.getDate();

					td_tag
							.addClass(GetDayClass(tempDate, holiday_calendar))
							.addClass("text_align_center padding_sides_5 day" + i)
							.append(dateTitle);
								
					row.append(td_tag);

					tempDate.setDate(tempDate.getDate() + 1);
					++i;
				} while(tempDate <= period_end);

				row.append("<td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>");

				result = result.add(row);
			}
			else
			{
				console.error("incorrect period_end");
			}
		}
		else
		{
			console.error("incorrect period_start");
		}


		return result;
	};

	var	GetTimecardBody = function(timecard, holiday_calendar)
	{
		var		result = $();

		var		period_start, period_end;
		var		tempDate;
		var		temp;

		temp = timecard.period_start.split("-");
		if(temp.length == 3)
		{
			period_start = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));

			temp = timecard.period_end.split("-");
			if(temp.length == 3)
			{
				period_end = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));

				timecard.lines.forEach(function(timecard_line)
				{
					var		row = $("<tr>");
					var		reported_hours_arr = timecard_line.row.split(",");

					if(
						(typeof(timecard_line) != "undefined") &&
						(typeof(timecard_line.tasks) != "undefined") &&
						(timecard_line.tasks.length) &&
						(typeof(timecard_line.tasks[0].title) != "undefined") &&
						(typeof(timecard_line.tasks[0].projects) != "undefined") &&
						(timecard_line.tasks[0].projects.length) &&
						(typeof(timecard_line.tasks[0].projects[0].title) != "undefined") &&
						(typeof(timecard_line.tasks[0].projects[0].customers) != "undefined") &&
						(timecard_line.tasks[0].projects[0].customers.length) &&
						(typeof(timecard_line.tasks[0].projects[0].customers[0].title) != "undefined")
						)
					{

						row.append("<td class=\"padding_sides_5\">" + timecard_line.tasks[0].projects[0].customers[0].title + "</td>");
						row.append("<td class=\"padding_sides_5\">" + timecard_line.tasks[0].projects[0].title + "</td>");
						row.append("<td class=\"padding_sides_5\">" + timecard_line.tasks[0].title + "</td>");

						tempDate = new Date(period_start);
						for(var i = 0; tempDate <= period_end; ++i)
						{
							var		day_hours = reported_hours_arr[i] || 0;

							row.append(
									$("<td>")
									.addClass("text_align_center padding_sides_5")
									.addClass(GetDayClass(tempDate, holiday_calendar))
									.addClass((day_hours == 8) ? "even_report" :
											  (day_hours  > 8) ? "over_report" : "")
									.append(day_hours || "")
										);

							tempDate.setDate(tempDate.getDate() + 1);
						}
					}
					else
					{
						console.error("issue with cu/proj/task title");
					}

					row.append("<td></td>");

					result = result.add(row);
				});
			}
			else
			{
				console.error("incorrect period_end");
			}
		}
		else
		{
			console.error("incorrect period_start");
		}

		return result;
	};

	var	GetTimecardFoot = function(timecard, holiday_calendar)
	{
		var		result = $();
		var		row = $("<tr>");
		var		i;
		var		total_hours = 0;
		var		total_hours_arr = [];
		var		period_start, period_end;
		var		temp;

		temp = timecard.period_start.split("-");
		if(temp.length == 3)
		{
			period_start = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));

			temp = timecard.period_end.split("-");
			if(temp.length == 3)
			{
				var		tempDate;

				period_end = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));

				row.append("<td></td>");
				row.append("<td></td>");
				row.append("<td>Сумма:</td>");

				timecard.lines.forEach(function(timecard_line)
				{
					timecard_line.row.split(",").map(
									function(item, idx)
									{
										var		hours_reported = 0;

										if(item.length) hours_reported = parseFloat(item);
										total_hours = RoundedTwoDigitSum(total_hours, hours_reported);
										total_hours_arr[idx] = total_hours_arr[idx] ? RoundedTwoDigitSum(total_hours_arr[idx], hours_reported) : hours_reported;

										return hours_reported;
									});

				});

				for(i = 0, tempDate = period_start; tempDate <= period_end; ++i)
				{
					var		day_hours = total_hours_arr[i] || 0;

					row
						.append($("<td>")
						.addClass("text_align_center padding_sides_5")
						.addClass(GetDayClass(tempDate, holiday_calendar))
						.addClass((day_hours == 8) ? "even_report" :
								  (day_hours  > 8) ? "over_report" : "")
						.append(day_hours || ""));


					tempDate.setDate(tempDate.getDate() + 1);
				}


				row.append($("<td>").addClass("total_hours text_align_center padding_sides_5").append(total_hours));

				result = result.add(row);
			}
			else
			{
				console.error("incorrect period_end");
			}
		}
		else
		{
			console.error("incorrect period_start");
		}

		return result;
	};

	var	GetTextedTimecard_DOM = function(timecard, holiday_calendar)
	{
		var	result = $("<table>").addClass("form-group");

		if(
			(typeof(timecard) != "undefined") &&
			(typeof(timecard.period_start) != "undefined") &&
			(typeof(timecard.period_end) != "undefined")
		)
		{
			result
				.append($("<thead>").append(GetTimecardHead(timecard, holiday_calendar)))
				.append($("<tbody>").append(GetTimecardBody(timecard, holiday_calendar)))
				.append($("<tfoot>").append(GetTimecardFoot(timecard, holiday_calendar)).css("border-top","solid"));
		}
		else
		{
			console.error("timecard object broken (timecard or period_start or period_end) has missed");
		}

		return result;
	};

	var	GetSumHoursFromTimecard = function(timecard)
	{
		var		result = 0;

		timecard.lines.forEach(function(line)
		{
			line.row.split(",").forEach(function(hours_str)
			{
				if(hours_str.length) result = system_calls.RoundedTwoDigitSum(result, parseFloat(hours_str));
			});
		});

		return result;
	};

	var	AddDaysToDate = function(curr_date, days)
	{
		var		new_date = new Date(curr_date);

		new_date.setDate(curr_date.getDate() + days);

		return new_date;
	};

	var	GetTotalNumberOfWorkingHours = function(d1, d2, holiday_calendar_string)
	{
		var		result = 0;

		var		date1 = new Date(Math.min(d1, d2));
		var		date2 = new Date(Math.max(d1, d2));
		var		date_curr;

		var		holiday_calendar = ConvertHolidayCalendar_From_StringArray_To_DateArray(holiday_calendar_string);

		for(date_curr = date1; date_curr <= date2;)
		{
			if(isWeekDay(date_curr) && !isHoliday(date_curr, holiday_calendar)) result += 8;
			date_curr = AddDaysToDate(date_curr, 1);
		}

		return	result;
	};

	// --- return: boolean
	//				true - Mon, Tue, Wed, Thu, Fri
	//				false - Sat, Sun
	var	isWeekDay = function(testDate)
	{
		return testDate.getDay() % 6;
	};

	// --- holiday_calendar must be array of Date objects
	var	isHoliday = function(testDate, holiday_calendar)
	{
		var result = false;
		var	testDate_00_00_00 = new Date(testDate);
		testDate_00_00_00.setHours(0, 0, 0);

		if(holiday_calendar && holiday_calendar.length)
		{
			// result = holiday_calendar.find(function(element)
			for(var idx in holiday_calendar)
			{
				var	holiday_00_00_00 = new Date(holiday_calendar[idx]);
				holiday_00_00_00.setHours(0, 0, 0);

				if(holiday_00_00_00.getTime() == testDate_00_00_00.getTime())
				{
					result = true;
					break;
				}
			};
		}

		return result;
	};

	// --- this function bound to isHoliday() and GetTotalNumberOfWorkingHours()
	// --- most probably you don't want to use it anywhere else
	var ConvertHolidayCalendar_From_StringArray_To_DateArray = function(holiday_calendar_string)
	{
		var result = [];

		if(holiday_calendar_string && holiday_calendar_string.length)
		{
			holiday_calendar_string.forEach(function(item)
			{
				var	res_tmp = false;
				var split = item.date.split(/-/);

				if(split.length == 3)
				{
					var holiday = new Date(split[0], parseInt(split[1]) - 1, split[2], "0", "0", "0", "0");

					result.push(holiday);
				}

				return res_tmp;
			});
		}
		return result;
	};


	var	GetHolidayName = function(testDate, holidays)
	{
		var	result = "";
		var	holiday_arr;
		var	holiday;

		if(holidays)
		{
			for (var i = holidays.length - 1; i >= 0; i--)
			{
				holiday_arr = holidays[i].date.split(/-/);

				if(holiday_arr.length == 3)
				{
					holiday = new Date(holiday_arr[0], holiday_arr[1] - 1, holiday_arr[2]);

					if(holiday.getTime() == testDate.getTime())
					{
						result = holidays[i].title;
						break;
					}
				}
			}
		}
		else
		{
			console.error("holidays calendar is not defined");
		}

		return result;
	};

	var	GetDayClass = function (testDate, holidays)
	{
		return	GetHolidayName(testDate, holidays).length	?	"holiday" :
				isWeekDay(testDate)							?	"weekday" : 
																"weekend";
	};

	var RoundedTwoDigitSum = function(term1, term2)
	{
		return Math.round((term1 + term2) * 100) / 100;
	};

	var RoundedTwoDigitMul = function(term1, term2)
	{
		return Math.round((term1 * term2) * 100) / 100;
	};

	var RoundedTwoDigitDiv = function(term1, term2)
	{
		return Math.round((term1 / term2) * 100) / 100;
	};

	var RoundedTwoDigitSub = function(term1, term2)
	{
		return Math.round((term1 - term2) * 100) / 100;
	};

	var	GetApproverIdxByID = function(approver_id, approvers)
	{
		var		result = -1;

		for(var i = 0; i < approvers.length; ++i)
		{
			if(approvers[i].id == approver_id)
			{
				result = i;
				break;
			}
		}

		return result;
	};

	var	GetApprovals_DOM = function(timecard_item)
	{
		var		result = $();
		var		i, item, approver_idx;

			// --- this is "virtual approver" needed to keep track timecard submission timestamp
			timecard_item.approvals.push({decision:"submit", eventTimestamp:timecard_item.submit_date});

			timecard_item.approvals.sort(function(a, b)
				{
					var		timestampA = parseInt(a.eventTimestamp);
					var		timestampB = parseInt(b.eventTimestamp);
					var		result;

					if(timestampA == timestampB) { result = 0; }
					if(timestampA > timestampB) { result = 1; }
					if(timestampA < timestampB) { result = -1; }

					return result;
				});

			for(i = 0; i < timecard_item.approvals.length; ++i)
			{
				item = timecard_item.approvals[i];

				if(item.decision == "approved")
				{
						approver_idx = GetApproverIdxByID(item.approver_id, timecard_item.approvers);

					if(approver_idx != -1)
					{
						result = result.add($("<span>").append("Одобрено: " + timecard_item.approvers[approver_idx].users[0].name + " " + timecard_item.approvers[approver_idx].users[0].nameLast + " " + system_calls.GetFormattedDateFromSeconds(item.eventTimestamp, TIMECARD_REPORT_TIME_FORMAT)  + (item.comment.length ? " (" + item.comment + ")" : "") + "<br>"));

						if(parseInt(item.eventTimestamp) > parseInt(timecard_item.submit_date)) timecard_item.approvers[approver_idx].didAction = true;
					}
					else
					{
						console.error("approver_id(" + approver_idx + ") not found");
					}
				}
				if(item.decision == "rejected")
				{
					approver_idx = GetApproverIdxByID(item.approver_id, timecard_item.approvers);

					if(approver_idx != -1)
					{
						result = result.add($("<span>").append("Отклонено: " + timecard_item.approvers[approver_idx].users[0].name + " " + timecard_item.approvers[approver_idx].users[0].nameLast + " " + system_calls.GetFormattedDateFromSeconds(item.eventTimestamp, TIMECARD_REPORT_TIME_FORMAT) + " (" + item.comment + ")<br>"));

						if(parseInt(item.eventTimestamp) > parseInt(timecard_item.submit_date)) timecard_item.approvers[approver_idx].didAction = true;
					}
					else
					{
						console.error("approver_id(" + approver_idx + ") not found");
					}
				}
				if(item.decision == "submit")
				{
					if(parseInt(item.eventTimestamp))
					{
						// --- this approve created at the beginning of this func to keep track timecard submission timestamp
						result = result.add($("<span>").append("Отправлено на проверку: " + system_calls.GetFormattedDateFromSeconds(item.eventTimestamp, TIMECARD_REPORT_TIME_FORMAT) + "<br>"));
					}
				}
			}

			if(timecard_item.status == "submit")
			{
/* 
  				timecard_item.approvers.forEach(function(approver)
				{
					if(typeof(approver.didAction) == "undefined")
					{
							approver_idx = GetApproverIdxByID(approver.id, timecard_item.approvers);

						if(approver_idx != -1)
						{
							result = result.add($("<span>").append("Ожидание: " + timecard_item.approvers[approver_idx].users[0].name + " " + timecard_item.approvers[approver_idx].users[0].nameLast + "<br>"));
						}
						else
						{
							console.error("approver_id(" + approver_idx + ") not found");
						}
					}
				});
*/
				for(i = 0; i < timecard_item.approvals.length; ++i)
				{
					item = timecard_item.approvals[i];

					if(item.decision == "pending")
					{
						approver_idx = GetApproverIdxByID(item.approver_id, timecard_item.approvers);

						if(approver_idx != -1)
						{
							result = result.add($("<span>").append("Ожидание: " + timecard_item.approvers[approver_idx].users[0].name + " " + timecard_item.approvers[approver_idx].users[0].nameLast + "<br>"));
						}
						else
						{
							console.error("approver_id(" + approver_idx + ") not found");
						}
					}
				}
				
			}

		return result;
	};

	var	GetRejectedDate_DOM = function(timecard_item)
	{
		var		result = $();

		if((typeof(timecard_item) != "undefined") && (typeof(timecard_item.status) != "undefined"))
		{
			if(timecard_item.status == "rejected")
			{
				result = $("<span>").append("Отклонено <br>");
			}
		}
		else
		{
			console.error("timecard.approve_date is not in the object");
		}

		return result;
	};

	var	GetSavedDate_DOM = function(timecard_item)
	{
		var		result = $();

		if((typeof(timecard_item) != "undefined") && (typeof(timecard_item.status) != "undefined"))
		{
			if(timecard_item.status == "saved")
			{
				result = $("<span>").append("Сохранено: " + system_calls.GetFormattedDateFromSeconds(timecard_item.eventTimestamp, TIMECARD_REPORT_TIME_FORMAT) + "<br>");
			}
		}
		else
		{
			console.error("timecard.approve_date is not in the object");
		}

		return result;
	};

	var	GetApprovedDate_DOM = function(timecard_item)
	{
		var		result = $();

		if((typeof(timecard_item) != "undefined") && (typeof(timecard_item.status) != "undefined"))
		{
			if(timecard_item.status == "approved")
			{
				result = $("<span>").append("Одобрено: " + system_calls.GetFormattedDateFromSeconds(timecard_item.approve_date, TIMECARD_REPORT_TIME_FORMAT) + "<br>");
			}
		}
		else
		{
			console.error("timecard.approve_date is not in the object");
		}

		return result;
	};

	var	GetExpectedPayDate_DOM = function(tc_bt_item)
	{
		var		result = $();

		if((typeof(tc_bt_item) != "undefined") && (typeof(tc_bt_item.expected_pay_date) != "undefined"))
		{
			if(parseInt(tc_bt_item.expected_pay_date))
			{
				result = $("<span>").append("Оплата ожидается до: " + system_calls.GetFormattedDateFromSeconds(tc_bt_item.expected_pay_date, TIMECARD_REPORT_DATE_FORMAT) + "<br>");
			}
		}
		else
		{
			console.error("timecard.approve_date is not in the object");
		}

		return result;
	};

	var	GetOriginalsReceivedDate_DOM = function(tc_bt_item)
	{
		var		result = $();

		if((typeof(tc_bt_item) != "undefined") && (typeof(tc_bt_item.originals_received_date) != "undefined"))
		{
			if(parseInt(tc_bt_item.originals_received_date))
			{
				result = $("<span>").append("Оригиналы док-ов получены: " + system_calls.GetFormattedDateFromSeconds(tc_bt_item.originals_received_date, TIMECARD_REPORT_DATE_FORMAT) + "<br>");
			}
		}
		else
		{
			console.error("timecard.approve_date is not in the object");
		}

		return result;
	};

	var	GetPayedDate_DOM = function(tc_bt_item)
	{
		var		result = $();

		if((typeof(tc_bt_item) != "undefined") && (typeof(tc_bt_item.payed_date) != "undefined"))
		{
			if(parseInt(tc_bt_item.payed_date))
			{
				result = $("<span>").append("Оплачено: " + system_calls.GetFormattedDateFromSeconds(tc_bt_item.payed_date, TIMECARD_REPORT_DATE_FORMAT) + "<br>");
			}
		}
		else
		{
			console.error("timecard.approve_date is not in the object");
		}

		return result;
	};

	var	GetSubmittedDate_DOM = function(timecard_item)
	{
		var		result = "";

		if((typeof(timecard_item) != "undefined") && (typeof(timecard_item.submit_date) != "undefined"))
		{
			if(timecard_item.status == "submit")
				result = $("<span>").append("Отправлено: " + system_calls.GetFormattedDateFromSeconds(timecard_item.submit_date, TIMECARD_REPORT_TIME_FORMAT) + "<br>");
		}
		else
		{
			console.error("timecard.submit_date is not in the object");
		}

		return result;
	};

	var	GetHoursStatistics = function(timecard, holiday_calendar)
	{
		var		sow					= timecard.contract_sow[0];
		var		sow_start_ts		= system_calls.ConvertDateSQLToSec(sow.start_date) * 1000;
		var		sow_end_ts			= system_calls.ConvertDateSQLToSec(sow.end_date) * 1000;
		var		timecard_start_ts	= system_calls.ConvertDateSQLToSec(timecard.period_start) * 1000;
		var		timecard_end_ts		= system_calls.ConvertDateSQLToSec(timecard.period_end) * 1000;
		var		total_work_hours	= system_calls.GetTotalNumberOfWorkingHours(Math.max(timecard_start_ts, sow_start_ts), Math.min(timecard_end_ts, sow_end_ts), holiday_calendar);
		var		actual_work_hours	= system_calls.GetSumHoursFromTimecard(timecard);
		var		actual_work_days	= system_calls.RoundedTwoDigitDiv(actual_work_hours, 8);
/*
		var		temp = [];
		temp = timecard.period_start.split("-");
		timecard_start_date = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));
		temp = timecard.period_end.split("-");
		timecard_end_date = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));
*/

		return {
				actual_work_hours	: actual_work_hours,
				actual_work_days	: actual_work_days,
				total_work_hours	: total_work_hours,
				};
	};

	var	GetHoursStatistics_DOM = function(timecard, strip_br, holiday_calendar)
	{
		var		obj = GetHoursStatistics(timecard, holiday_calendar);
		var		result = $("<span>")
							.append("Отработано " + obj.actual_work_hours + " " + system_calls.GetPluralWordSpelling(Math.round(obj.actual_work_hours), "час", "часа", "часов") + " / " + obj.actual_work_days + " " + system_calls.GetPluralWordSpelling(Math.round(obj.actual_work_days), "день", "дня", "дней") + " или " + Math.round(obj.actual_work_hours / obj.total_work_hours * 100) + "% рабочего времени");
		if(strip_br)
		{
		}
		else
			result.append("<br><br>");

		return result;
	};

	var	GetExpenseLineTemplateByID = function(expense_line_templates, template_id)
	{
		var		result = "";

		for (var i = 0; i < expense_line_templates.length; i++) {
		 	if(expense_line_templates[i].id == template_id)
		 	{
		 		result = expense_line_templates[i];
		 		break;
		 	}
		 }

		 return result;
	};

	var	SetExpenseItemDocTagAttributes = function(tag, url_str, file_obj)
	{
		var		tmpURLObj;

		tag
			.removeAttr("src", "")
			.removeAttr("data-file_type", "")
			.removeAttr("data-file_name", "")
			.removeAttr("data-file", "")
			.removeData("original_file", "");


		// --- file located at the server
		if(url_str && url_str.length)
		{
			if(system_calls.isPdf(url_str))
			{
				tag.attr("src", "/images/pages/common/pdf.png");
				tag.attr("data-file_type", "pdf");
				tag.attr("data-file_name", "");
				tag.attr("data-file", "/images/expense_lines/" + url_str);
			}
			else
			{
				tag.attr("src", "/images/expense_lines/" + url_str);
				tag.attr("data-file_type", "jpg");
				tag.attr("data-file_name", "");
				tag.attr("data-file", "/images/expense_lines/" + url_str);
			}
		}
		// --- file locally uploaded to browser
		else if(file_obj)
		{
			tmpURLObj = URL.createObjectURL(file_obj);

			if(system_calls.isPdf(file_obj.name))
			{
				tag.attr("src", "/images/pages/common/pdf.png");
				tag.attr("data-file_type", "pdf");
				tag.attr("data-file_name", file_obj.name);
				tag.attr("data-file", tmpURLObj);
				tag.data("original_file", file_obj);
			}
			else
			{
				tag.attr("src", tmpURLObj);
				tag.attr("data-file_type", "jpg");
				tag.attr("data-file_name", file_obj.name);
				tag.attr("data-file", tmpURLObj);
				tag.data("original_file", file_obj);
			}
		}
		else
		{
			console.error("neither url nor obj is defined");
		}
	};


	var	GetBTExpenseLineInfo_DOM = function(expense_lines, expense_line_templates)
	{
		var	lines_tag = $();

		if((typeof(expense_line_templates) != "undefined") && expense_line_templates.length)
		{
			var	image_row = $("<div>").addClass("row form-group");
			var	text_tag = $();

			expense_lines.forEach( function(expense_line)
			{
				var		text_row;
				var		text_type_col;
				var		text_value_col;

				if(expense_line.value.length)
				{
					var		template_obj = GetExpenseLineTemplateByID(expense_line_templates, expense_line.bt_expense_line_template_id);

					if(template_obj.dom_type == "image")
					{
						var		image_col = $("<div>").addClass("col-xs-4 col-md-1");
						var		annotation_div = $("<div>")
															.css("position", "absolute")
															.css("width", "calc(100% - 30px)")
															.css("height", "auto")
															.css("top", "50%")
															.css("text-align", "center");
						var		annotation = $("<span>")
															.addClass("label label-default")
															.attr("data-toggle", "tooltip")
															.attr("data-placement", "top")
															.attr("title", expense_line.comment)
															.tooltip({ animation: "animated bounceIn", placement: "top" })
															.append(template_obj.title);
						var		img_tag = $("<img>")
															.addClass("width_100percent_100px_cover niceborder cursor_pointer")
															.on("click", function(e)
															{
																var		currTag = $(this);

																if(currTag.attr("data-file_type") == "jpg")
																{
																	$("#ImagePreviewModal_Img").attr("src", currTag.attr("data-file"));
																	$("#ImagePreviewModal").modal("show");
																}
																else if(currTag.attr("data-file_type") == "pdf")
																{
																	window.open(currTag.attr("data-file"), "_blank");
																}
															});

						SetExpenseItemDocTagAttributes(img_tag, expense_line.value);

						annotation_div.append(annotation);

						image_col
									.append(img_tag)
									.append(annotation_div);
						image_row	.append(image_col);
					}

					if(template_obj.dom_type == "input")
					{
						text_row		= $("<div>").addClass("row");
						text_type_col	= $("<div>").addClass("col-xs-4 col-md-3");
						text_value_col	= $("<div>").addClass("col-xs-6 col-md-3");

						text_type_col	.append(template_obj.title);
						text_value_col 	.append(expense_line.value);

						text_row
										.append(text_type_col)
										.append(text_value_col);

						text_tag = text_tag.add(text_row);
					}

					if(template_obj.dom_type == "allowance")
					{
						text_row		= $("<div>").addClass("row");
						text_type_col	= $("<div>").addClass("col-xs-4 col-md-3");
						text_value_col	= $("<div>").addClass("col-xs-6 col-md-3");

						text_type_col	.append(template_obj.title);
						text_value_col 	.append(expense_line.value);

						text_row
										.append(text_type_col)
										.append(text_value_col);

						text_tag = text_tag.add(text_row);
					}
				}
			});

			lines_tag = lines_tag.add(text_tag);
			lines_tag = lines_tag.add(image_row);

		}
		else
		{
			console.error("ERROR: expense_line_templats array undefined");
		}

		return lines_tag;
	};

	var	GetBTExpenseInfo_DOM = function(expense)
	{
		var		expense_tag = $();
		var		info_row = $("<div>").addClass("row highlight_row");
		var		info_col = $("<div>").addClass("col-xs-12 col-md-3");
		var		domestic_col = $("<div>").addClass("col-xs-12 col-md-3");
		var		foreign_row = $("<div>").addClass("row highlight_row");
		var		foreign_col = $("<div>").addClass("col-xs-6  col-md-4 col-md-offset-3");
		var		foreign_exch_col = $("<div>").addClass("col-xs-6  col-md-5");
		var		lines_tag = $();

		var		domestic_info = expense.price_domestic + " руб. оплачено " + expense.payment_type;
		var		foreign_info = "";
		var		foreign_exch_info = "";

		if(parseFloat(expense.price_foreign))
		{
			foreign_info += " в валюте: " + expense.price_foreign + " " + expense.currency_name;
			foreign_exch_info = $("<span>").append(" (курс: " + expense.currency_nominal + " " + expense.currency_name + " = " + expense.currency_value + " руб.)");

			if(expense.is_cb_currency_rate == "Y")
			{
				foreign_exch_info = foreign_exch_info.add($("<i>")
												.addClass("fa fa-university")
												.attr("aria-hidden", "true")
												.attr("title", "совпадает с курсом ЦБ")
												.tooltip({ animation: "animated bounceIn", placement: "top" })
											);
			}
					
		}

		lines_tag = lines_tag.add(GetBTExpenseLineInfo_DOM(expense.bt_expense_lines, expense.bt_expense_templates[0].line_templates));

		info_col			.append(expense.date + " " + expense.bt_expense_templates[0].title + (expense.comment.length ? " (" + expense.comment + ")" : ""));
		domestic_col		.append(domestic_info);
		info_row			.append(info_col);
		info_row			.append(domestic_col);
		foreign_col			.append(foreign_info);
		foreign_exch_col	.append(foreign_exch_info);
		foreign_row			.append(foreign_col);
		foreign_row			.append(foreign_exch_col);

		expense_tag = expense_tag.add(info_row);
		expense_tag = expense_tag.add(foreign_row);
		expense_tag = expense_tag.add(lines_tag);

		return expense_tag;
	};

	var GetTextedBT_DOM = function(bt_item)
	{
		var		result = $();
		var		total_amount = 0;
		var		dest_row = $("<div>").addClass("row");
		var		dest_col = $("<div>").addClass("col-xs-12");
		var		expense_tag = $();

		if(typeof(bt_item.expenses) != "undefined")
		{
			bt_item.expenses.sort(function(a, b)
			{
				var		date_arr_a = a.date.split("-");
				var		date_arr_b = b.date.split("-");
				var		result;
				var		timestampA, timestampB;

				timestampA = new Date(parseInt(date_arr_a[0]), parseInt(date_arr_a[1]), parseInt(date_arr_a[2]));
				timestampB = new Date(parseInt(date_arr_b[0]), parseInt(date_arr_b[1]), parseInt(date_arr_b[2]));

				if(timestampA == timestampB) { result = 0; }
				if(timestampA > timestampB) { result = 1; }
				if(timestampA < timestampB) { result = -1; }

				return result;
			});
			
			bt_item.expenses.forEach(function(expense)
			{
				expense_tag = expense_tag.add(GetBTExpenseInfo_DOM(expense));
			});
		}

		dest_col.append(bt_item.place + " - " + bt_item.purpose);
		dest_row.append(dest_col);
		result = result.add(dest_row);
		result = result.add(expense_tag);

		return result;
	};

	var	GetSumRublesFromBT = function(bt)
	{
		var	result = 0;

		if((typeof(bt) != "undefined") && (typeof(bt.expenses) != "undefined") && (bt.expenses.length))
		{
			bt.expenses.forEach(function(expense)
			{
				result = RoundedTwoDigitSum(result, parseFloat(expense.price_domestic));
			});
		}
		else
		{
			console.error("incorrect bt.object");
		}

		return result;
	};

	var	GetBTDurationInDays = function(bt)
	{
		var result = 0;

		if((typeof(bt) != "undefined") && (typeof(bt.date_start) != "undefined") && (typeof(bt.date_end) != "undefined"))
		{
			var	temp = [];
			var	date_start, date_end;

			temp = bt.date_start.split("-");
			date_start = new Date(parseInt(temp[0]), parseInt(temp[1]), parseInt(temp[2]));

			temp = bt.date_end.split("-");
			date_end = new Date(parseInt(temp[0]), parseInt(temp[1]), parseInt(temp[2]));

			result = (date_end - date_start) / 3600 / 24 / 1000 + 1;
		}
		else
		{
			console.error("incorrect bt.object");
		}

		return result;
	};

	var	GetBTStatistics_DOM = function(bt)
	{
		var		result = $("<span>");
		var		bt_duration = GetBTDurationInDays(bt);
		var		total_spent = GetSumRublesFromBT(bt);

		result.append("За " + bt_duration + " " + GetDaysSpelling(bt_duration) + " потрачено " + total_spent + " руб. " + (bt_duration ? ", примерный дневной расход:" + RoundedTwoDigitDiv(total_spent, bt_duration) : ""));

		return result;
	};

	var	amIonTheApproverList = function(bt_tc_object)
	{
		var	result = false;
		var	approvers = bt_tc_object.approvers;

		for (var i = approvers.length - 1; i >= 0; i--) {
			if(approvers[i].users[0].isMe == "yes")
			{
				result = true;
				break;
			}
		}

		return result;
	};

	var	shouldIActOnObject = function(bt_tc_object)
	{
		var		result = false;

		// --- "saved" timecards still under employee control
		if(bt_tc_object.status != "saved")
		{
			for(var i = 0; i < bt_tc_object.approvals.length; ++i)
			{
				var		item = bt_tc_object.approvals[i];

				if(item.decision == "pending")
				{
					var		approver_idx = GetApproverIdxByID(item.approver_id, bt_tc_object.approvers);
					if(approver_idx != -1)
					{
						if(bt_tc_object.approvers[approver_idx].users[0].isMe == "yes")
						{
							result = true;
							break;
						}
					}
					else
					{
						console.error("approver_id(" + item.approver_id + ") not found in approver list");
					}
				}
			}
		}

		return result;
	};


	var	GetSoWCustomFieldObject = function(var_name, custom_fields)
	{
		var	result;

		if(var_name && var_name.length)
		{
			if(typeof custom_fields != "undefined")
			{
				for(var i = 0; i < custom_fields.length; ++i)
				{
					if((typeof custom_fields[i] != "undefined") && (typeof custom_fields[i].title != "undefined"))
					{
						if(custom_fields[i].var_name == var_name)
						{
							result = custom_fields[i];
							break;
						}
					}
					else
					{
						console.error("custom_fields is the broken object (missed field \"title\")");
					}
				}
			}
			else
			{
				console.error("custom_fields doesn't defined");
			}
		}
		else
		{
			console.error("field_name is empty");
		}

		return result;
	};

	var	GetExistingTemplateLink_DOM = function(link, upload_file_type)
	{
		var	result = $();

		if(link.length)
		{
			result = $("<a>")
							.attr("href", "/" + upload_file_type + "/" + link + "?rand=" + Math.random() * 765432345678)
							.append("текущий фаил");

		}

		return result;
	};

	// --- internal, don't expose it to outside
	var	GetEditableCustomField_DOM = function(custom_field, update_action, delete_action, upload_file_type)
	{
		var	result = $();

		if((typeof custom_field == "object") && (typeof custom_field.title == "string") && (typeof custom_field.var_name == "string") && (typeof custom_field.value == "string"))
		{
			var	row 			= $("<div>").addClass("row");
			var	col_title 		= $("<div>").addClass("col-xs-4");
			var	col_value 		= $("<div>").addClass("col-xs-7");
			var	col_remove 		= $("<div>").addClass("col-xs-1");
			var	title_content	= $();
			var	value_content	= $();
			var	remove_button	= $("<i>").addClass("fa fa-times-circle padding_close float_right cursor_pointer animate_rotate_onhover");

			// --- value part
			if(custom_field.type == "input")
			{
				var	input_field		= $("<input>").addClass("transparent __sow_custom_field_input");
				var	label_field		= $("<label>");

				input_field
					.attr("data-id", custom_field.id)
					.attr("data-sow_id", custom_field.contract_sow_id || custom_field.contract_psow_id)
					.attr("data-db_value", custom_field.value)
					.attr("data-var_name", custom_field.var_name)
					.attr("data-action", update_action)
					.val(ConvertHTMLToText(custom_field.value))
					.on("change", system_calls.UpdateInputFieldOnServer);

				value_content = value_content.add(input_field);
				value_content = value_content.add(label_field);
			}
			else if(custom_field.type == "file")
			{
				var	input_file		= $("<input>").addClass("__sow_custom_field_file");
				var	current_file	= GetExistingTemplateLink_DOM(custom_field.value, upload_file_type);

				input_file
					.attr("type", "file")
					.attr("data-id", custom_field.id)
					.attr("data-sow_id", custom_field.contract_sow_id || custom_field.contract_psow_id)
					.attr("data-db_value", custom_field.value)
					.attr("data-var_name", custom_field.var_name)
					.attr("data-item_type", upload_file_type)
					.attr("data-action", update_action)
					.on("change", SoWFileUploader_ChangeHandler);
					// .on("change", system_calls.UpdateInputFieldOnServer);

				value_content = value_content.add(input_file);

				value_content = value_content.add(current_file);
			}
			else
			{
				value_content = $("<span>").append("неизвестный тип");
				console.error("unknown cutom_field.type(" + custom_field.type + ")");
			}


			// --- title part
			title_content = title_content.add($("<span>").append(custom_field.title + " "));
			if(custom_field.description.length)
			{
				var		info_button = $("<span>")	.addClass("fa fa-info-circle")
													.attr("aria-hidden", "true")
													.on("click", function() { system_calls.PopoverInfo($(this), custom_field.description); });
				title_content = title_content.add(info_button);
			}

			// --- remove button
			remove_button
						.attr("data-sow_id",	custom_field.contract_sow_id || custom_field.contract_psow_id)
						.attr("data-id",		custom_field.id)
						.on("click",			RemoveCustomField_AreYouSure_ClickHandler)
						.attr("data-action",	delete_action);


			// --- DOM building part
			row
				.append(col_title	.append(title_content))
				.append(col_value	.append(value_content))
				.append(col_remove	.append(remove_button));

			result = result.add(row);
		}
		else
		{
			console.error("custom_field object is broken");
		}

		return result;
	};

	// --- internal, don't expose it to outside
	var	RemoveCustomField_AreYouSure_ClickHandler = function(e)
	{
		var		currTag = $(this);

		$("#AreYouSureRemoveCustomField .submit").attr("data-id",				currTag.attr("data-id"));
		$("#AreYouSureRemoveCustomField .submit").attr("data-sow_id",			currTag.attr("data-sow_id"));
		$("#AreYouSureRemoveCustomField .submit").attr("data-action",			currTag.attr("data-action"));
		$("#AreYouSureRemoveCustomField .submit").data("target_to_hide",		currTag.closest(".row"));
		$("#AreYouSureRemoveCustomField .submit").attr("data-script",			"agency.cgi");
		$("#AreYouSureRemoveCustomField").modal("show");
	};

	var	GetEditableCompanyCustomField_DOM = function(custom_field)
	{
		return GetEditableCustomField_DOM(custom_field, "AJAX_updateCompanyCustomField", "AJAX_deleteCompanyCustomField", "template_company");
	};

	var	GetEditableSoWCustomField_DOM = function(custom_field)
	{
		return GetEditableCustomField_DOM(custom_field, "AJAX_updateSoWCustomField", "AJAX_deleteSoWCustomField", "template_sow");
	};

	var	GetEditablePSoWCustomField_DOM = function(custom_field)
	{
		return GetEditableCustomField_DOM(custom_field, "AJAX_updatePSoWCustomField", "AJAX_deletePSoWCustomField", "template_psow");
	};

	var	GetEditableCostCenterCustomField_DOM = function(custom_field)
	{
		return GetEditableCustomField_DOM(custom_field, "AJAX_updateCostCenterCustomField", "AJAX_deleteCostCenterCustomField", "template_costcenter");
	};

	var	SoWFileUploader_ChangeHandler = function(e)
	{
		var		currTag = $(this);
		if(e.target.files.length)
		{
			var		tmpURLObj = URL.createObjectURL(e.target.files[0]);
			var		target_element_id = currTag.data("target_element_id");
			var		formData = new FormData();

			formData.append("id", currTag.attr("data-id"));
			formData.append("type", currTag.attr("data-item_type"));
			formData.append("cover", e.target.files[0], e.target.files[0].name);

			$.ajax({
				url: "/cgi-bin/generalimageuploader.cgi",
				cache: false,
				contentType: false,
				processData: false,
				async: true,
				data: formData,
				type: 'post',
				success: function(raw_data) {
					var		jsonObj = (
								function(raw)
								{
									try
									{
										return JSON.parse(raw);
									}
									catch(e)
									{
										return false;
									}
								})(raw_data);

					if(jsonObj)
					{
						if((typeof jsonObj[0] != "undefined") && (typeof jsonObj[0].result != "undefined") && (jsonObj[0].result == "success"))
						{
							// --- update "current file" link
							var	new_link = GetExistingTemplateLink_DOM(jsonObj[0].value || jsonObj[0].filename, currTag.attr("data-item_type"));
							if(currTag.next()) currTag.next().remove();
							currTag.after(new_link);
						}
						else
						{
							system_calls.PopoverError(currTag, jsonObj.textStatus);
						}
					}
					else
					{
						setTimeout(function() { RecoverOriginalImage(); }, 500);
						system_calls.PopoverError(currTag, "Ошибка ответа сервера");
						console.error("ERROR parsing json server response");
					}

				},
				error: function(data, textStatus, errorThrown ) {
					var		jsonObj = JSON.parse(data);
					setTimeout(function() { RecoverOriginalImage(); }, 500);
					console.debug("::upload:failHandler:ERROR: " + jsonObj.textStatus);
				}
			});
		}
		else
		{
			// --- "cancel" pressed in image upload window
		}
	};


	var	BTCollapsible_ClickHandler = function(currTag)
	{
		var		bt_id = currTag.data("bt_id");
		var		reenable = false; // --- sometimes control buttons disabled before getting here, this flag keeps them disabled

		if(bt_id)
		{
			if($("#collapsible_bt_" + bt_id).attr("aria-expanded") == "true")
			{
				// --- collapse collapsible_div
			}
			else
			{
				if($(".__controll_button_" + bt_id).first().attr("disabled"))
				{
					// --- do nothing, because buttons were disabled
				}
				else
				{
					$(".__controll_button_" + bt_id).button("loading");
					reenable = true;
				}

				$.getJSON(
					'/cgi-bin/subcontractor.cgi',
					{
						"action":"AJAX_getBTEntry",
						"bt_id": bt_id
					})
					.done(function(data)
					{
						if(data.status == "success")
						{
							var		bt_item = data.bt[0];
							var		collapsible_content = $();

							collapsible_content = collapsible_content
																.add(system_calls.GetTextedBT_DOM(bt_item))
																.add(system_calls.GetApprovals_DOM(bt_item))
																.add(system_calls.GetApprovedDate_DOM(bt_item))
																.add($("<br>"))
																.add(system_calls.GetOriginalsReceivedDate_DOM(bt_item))
																.add(system_calls.GetExpectedPayDate_DOM(bt_item))
																.add(system_calls.GetPayedDate_DOM(bt_item));

							$("#collapsible_bt_" + bt_id + "_info").empty().append(collapsible_content);
							$("#collapsible_bt_" + bt_id + "_statistics").empty().append(system_calls.GetBTStatistics_DOM(bt_item));
						}
						else
						{
							console.error("BTCollapsible_ClickHandler.done(): ERROR: " + data.description);
							system_calls.PopoverError(currTag, "Ошибка: " + data.description);
						}
					})
					.fail(function(data)
					{
						setTimeout(function() {
							system_calls.PopoverError(currTag, "Ошибка ответа сервера");
						}, 500);
					})
					.always(function(data)
					{
						if(reenable)
						{
							setTimeout(function() {
								$(".__controll_button_" + bt_id).button("reset");
							}, 150);
						}
					});
			}
		}
		else
		{
			console.error("bt_id is empty");
			system_calls.PopoverError(currTag, "не найден номер таймкарты");
		}
	};

	var willSoWExpire_InXXXDays = function(sow, days)
	{
		// --- if days param is positive: this function checks if (SoW+days) is beyond today (similar to buffer after SoW expiration)
		// --- if days param is negative: this function checks if (SoW-days) is beyond today (will SoW expire in XXX days)
		var		time_now = new Date();
		var		date_sow_end, date_today;
		var		result = {isExpired: false, expiration_message: ""};
		var		temp = [];

		temp = sow.end_date.split("-");
		if(temp.length == 3)
		{
			date_today = new Date(time_now.getYear() + 1900, time_now.getMonth(), time_now.getDate());
			date_sow_end = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]) + parseInt(days));
			if(date_sow_end < date_today)
			{
				result.isExpired = true;
				result.expiration_message = system_calls.GetLocalizedDateInHumanFormatMsecSinceEvent(date_today.getTime() - date_sow_end.getTime()) + " назад";
			}
		}

		return result;
	};

	var isSoWExpired = function(sow)
	{
		return willSoWExpire_InXXXDays(sow, 0);
	};

	var willSoWExpire = function(sow, days)
	{
		var		time_now = new Date();
		var		date_sow_end, date_today;
		var		result = {isExpired: false, expiration_message: ""};
		var		days_to_expire;
		var		temp = [];

		temp = sow.end_date.split("-");
		if(temp.length == 3)
		{
			date_today = new Date(time_now.getYear() + 1900, time_now.getMonth(), time_now.getDate());
			date_sow_end = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));

			days_to_expire = (date_sow_end - date_today) / (24 * 3600 * 1000);

			if((days_to_expire >= 0) && (days_to_expire <= days))
			{
				result.isExpired = true;
				result.expiration_message = system_calls.GetLocalizedDateInHumanFormatMsecSinceEvent(date_sow_end.getTime() - date_today.getTime());
			}
		}

		return result;
	};

	var	GetTimecardApprovers_DOM = function(sow)
	{
		var		result = $();

		result = result.add($("<span>").append(sow.timecard_approvers.length ? "Таймкарты должны быть подтверждены: " : "Подтверждения таймкарт не требуется"));

		sow.timecard_approvers.forEach(function(approver, i)
		{
			if(i) result = result.add($("<span>").append(", "));
			result = result.add($("<span>").append(approver.users[0].name + " " + approver.users[0].nameLast));
		});

		return	result;
	};

	var	GetBTApprovers_DOM = function(sow)
	{
		var		result = $();

		result = result.add($("<span>").append(sow.bt_approvers.length ? "Командировочные расходы должны быть подтверждены: " : "Подтверждения командировок не требуется"));

		sow.bt_approvers.forEach(function(approver, i)
		{
			if(i) result = result.add($("<span>").append(", "));
			result = result.add($("<span>").append(approver.users[0].name + " " + approver.users[0].nameLast));
		});

		return	result;
	};

	var	GetBTExpenseTemplates_DOM = function(sow, bt_expense_assignments)
	{
		var		result = $();
		var		title_row = $("<div>").addClass("row");
		var		title_col = $("<div>").addClass("col-xs-12");
		var		title_content = $("<span>").append(sow.bt_expense_templates.length ? "Возмещаемые расходы в командировках: " : "Расходы в командировках не возмещаются");

		result = result.add(title_row);

		sow.bt_expense_templates.forEach(function(expense_template, i)
		{
			var		expense_name_row = $("<div>").addClass("row highlight_row");
			var		expense_name_col = $("<div>").addClass("col-xs-12 col-md-4");
			var		expense_desc_col = $("<div>").addClass("col-xs-12 col-md-6");
			var		expense_assignee_col = $("<div>").addClass("col-xs-12 col-md-2");
			var		expense_assignee_obj = {};
			var		expense_name_content = expense_template.title;
			var		expense_desc_content = expense_template.agency_comment;
			var		expense_assignee_content = "";

			var		table_expense_line_header_row = $("<div>").addClass("row");
			var		table_expense_line_header_col1 = $("<div>").addClass("col-xs-6 col-md-4");
			var		table_expense_line_header_col2 = $("<div>").addClass("col-xs-3 col-md-1");
			var		table_expense_line_header_col3 = $("<div>").addClass("col-xs-3 col-md-1");

			if(typeof bt_expense_assignments != "undefined")
			{
 				expense_assignee_obj = GetBTExpenseAssignmentObjByTemplateID(expense_template.id, bt_expense_assignments);
				expense_assignee_content = expense_assignee_obj.assignee_user[0].name + " " + expense_assignee_obj.assignee_user[0].nameLast;
			}

			result = result.add(
						expense_name_row
							.append(expense_name_col.append(expense_name_content))
							.append(expense_desc_col.append(expense_desc_content))
							.append(expense_assignee_col.append(expense_assignee_content))
					);
			result = result.add(table_expense_line_header_row
									.append(table_expense_line_header_col1.append(""))
									.append(table_expense_line_header_col2.append("нал."))
									.append(table_expense_line_header_col3.append("карта"))
								);


			expense_template.line_templates.sort(function(a, b)
			{
				var		order_a =	a.payment == "cash" ? 1 :
									a.payment == "cash and card" ? 2 :
									a.payment == "card" ? 3 : 4;
				var		order_b =	b.payment == "cash" ? 1 :
									b.payment == "cash and card" ? 2 :
									b.payment == "card" ? 3 : 4;

				return				order_a == order_b ?  0 :
									order_a <  order_b ? -1 : 1;
			});

			expense_template.line_templates.forEach(function(expense_line_template, i)
			{
				var		table_expense_line_row = $("<div>").addClass("row highlight_onhover");
				var		table_expense_line_col1 = $("<div>").addClass("col-xs-6 col-md-4");
				var		table_expense_line_col2 = $("<div>").addClass("col-xs-3 col-md-1");
				var		table_expense_line_col3 = $("<div>").addClass("col-xs-3 col-md-1");
				var		expense_line_cash_content;
				var		expense_line_card_content;

				if(expense_line_template.payment.search("cash") >= 0)
					expense_line_cash_content = "<i class=\"fa fa-check\" aria-hidden=\"true\"></i>";
				if(expense_line_template.payment.search("card") >= 0)
					expense_line_card_content = "<i class=\"fa fa-check\" aria-hidden=\"true\"></i>";

				result = result.add(table_expense_line_row
										.append(table_expense_line_col1.append(expense_line_template.title))
										.append(table_expense_line_col2.append(expense_line_cash_content))
										.append(table_expense_line_col3.append(expense_line_card_content))
									);
			});
		});

		title_row.append(title_col.append(title_content));


		return	result;
	};

	var	GetTaskAssignmentObjByTaksID = function(sow_id, task_id, task_assignments)
	{
		var		result = {};

		if(typeof(task_assignments) != "undefined")
		{
			for(var i = 0; i < task_assignments.length; ++i)
			{
				if((sow_id == task_assignments[i].contract_sow_id) && (task_id == task_assignments[i].timecard_tasks_id))
				{
					result = task_assignments[i];
					break;
				}
			}
		}

		return result;
	};

	var	GetBTExpenseAssignmentObjByTemplateID = function(bt_expense_template_id, bt_expense_assignments)
	{
		var		result = {};

		if(typeof(bt_expense_assignments) != "undefined")
		{
			for(var i = 0; i < bt_expense_assignments.length; ++i)
			{
				if(bt_expense_template_id == bt_expense_assignments[i].bt_expense_template_id)
				{
					result = bt_expense_assignments[i];
					break;
				}
			}
		}

		return result;
	};

	var	SetCurrentScript = function(script)
	{
		current_script_global = script;
	};

	var	UpdateInputFieldOnServer = function(e)
	{
		var		__Revert_To_Prev_Value = function()
		{
			var	input_tag; 
			
			if(curr_tag.attr("type") == "checkbox")
			{
				curr_tag.prop("checked", curr_tag.attr("data-db_value") == "Y" ? "checked" : "");
			}
			else if(curr_tag[0].tagName == "LABEL")
			{
				input_tag = $("#" + curr_tag.attr("for"));
				input_tag.prop("checked", !input_tag.prop("checked"));

			}
			else
			{
				curr_tag.val(curr_tag.attr("data-db_value"));
			}
		};

		var		__GetTagValue = function(__tag)
		{
			var	curr_value = "";
			var	input_tag; 

			if(__tag[0].tagName == "LABEL") 
			{
				__tag = $("#" + __tag.attr("for"));
				curr_value = __tag.prop("checked") ? "N" : "Y"; // --- avoid using click_handler on LABEL, replace it to change_handler of input
																// --- label doesn't immediately update related input value,
																// --- therefore click on a label with associated checkbox in OFF state
																// --- should trigger update on server to a new (ON) state
			}
			else if(__tag.attr("type") == "checkbox")
			{
				curr_value = __tag.prop("checked") ? "Y" : "N";
			}
			else
			{
				curr_value = __tag.val();
			}

			return curr_value;
		};

		var		curr_tag;
		var		curr_value;

		if(typeof(e) != "undefined")
		{
			curr_tag = $(e.currentTarget);

			if("" + curr_tag.data("id") == "0")
			{
				// --- nothing to do
				console.error("data-id not defined");
			}
			else
			{
				var		current_script = curr_tag.attr("data-script") || current_script_global;

				if(current_script.length)
				{
					curr_tag.attr("disabled", "");

					curr_value = __GetTagValue(curr_tag);
					
					$.getJSON(
						'/cgi-bin/' + current_script,
						{
							action: curr_tag.data("action"),
							id: curr_tag.attr("data-id") || curr_tag.data("id"), // --- prefer attr(data_id) over jQuery.data(id), because jQuery.data doesn't updates properly
							value: curr_value,
							sow_id: curr_tag.attr("data-sow_id"),
							company_id: curr_tag.attr("data-company_id"),
						})
						.done(function(data)
						{
							if(data.result == "success")
							{
								// don't change it to .click(), otherwise it may be infinite loop if error
								curr_tag.attr("data-db_value", curr_tag.val());
							}
							else
							{
								__Revert_To_Prev_Value();

								console.error(curr_tag.data("action") + ".done(): ERROR: " + data.description);
								system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
							}
						})
						.fail(function(e)
						{
							__Revert_To_Prev_Value();
							system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
						})
						.always(function(e)
						{
							curr_tag.removeAttr("disabled");
						});
					
				}
				else
				{
					console.error("unknown script to call. Set the script with attr(\"data-script\") or call system_calls.SetCurrentScript(\"XXXXX.cgi\");");
				}
			}
		}
		else
		{
			console.error("undefined parameter type");
		}
	};

	var	GetBankInfo_DOM = function(bank)
	{
		var		result = "";

		if((typeof bank == "object") && (typeof bank.bik != "undefined"))
		{
			result += system_calls.ConvertHTMLToText(bank.title);
			result += "<br>";

			result += "Адрес: " + bank.geo_zip_id[0].zip + ", ";
			result += bank.geo_zip_id[0].locality.region.country.title + " ";
			if(bank.geo_zip_id[0].locality.region.title.toLowerCase() == bank.geo_zip_id[0].locality.title.toLowerCase()) {}
			else { result += bank.geo_zip_id[0].locality.region.title + " "; }
			result += bank.geo_zip_id[0].locality.title + ", ";
			result += bank.address;
			result += "<br>";

			result += "Телефон: " + bank.phone;
			result += "<br>";

			result += "БИК: " + bank.bik;
			result += "<br>";

			result += "К/С: " + bank.account;
			result += "<br>";

			result += "ОКАТО: " + bank.okato;
			result += "<br>";

			result += "ОКПО: " + bank.okpo;
			result += "<br>";

			result += "Регистрационный номер: " + bank.regnum;
			result += "<br>";

			if(bank.srok.length)
			{
				result += "Срок обработки документов в днях (НЕофициальный): " + parseInt(bank.srok);
				result += "<br>";
			}
		}
		else
		{
			result += "Нет информации о банке.";
		}

		return result;
	};

	var GetCostCenterTabs_DOM = function(cost_centers, suffix, Tab_ClickHandler)
	{
		var		result = $();

		var		title_row = $("<div>").addClass("row");
		var		title_col = $("<div>").addClass("col-xs-12");

		var		title_ul = $("<ul>").addClass("nav nav-tabs");
		var		tab_content = $("<div>").addClass("tab-content");

		title_row.append(title_col);
		title_col
			.append(title_ul)
			.append(tab_content);

		for(var i = 0; i < cost_centers.length; ++i)
		{
			var		cost_center		= cost_centers[i];
			var		id				= cost_center.id;
			var		title_href		= $("<a>").addClass("__tab_href" + suffix + " _tab_order_" + i).append(cost_center.companies[0].name);
			var		title_li		= $("<li>").addClass("nav nav-tabs").append(title_href);
			var		tab_panel		= $("<div>").addClass("tab-pane fade __tab_pane" + suffix + "");

			title_href
				.attr("data-toggle", "tab")
				.attr("data-id", id)
				.attr("href", "#__tab_pane" + suffix + "_" + id);

			title_li
				.attr("data-id", id)
				.attr("data-target_elem_class", "__tab_pane" + suffix)
				.on("click", Tab_ClickHandler);

			title_ul
				.append(title_li);

			tab_panel
				.attr("id", "__tab_pane" + suffix + "_" + id)
				.attr("data-id", id);
				// .append(Math.random());

			tab_content
				.append(tab_panel);
		}

		result = result.add(title_row);

		return result;
	};

	var	SortSoWList = function(sow_list)
	{
		sow_list.sort(function(a, b)
		{
			var		arrA = a.end_date.split(/\-/);
			var		arrB = b.end_date.split(/\-/);
			var 	timeA, timeB;
			var		result = 0;
			var		statusA = a.status;
			var		statusB = b.status;

			timeA = new Date(parseInt(arrA[0]), parseInt(arrA[1]) - 1, parseInt(arrA[2]));
			timeB = new Date(parseInt(arrB[0]), parseInt(arrB[1]) - 1, parseInt(arrB[2]));

			if(timeA.getTime() == timeB.getTime()) { result = 0; }
			if(timeA.getTime() <  timeB.getTime()) { result = 1; }
			if(timeA.getTime() >  timeB.getTime()) { result = -1; }

			return result;
		});


		return sow_list;
	};

	var GetSoWBadge_DOM = function(sow_item)
	{
		var		result = $();
		var		status_label = $("<span>").addClass("label");
		var		exp_obj;

		if(sow_item.status == "expired")
		{
			exp_obj = isSoWExpired(sow_item);
			status_label
							.addClass("label-default")
							.attr("data-toggle", "tooltip")
							.attr("data-placement", "top")
							.attr("title", "закончился " + (exp_obj.isExpired ? exp_obj.expiration_message : ""))
							.append("exp");

		}
		else if(sow_item.status == "negotiating")
		{
			status_label
							.addClass("label-primary")
							.attr("data-toggle", "tooltip")
							.attr("data-placement", "top")
							.attr("title", "в процессе подписания")
							.append("sign");
/*				result = result.add(status_label);
				status_label.tooltip({ animation: "animated bounceIn"});
*/		}
		else if((sow_item.status == "signed") && (willSoWExpire(sow_item, 30).isExpired))
		{
			exp_obj = willSoWExpire(sow_item, 30);
			if(exp_obj.isExpired)
			{
				status_label
							.addClass("label-danger")
							.attr("data-toggle", "tooltip")
							.attr("data-placement", "top")
							.attr("title", "закончится через " + exp_obj.expiration_message)
							.append("exp");

			}
		}
		else if((sow_item.status == "signed") && (willSoWExpire(sow_item, 60).isExpired))
		{
			exp_obj = willSoWExpire(sow_item, 60);
			if(exp_obj.isExpired)
			{
				status_label
							.addClass("label-warning")
							.attr("data-toggle", "tooltip")
							.attr("data-placement", "top")
							.attr("title", "закончится через " + exp_obj.expiration_message)
							.append("exp");

			}
		}

		result = result.add(status_label);
		status_label.tooltip({ animation: "animated bounceIn"});

		return result;
	};

	var	GetLinkFromSoWObj_DOM = function(sow, user_type)
	{
		var	result = $("<a>").attr("href", user_type == "agency" ? "/cgi-bin/agency.cgi?action=agency_sow_edit_template&sow_id=" + sow.id + "&rand=" + Math.random() * 87346865893 : "/cgi-bin/subcontractor.cgi?action=subcontractor_sow_list_template&rand=" + Math.random() * 87346865893);

		result.append(sow.number + " от " + sow.sign_date);

		return result;
	};

	var	GetAgreemntArchiveLinkFromSoWObj_DOM = function(sow)
	{
		// var	result = $("<a>").attr("href", "/agreements_sow/" + sow.agreement_filename + "&rand=" + Math.random() * 87346865893);
		var	result = $("<a>").attr("href", "/agreements_sow/" + sow.agreement_filename + "?rand=" + Math.random() * 87346865893);

		result.append("документы на подпись");

		return result;
	};

	var	GetLinkFromCompanyObj_DOM = function(company)
	{
		var	result = $("<a>").attr("href", "/companyprofile/" + company.id + "&rand=" + Math.random() * 87346865893);

		result.append(company.name);

		return result;
	};

	var RenderSoWExpiration_DashboardApplet_DOM = function(sow_list, type)
	{
		var		expire_in_60_days = 0;
		var		expire_in_30_days = 0;
		var		expire_in_30_days_counter;
		var		expire_in_60_days_counter;
		var		separator_dom;
		var		new_dom = $();

		sow_list.forEach(function(sow)
			{
				if(sow.status == "signed")
				{
					if(system_calls.willSoWExpire(sow, 30).isExpired)
					{
						++expire_in_30_days;
					}
					else if(system_calls.willSoWExpire(sow, 60).isExpired)
					{
						++expire_in_60_days;
					}
				}
			});

		expire_in_30_days_counter = $("<strong>")
						.append(expire_in_30_days)
						.addClass("h2 cursor_pointer")
						.addClass(expire_in_30_days ? "color_red" : "color_green")
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", "закончатся в течение 30 дней")
						.on("click", function(e) { window.location.href = "/cgi-bin/" + type + ".cgi?action=" + type + "_sow_list_template&filter=__filter_will_expire_in_30_days&rand=" + Math.random() * 35987654678923; });

		expire_in_30_days_counter.tooltip({ animation: "animated bounceIn"});

		expire_in_60_days_counter = $("<strong>")
						.append(expire_in_60_days)
						.addClass("h2 cursor_pointer")
						.addClass(expire_in_60_days ? "color_orange" : "color_green")
						.attr("data-toggle", "tooltip")
						.attr("data-html", "true")
						.attr("data-placement", "top")
						.attr("title", "закончатся от 30 до 60 дней")
						.on("click", function(e) { window.location.href = "/cgi-bin/" + type + ".cgi?action=" + type + "_sow_list_template&filter=__filter_will_expire_in_60_days&rand=" + Math.random() * 35987654678923; });

		expire_in_60_days_counter.tooltip({ animation: "animated bounceIn"});

		separator_dom = $("<strong>")
						.append(" / ")
						.addClass("h2");

		new_dom = new_dom
					.add(expire_in_60_days_counter)
					.add(separator_dom)
					.add(expire_in_30_days_counter);

		return new_dom;
	};

	var isDateInFutureOrMonthAgo = function(date_to_check)
	{
		var		result = false;
		var		temp = date_to_check.split("-");
		var		now_date = new Date();
		var		month_ago_date = new Date(now_date.getFullYear(), now_date.getMonth() - 1, now_date.getDate());
		var		__date_to_check;

		if(temp.length == 3)
		{
			__date_to_check = new Date(parseInt(temp[0]), parseInt(temp[1]) - 1, parseInt(temp[2]));

			if((__date_to_check >= month_ago_date))
			{
				result = true;
			}

		}
		else
		{
			console.error("date(" + date_to_check + ") format error, must be YYYY-MM-DD");
		}

		return result;
	};

	var	GetSOWSelectBox = function(sow_list_container, active_sow_id)
	{
		var		result = $();

		if((typeof(sow_list_container) == "undefined") || (typeof(sow_list_container.sow) == "undefined"))
		{
			console.error("sow_list_container or sow_list_container.sow is undefined");
		}
		else
		{
			sow_list_container.sow.forEach(function(sow_item)
				{
					// if(isSoWExpired(sow_item).isExpired === false)
					if((sow_item.status == "signed") || (sow_item.status == "expired"))
					{
						if(willSoWExpire_InXXXDays(sow_item, SOW_EXPIRATION_BUFFER).isExpired === false)
						{
							if(isDateInFutureOrMonthAgo(sow_item.end_date) || (sow_item.id == active_sow_id))
							{
								var		tag = $("<option>")	.append(sow_item.agency_company_id[0].name + ": " + sow_item.number + " от " + sow_item.sign_date)
															.attr("data-id", sow_item.id)
															.attr("value", sow_item.id);

								if(sow_item.id == active_sow_id) tag.attr("selected", "selected");

								result = result.add(tag);
							}
							else
							{
								// don't render because it too old
							}
						}
					}
				});
		}

		return result;
	};

	var	SOWSelectBox_OnloadRender = function(sow_list_container, active_sow_id)
	{
		$("#sowSelector").empty().append(system_calls.GetSOWSelectBox(sow_list_container, active_sow_id));
	};


	// --- cookie part
	var ClearSession = function()
	{
		$.removeCookie("sessid");
		// localStorage.removeItem("sessid");

		// --- Back button will not work (prefer method, to avoid hacking)
		// window.location.replace("/?rand=" + Math.random()*98765432123456);

		// --- Like click on the link
		// window.location.href = "/?rand=" + Math.random()*98765432123456;

	};

	return {
		companyTypes: companyTypes,
		eventTypes: eventTypes,
		startTime: startTime,
		Init: Init,
		isUserSignedin: isUserSignedin,
		GetUserRequestNotifications: GetUserRequestNotifications,
		isTouchBasedUA: isTouchBasedUA,
		CutLongMessages: CutLongMessages,
		RemoveSpaces: RemoveSpaces,
		isOrientationLandscape: isOrientationLandscape,
		isOrientationPortrait: isOrientationPortrait,
		ConvertTextToHTML: ConvertTextToHTML,
		ConvertHTMLToText: ConvertHTMLToText,
		ConvertMonthNameToNumber: ConvertMonthNameToNumber,
		ConvertMonthNumberToAbbrName: ConvertMonthNumberToAbbrName,
		ConvertDateSQLToSec: ConvertDateSQLToSec,
		ConvertDateSQLToHuman: ConvertDateSQLToHuman,
		ConvertDateRussiaToHuman: ConvertDateRussiaToHuman,
		ConvertDateRussiaToHumanWithoutYear: ConvertDateRussiaToHumanWithoutYear,
		ConvertDateRussiaToHumanFullMonth: ConvertDateRussiaToHumanFullMonth,
		FilterUnsupportedUTF8Symbols: FilterUnsupportedUTF8Symbols,
		GetLocalizedWorkDurationFromDelta: GetLocalizedWorkDurationFromDelta,
		GetLocalizedDateFromSeconds: GetLocalizedDateFromSeconds,
		GetFormattedDateFromSeconds: GetFormattedDateFromSeconds,
		GetLocalizedDateNoTimeFromSeconds: GetLocalizedDateNoTimeFromSeconds,
		GetLocalizedDateFromDelta: GetLocalizedDateFromDelta,
		GetLocalizedDateInHumanFormatSecSince1970:GetLocalizedDateInHumanFormatSecSince1970,
		GetLocalizedDateInHumanFormatMsecSinceEvent:GetLocalizedDateInHumanFormatMsecSinceEvent,
		GetLocalizedRUFormatDateNoTimeFromSeconds: GetLocalizedRUFormatDateNoTimeFromSeconds,
		GetYearsSpelling: GetYearsSpelling,
		GetGenderedPhrase: GetGenderedPhrase,
		GetGenderedActionCategoryTitle: GetGenderedActionCategoryTitle,
		GetGenderedActionTypeTitle: GetGenderedActionTypeTitle,
		GetSQLFormatedDateNoTimeFromSeconds: GetSQLFormatedDateNoTimeFromSeconds,
		GetSpelledAdultsKidsNumber: GetSpelledAdultsKidsNumber,
		GetSpelledKidsNumber: GetSpelledKidsNumber,
		GetSpelledAdultsNumber: GetSpelledAdultsNumber,
		GetPluralWordSpelling: GetPluralWordSpelling,
		BuildCompanySingleBlock: BuildCompanySingleBlock,
		BuildEventSingleBlock: BuildEventSingleBlock,
		BuildGroupSingleBlock: BuildGroupSingleBlock,
		GlobalBuildFoundFriendSingleBlock: GlobalBuildFoundFriendSingleBlock,
		RenderFriendshipButtons: RenderFriendshipButtons,
		PrebuiltInitValue: PrebuiltInitValue,
		amIMeetingHost: amIMeetingHost,
		ScrollWindowToElementID: ScrollWindowToElementID,
		ScrollToAndHighlight: ScrollToAndHighlight,
		GetParamFromURL: GetParamFromURL,
		RenderCompanyLogo: RenderCompanyLogo,
		GetIntoPublicZone: GetIntoPublicZone,
		GetUUID: GetUUID,
		GetDurationSpellingInHoursAndMinutes: GetDurationSpellingInHoursAndMinutes,
		GetMinutesSpelling: GetMinutesSpelling,
		GetHoursSpelling: GetHoursSpelling,
		GetDaysSpelling: GetDaysSpelling,
		GetMonthsSpelling: GetMonthsSpelling,
		PopoverError: PopoverError,
		PopoverInfo: PopoverInfo,
		AlertError: AlertError,
		RenderRating: RenderRating,
		DrawCompanyLogoAvatar: DrawCompanyLogoAvatar,
		DrawPictureAvatar: DrawPictureAvatar,
		DrawTextLogo: DrawTextLogo,
		DrawTextAvatar: DrawTextAvatar,
		GetUserInitials: GetUserInitials,
		GetCompanyInitials: GetCompanyInitials,
		ReplaceTextLinkToURL: ReplaceTextLinkToURL,
		LongestWordSize: LongestWordSize,
		LongestWord: LongestWord,
		DataURItoBlob: DataURItoBlob,
		isPdf: isPdf,
		GetBlob_ScaledDownTo640x480: GetBlob_ScaledDownTo640x480,
		DrawImgOnCanvas_ScaleImgDownTo640x480: DrawImgOnCanvas_ScaleImgDownTo640x480,
		GetCurrentGridOption: GetCurrentGridOption,
		CreateAutocompleteWithSelectCallback: CreateAutocompleteWithSelectCallback,
		Position_InputHandler: Position_InputHandler,
		isElementInList: isElementInList,
		isIDInTheJQueryList: isIDInTheJQueryList,
		FillArrayWithNumbers: FillArrayWithNumbers,
		isAdvancedUpload: isAdvancedUpload,
		AddDragNDropFile: AddDragNDropFile,

		// --- companies
		GetCompanyInfo_DOM: GetCompanyInfo_DOM,

		// --- EXIF
		Exif_FixOrientation: Exif_FixOrientation,
		Exif_RemoveClasses: Exif_RemoveClasses,

		// --- timecards
		GetTotalNumberOfWorkingHours:GetTotalNumberOfWorkingHours,
		GetApproverIdxByID: GetApproverIdxByID,
		GetTimecardHead: GetTimecardHead,
		GetTextedTimecard_DOM: GetTextedTimecard_DOM,
		GetSumHoursFromTimecard: GetSumHoursFromTimecard,
		GetApprovals_DOM: GetApprovals_DOM,
		GetApprovedDate_DOM: GetApprovedDate_DOM,
		GetRejectedDate_DOM: GetRejectedDate_DOM,
		GetSavedDate_DOM: GetSavedDate_DOM,
		GetPayedDate_DOM: GetPayedDate_DOM,
		GetExpectedPayDate_DOM: GetExpectedPayDate_DOM,
		GetOriginalsReceivedDate_DOM: GetOriginalsReceivedDate_DOM,
		GetTextedBT_DOM: GetTextedBT_DOM,
		GetSubmittedDate_DOM: GetSubmittedDate_DOM,
		GetHoursStatistics: GetHoursStatistics,
		GetHoursStatistics_DOM: GetHoursStatistics_DOM,
		isWeekDay: isWeekDay,
		GetHolidayName: GetHolidayName,
		GetDayClass: GetDayClass,
		RoundedTwoDigitSub: RoundedTwoDigitSub,
		RoundedTwoDigitMul: RoundedTwoDigitMul,
		RoundedTwoDigitDiv: RoundedTwoDigitDiv,
		RoundedTwoDigitSum: RoundedTwoDigitSum,
		GetSoWCustomFieldObject: GetSoWCustomFieldObject,
		GetEditableCompanyCustomField_DOM: GetEditableCompanyCustomField_DOM,
		GetEditableSoWCustomField_DOM: GetEditableSoWCustomField_DOM,
		GetEditablePSoWCustomField_DOM: GetEditablePSoWCustomField_DOM,
		GetEditableCostCenterCustomField_DOM: GetEditableCostCenterCustomField_DOM,
		shouldIActOnObject: shouldIActOnObject,
		GetSumRublesFromBT: GetSumRublesFromBT,
		GetBTDurationInDays: GetBTDurationInDays,
		GetBTStatistics_DOM: GetBTStatistics_DOM,
		BTCollapsible_ClickHandler: BTCollapsible_ClickHandler,
		isSoWExpired: isSoWExpired,
		GetTimecardApprovers_DOM: GetTimecardApprovers_DOM,
		GetBTApprovers_DOM: GetBTApprovers_DOM,
		GetBTExpenseTemplates_DOM: GetBTExpenseTemplates_DOM,
		GetTaskAssignmentObjByTaksID: GetTaskAssignmentObjByTaksID,
		GetBTExpenseAssignmentObjByTemplateID: GetBTExpenseAssignmentObjByTemplateID,
		SetCurrentScript: SetCurrentScript,
		UpdateInputFieldOnServer: UpdateInputFieldOnServer,
		GetBankInfo_DOM: GetBankInfo_DOM,
		GetCostCenterTabs_DOM: GetCostCenterTabs_DOM,
		SortSoWList: SortSoWList,
		GetSoWBadge_DOM: GetSoWBadge_DOM,
		GetLinkFromCompanyObj_DOM: GetLinkFromCompanyObj_DOM,
		GetAgreemntArchiveLinkFromSoWObj_DOM: GetAgreemntArchiveLinkFromSoWObj_DOM,
		GetLinkFromSoWObj_DOM: GetLinkFromSoWObj_DOM,
		willSoWExpire: willSoWExpire,
		willSoWExpire_InXXXDays: willSoWExpire_InXXXDays,
		RenderSoWExpiration_DashboardApplet_DOM: RenderSoWExpiration_DashboardApplet_DOM,
		SoWFileUploader_ChangeHandler: SoWFileUploader_ChangeHandler,
		SetExpenseItemDocTagAttributes: SetExpenseItemDocTagAttributes,
		isDateInFutureOrMonthAgo: isDateInFutureOrMonthAgo,
		GetSOWSelectBox: GetSOWSelectBox,
		SOWSelectBox_OnloadRender: SOWSelectBox_OnloadRender,

		// --- cookie
		ClearSession: ClearSession
	};
})();

var	InfoObj = function() 
{
	var	target_tag_global;
	var	dom_global;

	var	SetInfoDOM = function(param) { dom_global = param; };
	var	GetInfoDOM = function() { return dom_global; };

	var	GetDOM = function(info_type, src_selector, id_param)
	{
		var	result_obj = {};
		var	id;
		var	button	= $("<i>")		.addClass("fa fa-question-circle cursor_pointer")
									.on("click", ClickHandler);
		var	info	= $("<div>")	.addClass("row alert alert-info")
									.hide()
									.append($("<div>")	.addClass("col-xs-offset-3 col-xs-9 col-md-offset-2 col-md-10 __content"));

		if(src_selector && src_selector.length)
		{
			if(id_param)
			{
				id = id_param;
			}
			else
			{
				do
				{
					id = Math.trunc(Math.random() * 628374654567890);
				} while($("#info_placeholder_" + id).length);
			}

			button	.attr("data-target_selector", "#info_placeholder_" + id)
					.attr("data-src_selector", src_selector)
					.attr("data-info_type", info_type);
			info	.attr("id", "info_placeholder_" + id);
		}
		else
		{
			console.error("src_selector is not defined");
		}

		return {button:button, info: info};
	};

	var	ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	info_type = curr_tag.attr("data-info_type");
		var	src_tag = $(curr_tag.attr("data-src_selector")).first(); // --- first() is a WA in case selector gets multiple tags (for ex: .__company_ogrn_XXX)
		var	src_text = src_tag.prop("tagName") == "INPUT" ? src_tag.val() : src_tag.text();
		
		target_tag_global = $(curr_tag.attr("data-target_selector"));

		RefreshTargetContent(
								info_type == "BANK" ? DecodeBank(GetInfoDOM()) :
								info_type == "OGRN" ? DecodeOGRN(src_text) :
								info_type == "KPP" ? DecodeKPP(src_text) :
								src_text
							);

		target_tag_global.show(200);
		setTimeout(function() { target_tag_global.hide(200); }, 5000);
	};

	var	RefreshTargetContent = function(content)
	{
		target_tag_global.find(".__content").empty().append(content);
	};

	var	DecodeOGRN = function(ogrn_input)
	{
		var	ogrn_text = "";
		var	GetOGRNParsingText = function(ogrn, region_name)
		{
			var		result = "";
			var		year;
			var		crc;
			var		original_ogrn;
			var		partial_ogrn;

			if((ogrn.length == 15) && (ogrn[0] == "3") || (ogrn[0] == "4"))
			{
				crc = parseInt(ogrn[14]);
				original_ogrn = parseInt(ogrn);
				partial_ogrn = parseInt(ogrn.substr(0, 14));

				if((partial_ogrn - Math.floor(partial_ogrn / 13) * 13) % 10 == crc)
				{
					if(ogrn[0] == "3") result += "Запись относится к основному регистрационному номеру";
					if(ogrn[0] == "4") result += "Запись относится к другому государственному регистрационному номеру";
					result += "<br>";

					year = 2000 + parseInt(ogrn[1] + ogrn[2]);
					result += "Год открытия компании 2017";
					result += "<br>";

					result += "Регион регистрации: " + (region_name || "");
					result += "<br>";

					result += "Код подразделения ИФНС: " + ogrn[5] + ogrn[6];
					result += "<br>";

					result += "Порядковый номер записи в реестре: " + ogrn.substring(7,14);
					result += "<br>";
				}
			}
			else if((ogrn.length == 13) && (ogrn[0] == "1") || (ogrn[0] == "2"))
			{
				crc = parseInt(ogrn[12]);
				original_ogrn = parseInt(ogrn);
				partial_ogrn = parseInt(ogrn.substr(0, 12));

				if((partial_ogrn - Math.floor(partial_ogrn / 11) * 11) % 10 == crc)
				{
					if(ogrn[0] == "1") result += "Запись относится к юридическому лицу";
					if(ogrn[0] == "2") result += "Запись относится к государственному учреждению";
					result += "<br>";

					year = 2000 + parseInt(ogrn[1] + ogrn[2]);
					result += "Год открытия компании " + year;
					result += "<br>";

					result += "Регион регистрации: " + (region_name || "");
					result += "<br>";

					result += "Код подразделения ИФНС: " + ogrn[5] + ogrn[6];
					result += "<br>";

					result += "Номер решения: " + ogrn.substring(7,12);
					result += "<br>";
				}
			}

			if(result.length === 0) result += "Некорректный ОГРН/ОГРНИП";

			return result;
		};


		if((ogrn_input.length == 13) || (ogrn_input.length == 15))
		{
			ogrn_text = GetOGRNParsingText(ogrn_input);

			$.getJSON(
				'/cgi-bin/ajax_anyrole_1.cgi',
				{
					action: "AJAX_getGeoRegionName",
					id: ogrn_input.substring(3,5)
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						// --- refresh content one more time once GeoRegion info received
						RefreshTargetContent(GetOGRNParsingText(ogrn_input, data.geo_region.name));
					}
					else
					{
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(e)
				{
					system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
				});

		}
		else
		{
			ogrn_text = "Некорректный ОГРН/ОГРНИП";
		}

		return ogrn_text;
	};

	var	DecodeKPP = function(kpp_input)
	{
		var	kpp_text = "";
		var	GetKPPParsingText = function(kpp, region_name)
		{
			var		result = "";

			if((kpp.length == 9))
			{
				var	kpp_reason = kpp.substring(4, 6);

				if(kpp_reason == "01") kpp_reason = "по месту ее нахождения";
				if(kpp_reason == "50") kpp_reason = "в качестве крупнейшего налогоплательщика";
				if((parseInt(kpp_reason) >= 2) && (parseInt(kpp_reason) <= 5))   kpp_reason = "по месту нахождения обособленного подразделения организации";
				if((parseInt(kpp_reason) >= 31) && (parseInt(kpp_reason) <= 32)) kpp_reason = "по месту нахождения обособленного подразделения организации";
				if((parseInt(kpp_reason) >= 6) && (parseInt(kpp_reason) <= 8))   kpp_reason = "по месту нахождения принадлежащего недвижимого имущества";
				if((parseInt(kpp_reason) >= 10) && (parseInt(kpp_reason) <= 29)) kpp_reason = "по месту нахождения принадлежащих транспортных средств";


				result += "Регион обслуживания: " + (region_name || "");
				result += "<br>";

				result += "Код подразделения ИФНС: " + kpp.substring(2, 4);
				result += "<br>";

				result += "Причина постановки на учет: " + kpp_reason;
				result += "<br>";

				result += "Количество раз организация вставала на учет по данной причине: " + kpp.substring(6, 9);
				result += "<br>";
			}

			if(result.length === 0) result += "Некорректный КПП";

			return result;
		};


		if((kpp_input.length == 9))
		{
			kpp_text = GetKPPParsingText(kpp_input);

			$.getJSON(
				'/cgi-bin/ajax_anyrole_1.cgi',
				{
					action: "AJAX_getGeoRegionName",
					id: kpp_input.substring(0, 2)
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						RefreshTargetContent(GetKPPParsingText(kpp_input, data.geo_region.name));
					}
					else
					{
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(e)
				{
					system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
				});
		}
		else if(/^0+$/.test(kpp_input))
		{
			kpp_text = "КПП не указан";
		}
		else
		{
			kpp_text = "Некорректный КПП";
		}

		return kpp_text;
	};

	var	DecodeBank = function(bank_input)
	{
		return bank_input;
	};
	
	return {
		GetDOM: GetDOM,
		SetInfoDOM: SetInfoDOM,
	};
};

// --- use cache carefully !
// --- cache is not updating edit_profile user_changes
var userCache = (function()
{
	"use strict";
	var		cache = []; // --- main sotage
	var		userCacheFutureUpdateArr = []; // --- used for update userCache object with new users
	var		callbackRunAfterUpdateArr = [];
	var		runLock = false; // --- semaphore for racing conditions

	var		UpdateWithUser = function(userObj)
	{
		var		updatedFlag = false;

		cache.forEach(function(item, i, arr)
			{
				if(cache[i].id == userObj.id)
				{
					cache[i] = item;
					updatedFlag = true;
				}
			});

		if(!updatedFlag) cache.push(userObj);
	};

	var		GetUserByID = function(userID)
	{
		var		result = {};

		cache.forEach(function(item, i, arr)
			{
				if(item.id == userID)
				{
					result = item;
				}
			});

		return result;
	};

	var		isUserCached = function(userID)
	{
		var		result = false;

		cache.forEach(function(item, i, arr)
			{
				if(item.id == userID)
				{
					result = true;
				}
			});

		return result;
	};

	var 	AddUserIDForFutureUpdate = function(userID)
	{
		userCacheFutureUpdateArr.push(userID);
	};

	var		AddCallbackRunsAfterCacheUpdate = function(func)
	{
		var		updateFlag = true;

		// --- add callback function just in case userscache not empty
		// --- otherwise there is no value to runn callback without any changes
		if(userCacheFutureUpdateArr.length)
		{
			callbackRunAfterUpdateArr.forEach(function(item)
			{
				if(item == func) updateFlag = false;
			});

			if(updateFlag) callbackRunAfterUpdateArr.push(func);
		}
	};

	var		RequestServerToUpdateCache = function()
	{
		if(!runLock)
		{
			runLock = true; // --- lock-on, otherwise callbacklist will be cleared.

			// --- following two lines trying to speedup operations with userCacheUpdateArr
			// --- to reduce probability of racing conditions
			var		param1 = userCacheFutureUpdateArr.join();
			userCacheFutureUpdateArr = []; 	// --- avoid repeating requests to server

			if(param1.length)
			{
				$.getJSON('/cgi-bin/system.cgi', { action: 'GetUserInfo', userID: param1 })
					.done(
						function(result)
						{
							if((result.session == "true") && (result.user == "true") && (result.type == "UserInfo"))
							{
								result.userArray.forEach(function(item, i, arr)
								{
									UpdateWithUser(item);
								});

								callbackRunAfterUpdateArr.forEach(function(item, i, arr)
								{
									item();
								});
								callbackRunAfterUpdateArr = []; // --- safety measures to avoid repeated calling callback functions

							}

							runLock = false;
						});
			}
			else
			{
				callbackRunAfterUpdateArr.forEach(function(item, i, arr)
				{
					item();
				});
				callbackRunAfterUpdateArr = []; // --- safety measures to avoid repeated calling callback functions
				runLock = false;
			} // --- if userCacheFutureUpdateArr not empty
		} // --- run lock
	};

	return {
		// cache: cache,
		UpdateWithUser: UpdateWithUser,
		GetUserByID: GetUserByID,
		isUserCached: isUserCached,
		AddUserIDForFutureUpdate: AddUserIDForFutureUpdate,
		AddCallbackRunsAfterCacheUpdate: AddCallbackRunsAfterCacheUpdate,
		RequestServerToUpdateCache: RequestServerToUpdateCache
	};
})();

var DrawUserAvatar = function(canvas, avatarPath, userName, userNameLast)
{
	"use strict";

	if((typeof(avatarPath) == "undefined") || (avatarPath == "empty") || (avatarPath === ""))
	{
		// --- canvas.canvas.width returning width of canvas
		system_calls.DrawTextAvatar(canvas, system_calls.GetUserInitials(userName, userNameLast), canvas.canvas.width);
	}
	else
	{
		system_calls.DrawPictureAvatar(canvas, avatarPath, canvas.canvas.width);
	}
};

// --- difference from user:
// --- user avatar - fit into quad with shortest side (crop other dimension)
// --- company log - fit into quad with longest side (no crop)
// --- INPUT:
//            usually userNameLast = ""
var DrawCompanyAvatar = function(canvas, avatarPath, company_name, userNameLast)
{
	"use strict";

	if((avatarPath == "empty") || (avatarPath === ""))
	{
		// --- canvas.canvas.width returning width of canvas
		system_calls.DrawTextLogo(canvas, system_calls.GetCompanyInitials(company_name), canvas.canvas.width);
	}
	else
	{
		system_calls.DrawCompanyLogoAvatar(canvas, avatarPath, canvas.canvas.width);
	}
};
// --- avatar part end

navMenu_search = (function()
{
	"use strict";

	var AutocompleteList = [];

	var	AutocompleteSelectHandler = function(event, ui)
	{
		var	selectedID = ui.item.id;
		var selectedLabel = ui.item.label;

		console.debug("navMenu_search.AutocompleteSelectHandler: start. (seletedID=" + selectedID + ", selectedLabel=" + selectedLabel + ")");

		window.location.href = "/userprofile/" + selectedID;

		console.debug("navMenu_search.AutocompleteSelectHandler: end");
	};

	var OnInputHandler = function()
	{
		var		inputValue = $(this).val();
		console.debug("navMenu_search.OnInputHandler: start. input.val() " + $(this).val());

		if(inputValue.length >= 2)
		{
			$.getJSON(
				'/cgi-bin/index.cgi',
				{action:"JSON_getFindFriendsListAutocomplete", lookForKey:inputValue})
				.done(function(data) {
						AutocompleteList = [];
						data.forEach(function(item, i, arr)
							{
								AutocompleteList.push({id:item.id , label:item.name + " " + item.nameLast + " " + item.currentCity});
							});


						$("#navMenuSearchText").autocomplete({
							delay : 300,
							source: AutocompleteList,
							select: AutocompleteSelectHandler,
							change: function (event, ui) {
								console.debug ("navMenu_search.OnInputHandler autocomplete.change: change event handler");
							},
							close: function (event, ui)
							{
								console.debug ("navMenu_search.OnInputHandler autocomplete.close: close event handler");
							},
							create: function () {
								console.debug ("navMenu_search.OnInputHandler autocomplete.create: _create event handler");
							},
							_renderMenu: function (ul, items)  // --- requres plugin only
							{
								var	that = this;
								var currentCategory = "";
								$.each( items, function( index, item ) {
									var li;
								    if ( item.category != currentCategory ) {
								    	ul.append( "<li class='ui-autocomplete-category'>" + item.category + "</li>" );
								        currentCategory = item.category;
								    }
									li = that._renderItemData( ul, item );
									if ( item.category ) {
									    li.attr( "aria-label", item.category + " : " + item.label + item.login );
									} // --- getJSON.done() autocomplete.renderMenu foreach() if(item.category)
								}); // --- getJSON.done() autocomplete.renderMenu foreach()
							} // --- getJSON.done() autocomplete.renderMenu
						}); // --- getJSON.done() autocomplete
					}); // --- getJSON.done()

		}
		else
		{
			AutocompleteList = [];
			$("#navMenuSearchText").autocomplete({
							delay : 300,
							source: AutocompleteList
						});
		} // --- if(inputValue.length >= 2)

		console.debug("navMenu_search.OnInputHandler: end ");
	};


	var OnKeyupHandler = function(event)
	{
		/* Act on the event */
		var	keyPressed = event.keyCode;

		console.debug("navMenu_search.OnKeyupHandler: start. Pressed key [" + keyPressed + "]");

		if(keyPressed == 13) {
			/*Enter pressed*/
			$("#navMenuSearchText").autocomplete("close");
			// FindFriendsFormSubmitHandler();
		}

		console.debug("navMenu_search.OnKeyupHandler: end");
	};

	var OnSubmitClickHandler = function(event)
	{
		var		searchText = $("#navMenuSearchText").val();

		console.debug("navMenu_search.OnSubmitClickHandler: start");

		if(searchText.length <= 2)
		{
			$("#navMenuSearchText").attr("title", "Напишите более 2 букв")
									.attr("data-placement", "bottom")
									.tooltip('show');
			window.setTimeout(function()
				{
					$("#navMenuSearchText").tooltip('destroy');
				}, 3000);
			return false;
		}
	};

	return {
		OnInputHandler: OnInputHandler,
		OnKeyupHandler: OnKeyupHandler,
		OnSubmitClickHandler: OnSubmitClickHandler
	};
})();

navMenu_chat = (function()
{
	"use strict";

	var	chatUserList;
	var	userArray = [];
	var	unreadMessagesArray = [];

	var	UnreadMessageButtonClickHandler = function()
	{
	};

	var	GetUserInfoByID = function(messageID)
	{

	};

	var CutLongMultilineMessages = function(message)
	{
		var		lineList;
		var		cutMessage = [];

		lineList = message;
		lineList = lineList.replace(/\&ishort\;/g, "й");
		lineList = lineList.replace(/\&euml\;/g, "ё");
		lineList = lineList.replace(/\&zsimple\;/g, "з");
		lineList = lineList.replace(/\&Ishort\;/g, "Й");
		lineList = lineList.replace(/\&Euml\;/g, "Ё");
		lineList = lineList.replace(/\&Zsimple\;/g, "З");
		lineList = lineList.replace(/\&Norder;\;/g, "№");
		lineList = lineList.replace(/<br>/g, "\n").replace(/\r/g, "").split("\n");

		lineList.forEach(function(item, i, arr)
			{
				if(i < 3)
				{
					cutMessage.push(item.substr(0,45) + (item.length > 45 ? " ..." : ""));
				}
			});
		if(lineList.length > 3)
		{
			cutMessage.push("...");
		}

		return cutMessage.join("<br>");
	};

	var	BuildUnreadMessageList = function()
	{

		var		resultDOM = $();
		var		messageCounter = 0;


		if(!unreadMessagesArray.length)
		{
			$("#user-chat-ul").empty();
		}
		unreadMessagesArray.forEach(
			function(item, i, arr)
			{
				if(i < 5)
				{

					var		messageInfo = item;
					var		userInfo = jQuery.grep(userArray, function(n, i) { return (n.id == messageInfo.fromID); });
							userInfo = userInfo[0];
					var		userSpan = $("<div/>").addClass("UnreadChatListSpan");
					var		buttonSpan = $("<span/>").addClass("UnreadChatListButtonSpan");
					var		liUser = $("<li/>").addClass("dropdown-menu-li-higher")
												.addClass(messageInfo.messageStatus);
					var		liDivider = $("<li/>").addClass("divider");
					var		buttonReply = $("<button>")	.addClass("btn btn-link")
														.append($("<span>").addClass("glyphicon glyphicon-pencil"))
														.data("action", "reply")
														.on("click", function(e)
															{
																var		newURL =  "/chat/" + messageInfo.fromID + "?rand=" + Math.random()*98765432123456;
																window.location.href = newURL;
																e.stopPropagation();
															});
					var		buttonClose = $("<button>")	.addClass("btn btn-link")
														.append($("<span>").addClass("glyphicon glyphicon-remove"))
														.data("action", "markAsRead")
														.on("click", function(e)
															{
																$.getJSON('/cgi-bin/index.cgi', {action:"AJAX_chatMarkMessageReadByMessageID", messageid:messageInfo.id})
																			.done(function(data)
																				{
																					if(data.result == "success")
																					{
																						GetUserChatMessages();
																					}
																					else
																					{
																						console.error("AJAX_chatMarkMessageReadByMessageID: ERROR: " + data.description);
																					}
																				});

																e.stopPropagation();
															});
					var		canvasAvatar = $("<canvas/>")	.attr("width", "30")
															.attr("height", "30")
															.addClass('canvas-big-avatar')
															.addClass("UnreadChatListOverrideCanvasSize");
					var		messageBody = $("<div>").addClass("UnreadChatListMessage")
														.on("click", function(e)
															{
																window.location.href = "/chat/" + messageInfo.fromID + "?rand=" + Math.random()*98765432123456;
																e.stopPropagation();
															});

					messageCounter++;

					Object.keys(messageInfo).forEach(function(itemChild, i, arr) {
						buttonClose.data(itemChild, messageInfo[itemChild]);
						buttonReply.data(itemChild, messageInfo[itemChild]);
					});

					buttonClose.on("click", UnreadMessageButtonClickHandler);
					buttonReply.on("click", UnreadMessageButtonClickHandler);

					resultDOM = resultDOM.add(liUser);

					var hrefTemp = $("<a/>").attr("href", "/userprofile/" + userInfo.id)
							.addClass("UnreadChatListHrefLineHeigh")
							.append(system_calls.CutLongMessages(userInfo.name + " " + userInfo.nameLast, 19));
					userSpan.append(canvasAvatar)
							.append(hrefTemp)
							.append(buttonSpan);
					buttonSpan
							.append(buttonReply)
							.append(" ")
							.append(buttonClose);

					messageBody.append((item.messageType == "text" ? CutLongMultilineMessages(item.message) : "<i>Вам прислали картинку</i>"));

					DrawUserAvatar(canvasAvatar[0].getContext("2d"), userInfo.avatar, userInfo.name, userInfo.nameLast);

					liUser	.append(userSpan)
							.append($("<br/>"))
							.append($("<br/>"))
							.append(messageBody);

					if((messageCounter < arr.length) && (messageCounter < 5))
					{
						resultDOM = resultDOM.add(liDivider);
					}

					if((messageCounter == arr.length) || (messageCounter == 5))
					{
						$("#user-chat-ul").empty()
											.append(resultDOM);

						// --- if number of unread messages > allowed to display
						if((arr.length - 1) > messageCounter)
						{
							var		liSystemMessage = $("<li/>").addClass("dropdown-menu-li-higher")
																.addClass(messageInfo.messageStatus)
																.append("<div class=\"text_align_center\"><i><a href=\"/chat?rand=" + Math.random()*98765432123456 + "\">еще сообщения</a></i></div>");

							$("#user-chat-ul").append(liDivider).append(liSystemMessage);
						}
					}
				}
			});

	};

	var GetUserChatMessages = function()
	{

		if(system_calls.isUserSignedin())
		{

			$.getJSON(
				'/cgi-bin/system.cgi',
				{action:"GetNavMenuChatStatus"})
				.done(function(data)
					{
						if(data.type == "ChatStatus")
						{
							if(data.session == "true")
							{
								if(data.user == "true")
								{

									var	badgeSpan = $("<span/>").addClass("badge")
																.addClass("badge-danger");

									userArray = data.userArray;
									unreadMessagesArray = data.unreadMessagesArray;
									if(unreadMessagesArray.length)
									{
											badgeSpan.append(unreadMessagesArray.length);
									}

									// console.debug("GetUserChatMessages: DoneHandler: put a badge [" + unreadMessagesArray.length + "]");

									$("#user-chat-ahref .badge").remove();
									$("#user-chat-ahref").append(badgeSpan);

									chatUserList = data;

									BuildUnreadMessageList();
								}
								else
								{
									// --- workflow can get here just in case
									// --- 	1) EchoRequest: session-ok, user-ok
									// ---	AND
									// ---	2) GetNavMenuChatStatus: session-ok, user-NOT_ok
									// --- it means:
									// ---	*) session expired in short period of time
									// ---  OR
									// ---  *) iOS buggy behavior (assign old cookie in about 3 secs after page reload)
									console.error("GetUserChatMessages: DoneHandler: ERROR: guest user");
									system_calls.GetIntoPublicZone();
								} // --- if(data.user == "true")
							}
							else
							{
								console.error("GetUserChatMessages: DoneHandler: ERROR: session do not exists on server, session must be deleted, parent window must be redirected");

								system_calls.ClearSession();
								system_calls.GetIntoPublicZone();
							} // --- if(data.session == "true")
						} // --- if(data.type == "UnreadChatMessages")
					} // --- function(data)
				);

		} // --- if(system_calls.isUserSignedin())
		else
		{
			// --- user not signed in (no need to check notifications)
		}

		// --- check system notifications
		window.setTimeout(GetUserChatMessages, 60000);
	};

	var GetNumberOfUnreadMessages = function()
	{
		return unreadMessagesArray.length;
	};

	return {
		GetUserChatMessages: GetUserChatMessages,
		GetNumberOfUnreadMessages: GetNumberOfUnreadMessages
	};
}
)();

navMenu_userNotification = (function()
{
	"use strict";

	var		userNotificationsArray = []; // --- storing all notifications

	var	InitilizeData = function (data)
	{
		userNotificationsArray = data;

		userNotificationsArray.forEach(function(item, i, arr)
		{
			if(((item.notificationTypeID == "67") || (item.notificationTypeID == "68") || (item.notificationTypeID == "69") || (item.notificationTypeID == "70")) && (item.notificationEvent[0].isBlocked == "Y"))
			{
				// --- don't show NvaBar notifications about blocked events
				userNotificationsArray.splice(i, 1);
			}
		});
	};

	var	DeleteButtonClickHandler = function()
	{
	};


	var	ReplaceUserIDTagsToUserName = function(src)
	{
		var		result = src;
		var		userRegex = /@[0-9]+/g;
		var		matchArray = src.match(userRegex);
		var		userArray = [];

		// --- if users tags found in notification text
		if(matchArray)
		{
			matchArray.forEach(function(item)
				{
					// --- substr'ing: @1030 -> 1030
					if(userCache.isUserCached(item.substr(1, item.length - 1)))
					{
						var 	user = userCache.GetUserByID(item.substr(1, item.length - 1));

						userArray["@" + user.id] = user.name + " " + user.nameLast;
					}
					else
					{
						userCache.AddUserIDForFutureUpdate(item.substr(1, item.length - 1));
					}
				});
		}

		Object.keys(userArray).forEach(function(item)
		{
			function convert(str, match, offset, s)
			{
				return "<i>" + userArray[match] + "</i>";
			}
			result = result.replace(/(@\d+)/g, convert);
		});

		return result;
	};

	var	GetAdditionalTitle = function(notificationObj)
	{
		var		result = "";

		// --- comment provided
		if(notificationObj.notificationTypeID == "19")
		{
			if((typeof notificationObj.notificationCommentTitle != "undefined"))
			{
				result = ": &quot;" + ReplaceUserIDTagsToUserName(notificationObj.notificationCommentTitle) + "&quot;";
			}
		}
		// --- vacancy rejected
		if(notificationObj.notificationTypeID == "59")
		{
			if((typeof notificationObj.notificationVacancy != "undefined") && notificationObj.notificationVacancy.length)
			{
				result = " " + notificationObj.notificationVacancy[0].company_position_title + "";
			}
		}
		// --- gift thank
		if(notificationObj.notificationTypeID == "66")
		{
			if((typeof notificationObj.gifts == "object") && notificationObj.gifts.length && (typeof notificationObj.gifts[0].title != "undefined"))
			{
				result = " " + notificationObj.gifts[0].title + " ";
			}
			if((typeof notificationObj.notificationComment != "undefined"))
			{
				result += ": &quot;" + notificationObj.notificationComment + "&quot;";
			}
		}


		return result;
	};

	var	BuildUserNotificationList = function()
	{

		var		resultDOM = $();
		var		notificationCounter = 0;

		if(userNotificationsArray.length === 0)
		{
			$("#user-notification-ul")
				.empty()
				.append($("<center>").append("нет новых извещений").addClass("color_grey"));
		}
		else
		{
			userNotificationsArray.forEach(
				function(item, i, arr)
				{
					var avatarLink;
					var hrefTemp;

					if(notificationCounter < 6)
					{

						var		notificationInfo = item;
						var		userSpan = $("<div/>").addClass("UnreadChatListSpan");
						var		liDivider = $("<li/>").addClass("divider");
						var		buttonSpan = $("<span/>").addClass("UnreadChatListButtonSpan");
						var		liUser = $("<li/>").addClass("dropdown-menu-li-higher")
													.addClass(notificationInfo.messageStatus);
						var		buttonReply = $("<button>")	.addClass("btn btn-link")
															.append($("<span>").addClass("glyphicon glyphicon-pencil"))
															.attr("data-action", "reply")
															.on("click", function(e)
																{
																	var		newURL =  "/notification/" + notificationInfo.fromID + "?rand=" + Math.random()*98765432123456;
																	window.location.href = newURL;
																	e.stopPropagation();
																});
						var		buttonClose = $("<button>")	.attr("data-action", "markAsRead")
															.attr("id", "notifClose" + item.notificationID)
															.append($("<span>").addClass("glyphicon glyphicon-remove"))
															.addClass("btn btn-link")
															.on("click", function(e)
																{
																	$.getJSON('/cgi-bin/index.cgi', {action:"AJAX_notificationMarkMessageReadByMessageID", notificationID:item.notificationID})
																				.done(function(data)
																					{
																						if(data.result == "success")
																						{
																						}
																						else
																						{
																							console.error("AJAX_notificationMarkMessageReadByMessageID: ERROR: " + data.description);
																						}
																					});

																	userNotificationsArray.forEach(function(item2, i2, arr2)
																		{
																			if(userNotificationsArray[i2].notificationID == item.notificationID)
																			{
																				userNotificationsArray[i2].notificationStatus = "read";
																			}
																		});
																	BuildUserNotificationList();

																	e.stopPropagation();
																});
						var		canvasAvatar = $("<canvas/>")	.attr("width", "30")
																.attr("height", "30")
																.addClass('canvas-big-avatar')
																.addClass("UnreadChatListOverrideCanvasSize");
						var		messageBody = $("<div>").addClass("UnreadChatListMessage")
															.on("click", function(e)
																{
																	window.location.href = "/user_notifications?scrollto=notificationInfo" + item.notificationID + "&rand=" + Math.random()*98765432123456;
																	e.stopPropagation();
																});

						resultDOM = $();

						if((notificationCounter < arr.length) && (notificationCounter < 5) && (item.notificationStatus == "unread"))
						{
								var		notificationBody = "";

								Object.keys(notificationInfo).forEach(function(itemChild, i, arr) {
									buttonClose.data(itemChild, notificationInfo[itemChild]);
									buttonReply.data(itemChild, notificationInfo[itemChild]);
								});

								if(notificationCounter) resultDOM = resultDOM.add(liDivider);
								resultDOM = resultDOM.add(liUser);

								if((typeof item.notificationFriendUserID != "undefined") || (typeof item.notificationFriendUserNameLast != "undefined") || (typeof item.notificationFriendUserNameLast != "undefined"))
								{
									avatarLink = "/userprofile/" + item.notificationFriendUserID + "?rand=" + system_calls.GetUUID();
									hrefTemp = $("<a>").attr("href", avatarLink)
											.addClass("UnreadChatListHrefLineHeigh")
											.append(system_calls.CutLongMessages(item.notificationFriendUserName + " " + item.notificationFriendUserNameLast));

									if(userCache.isUserCached(item.notificationFriendUserID))
									{
										var 	user = userCache.GetUserByID(item.notificationFriendUserID);
										DrawUserAvatar(canvasAvatar[0].getContext("2d"), user.avatar, user.name, user.nameLast);
									}
									else
									{
										userCache.AddUserIDForFutureUpdate(item.notificationFriendUserID);
										DrawUserAvatar(canvasAvatar[0].getContext("2d"), "", item.notificationFriendUserName, item.notificationFriendUserNameLast);
									}

									canvasAvatar.on("click", function(e)
																{
																	window.location.href = avatarLink;
																	e.stopPropagation();
																});

									userSpan.append(canvasAvatar)
											.append(hrefTemp);

								}
								else if((typeof item.notificationFromCompany != "undefined") && (typeof item.notificationFromCompany[0].id != "undefined"))
								{
									avatarLink = "/companyprofile/" + item.notificationFromCompany[0].id + "?rand=" + system_calls.GetUUID();
									hrefTemp = $("<a>").attr("href", avatarLink)
											.addClass("UnreadChatListHrefLineHeigh")
											.append(system_calls.CutLongMessages(item.notificationFromCompany[0].name));

									if(item.notificationFromCompany[0].logo_folder.length && item.notificationFromCompany[0].logo_filename.length)
									{
										var		avatarPath = "/images/companies/" + item.notificationFromCompany[0].logo_folder + "/" + item.notificationFromCompany[0].logo_filename;
										DrawCompanyAvatar(canvasAvatar[0].getContext("2d"), avatarPath, item.notificationFromCompany[0].name, "");
									}

									canvasAvatar.on("click", function(e)
																{
																	window.location.href = avatarLink;
																	e.stopPropagation();
																});

									userSpan.append(canvasAvatar)
											.append(hrefTemp);
								}

								userSpan.append(buttonSpan);
								buttonSpan.append(buttonClose);

								notificationBody = "";
								if(item.notificationCategoryTitle.search("не показывается") == -1)
									notificationBody += system_calls.GetGenderedPhrase(item, item.notificationCategoryTitle, item.notificationCategoryTitleMale, item.notificationCategoryTitleFemale) + " ";
								if(item.notificationTypeTitle.search("не показывается") == -1)
									notificationBody += system_calls.GetGenderedPhrase(item, item.notificationTypeTitle, item.notificationTypeTitleMale, item.notificationTypeTitleFemale) + " ";

								if((item.notificationTypeID == "98") || (item.notificationTypeID == "99"))
									notificationBody = item.notificationTitle;

								notificationBody += GetAdditionalTitle(item);

								messageBody.append(RenderMessageWithSpecialSymbols(notificationBody));


								liUser	.append(userSpan)
										.append($("<br/>"))
										.append($("<br/>"))
										.append(messageBody);


								if(!notificationCounter) $("#user-notification-ul").empty();
								$("#user-notification-ul").append(resultDOM);

								notificationCounter++;
						}

						if((notificationCounter == 5))
						{
							if(i < arr.length)
							{
								var		divDivider = $("<li/>").addClass("divider");
								$("#user-notification-ul").append(divDivider)
															.append($("<center>").addClass("cursor_pointer").append("еще . . ."));
							}
							notificationCounter++;
						}
					}
				});

			BadgeUpdate();

			userCache.AddCallbackRunsAfterCacheUpdate(navMenu_userNotification.BuildUserNotificationList);
			window.setTimeout(userCache.RequestServerToUpdateCache, 2000);
		}
	};

	var	BadgeUpdate = function()
	{

		var	badgeSpan = $("<span/>").addClass("badge")
									.addClass("badge-danger");
		var	countOnBadge = 0;

		if(userNotificationsArray.length > 0)
		{
			userNotificationsArray.forEach(function(item)
			{
				if(item.notificationStatus == "unread") countOnBadge++;
			});

			badgeSpan.append((countOnBadge > 20 ? "20+" : countOnBadge));
		}

		$("#user-notification-ahref .badge").remove();
		$("#user-notification-ahref").append(badgeSpan);
	};

	var RenderMessageWithSpecialSymbols = function(message)
	{
		var		lineList;
		var		cutMessage = [];

		lineList = message;
		lineList = lineList.replace(/\&ishort\;/g, "й");
		lineList = lineList.replace(/\&euml\;/g, "ё");
		lineList = lineList.replace(/\&zsimple\;/g, "з");
		lineList = lineList.replace(/\&Ishort\;/g, "Й");
		lineList = lineList.replace(/\&Euml\;/g, "Ё");
		lineList = lineList.replace(/\&Zsimple\;/g, "З");
		lineList = lineList.replace(/\&Norder;\;/g, "№");
		lineList = lineList.replace(/<br>/g, "\n").replace(/\r/g, "").split("\n");

		lineList.forEach(function(item, i, arr)
			{
				if(i < 3)
				{
					cutMessage.push(item.substr(0,45) + (item.length > 45 ? " .!." : ""));
				}
			});
		if(lineList.length > 3)
		{
			cutMessage.push("...");
		}

		// return cutMessage.join("<br>");
		return lineList;
	};


	return {
		InitilizeData: InitilizeData,
		BuildUserNotificationList: BuildUserNotificationList,
		GetAdditionalTitle: GetAdditionalTitle
	};
})();

CustomersProjectsTasks_Select = function (suffix, task_list)
{
	"use strict";

    var	CONST_CHOOSE_CUSTOMER = "выберите заказчика";
    var	CONST_CHOOSE_PROJECT = "выберите проект";
    var	CONST_CHOOSE_TASK = "выберите задачу";

	var	task_list_global = task_list;
	var	row_random_id = suffix;

	var	Init = function()
	{
		$("select.customer[data-random=\"" + row_random_id + "\"]")	.on("change", Select_Customer_ChangeHandler);
		$("select.project[data-random=\"" + row_random_id + "\"]")	.on("change", Select_Project_ChangeHandler);
		$("select.task[data-random=\"" + row_random_id + "\"]")		.on("change", Select_Task_ChangeHandler);
	};

	var	SetGlobalData = function(data)
	{
		task_list_global = data;
	};

	var	GetCustomerIDByProjectID = function(activeProjectID)
	{
		var		result = "0";

		for(var i = 0; (i < task_list_global.length) && (result == "0"); ++i)
		{
			for(var j = 0; (j < task_list_global[i].projects.length) && (result == "0"); ++j)
			{
				if(task_list_global[i].projects[j].id == activeProjectID) result = task_list_global[i].projects[j].customers[0].id;
			}
		}

		return result;
	};

	var	GetProjectIDByTaskID = function(activeTaskID)
	{
		var 	result = "0";

		for(var i = 0; (i < task_list_global.length) && (result == "0"); ++i)
		{
			if(task_list_global[i].id == activeTaskID) result = task_list_global[i].projects[0].id;
		}

		return result;
	};

	var	GetCustomerList_DOM = function(activeCustomerID, activeProjectID, activeTaskID)
	{
		var	result = $();

		result = result.add($("<option>").append(CONST_CHOOSE_CUSTOMER));

		task_list_global.forEach(function(task)
		{
			task.projects.forEach(function(project)
			{
					project.customers.forEach(function(customer)
					{
						var		customerOption = $("<option>")	.append(customer.title)
																.attr("data-id", customer.id);

						if(system_calls.isIDInTheJQueryList(customer.id, result))
						{}
						else
						{
							if((task.id == activeTaskID) || (project.id == activeProjectID) || (customer.id == activeCustomerID))
								customerOption.attr("selected", "");
							result = result.add(customerOption);
						}
					});
			});
		});

		return result;
	};

	var	GetProjectList_DOM = function(activeCustomerID, activeProjectID, activeTaskID)
	{
		var	result = $();

		result = result.add($("<option>").append(CONST_CHOOSE_PROJECT));

		task_list_global.forEach(function(task)
		{
				// --- task and timecard overlaps

				task.projects.forEach(function(project)
				{
					var		isDisplayed = false;
					var		projectOption = $("<option>")	.append(project.title)
															.attr("data-id", project.id);

					project.customers.forEach(function(customer)
					{
						if((customer.id == activeCustomerID) || (activeCustomerID == "0")) isDisplayed = true;
					});

					if(isDisplayed)
					{
						if(system_calls.isIDInTheJQueryList(project.id, result))
						{}
						else
						{
							if((task.id == activeTaskID) || (project.id == activeProjectID)) projectOption.attr("selected", "");
							result = result.add(projectOption);
						}
					}
				});
		});

		return result;
	};

	var	GetTaskList_DOM = function(activeCustomerID, activeProjectID, activeTaskID)
	{
		var	result = $();

		result = result.add($("<option>").append(CONST_CHOOSE_TASK));

		task_list_global.forEach(function(task)
		{
			var		isDisplayed = true;
			var		taskOption = $("<option>")	.append(task.title)
												.attr("data-id", task.id);

			{
				// --- task and timecard overlaps
				task.projects.forEach(function(project)
				{

					project.customers.forEach(function(customer)
					{
						if((customer.id == activeCustomerID) || (activeCustomerID == "0")) isDisplayed &= true;
						else isDisplayed &= false;
					});

					if((project.id == activeProjectID) || (activeProjectID == "0")) isDisplayed &= true;
					else isDisplayed &= false;
				});
			}

			if(isDisplayed)
			{
				if(system_calls.isIDInTheJQueryList(task.id, result)) {}
				else
				{
					if(task.id == activeTaskID) taskOption.attr("selected", "");
					result = result.add(taskOption);
				}
			}
		});

		return result;
	};


	var	Select_Customer_ChangeHandler = function(e)
	{
		var		row_random_id = $(this).data("random");
		var		custSelectBox = $("select.customer[data-random=\"" + row_random_id + "\"]");
		var		projSelectBox = $("select.project[data-random=\"" + row_random_id + "\"]");
		var		taskSelectBox = $("select.task[data-random=\"" + row_random_id + "\"]");
		var		custID = $("select.customer[data-random=\"" + row_random_id + "\"] option:selected").data("id") || "0";

		custSelectBox.empty().append(GetCustomerList_DOM(custID, "0", "0"));
		projSelectBox.empty().append(GetProjectList_DOM(custID, "0", "0"));
		taskSelectBox.empty().append(GetTaskList_DOM(custID, "0", "0"));

	};

	var	Select_Project_ChangeHandler = function(e)
	{
		var		row_random_id = $(this).data("random");
		var		custSelectBox = $("select.customer[data-random=\"" + row_random_id + "\"]");
		var		projSelectBox = $("select.project[data-random=\"" + row_random_id + "\"]");
		var		taskSelectBox = $("select.task[data-random=\"" + row_random_id + "\"]");
		var		projectID = $("select.project[data-random=\"" + row_random_id + "\"] option:selected").data("id") || "0";
		var		customerID = GetCustomerIDByProjectID(projectID);

		custSelectBox.empty().append(GetCustomerList_DOM(customerID, projectID, "0"));
		projSelectBox.empty().append(GetProjectList_DOM(customerID, projectID, "0"));
		taskSelectBox.empty().append(GetTaskList_DOM(customerID, projectID, "0"));
	};

	var	Select_Task_ChangeHandler = function(e)
	{
		var		row_random_id = $(this).data("random");
		var		custSelectBox = $("select.customer[data-random=\"" + row_random_id + "\"]");
		var		projSelectBox = $("select.project[data-random=\"" + row_random_id + "\"]");
		var		taskSelectBox = $("select.task[data-random=\"" + row_random_id + "\"]");
		var		taskID = $("select.task[data-random=\"" + row_random_id + "\"] option:selected").data("id") || "0";
		var		projectID = GetProjectIDByTaskID(taskID);
		var		customerID = GetCustomerIDByProjectID(projectID);

		custSelectBox.empty().append(GetCustomerList_DOM(customerID, projectID, taskID));
		projSelectBox.empty().append(GetProjectList_DOM(customerID, projectID, taskID));
		taskSelectBox.empty().append(GetTaskList_DOM(customerID, projectID, taskID));

		// UpdateTimeRowEntriesDisableStatus(row_random_id, taskID);
	};

	return {
		Init: Init,
		SetGlobalData: SetGlobalData,
		GetCustomerList_DOM: GetCustomerList_DOM,
		GetProjectList_DOM: GetProjectList_DOM,
		GetTaskList_DOM: GetTaskList_DOM
	};
};

system_notifications = (function ()
{
	"use strict";

	var Display = function()
	{
		if(system_calls.isUserSignedin())
		{
			if (("Notification" in window))
			{
				if (Notification.permission === "granted")
				{
					var	numberOfChatMessages = navMenu_chat.GetNumberOfUnreadMessages();
					if(numberOfChatMessages > 0)
					{
						var	currDate = new Date();
						var	currTimestamp = currDate.getTime() / 1000;

						var notificationShownTimestamp = 0;
						if(localStorage.getItem("notificationShownTimestamp"))
						{
							notificationShownTimestamp = parseFloat(localStorage.getItem("notificationShownTimestamp"));
						}

						if((currTimestamp - notificationShownTimestamp) > 24 * 3600)
						{
							var		notify, prononciation;

							localStorage.setItem("notificationShownTimestamp", currTimestamp);

							if(numberOfChatMessages == 1) { prononciation = " новое сообщение"; }
							if(numberOfChatMessages == 2) { prononciation = " новых сообщения"; }
							if(numberOfChatMessages == 3) { prononciation = " новых сообщения"; }
							if(numberOfChatMessages == 4) { prononciation = " новых сообщения"; }
							if(numberOfChatMessages >= 5) { prononciation = " новых сообщений"; }
							if(((numberOfChatMessages % 10) == 1) && (numberOfChatMessages > 19)) { prononciation = " новое сообщение"; }
							if(((numberOfChatMessages % 10) == 2) && (numberOfChatMessages > 19)) { prononciation = " новых сообщения"; }
							if(((numberOfChatMessages % 10) > 2) && (numberOfChatMessages > 19)) { prononciation = " новых сообщений"; }
							if(((numberOfChatMessages % 10) > 0) && (numberOfChatMessages > 19)) { prononciation = " новых сообщений"; }

							notify = new Notification("Вам письмо !", { icon: "/images/pages/chat/chat_notification_" + (Math.floor(Math.random() * 18) + 1) + ".png", body: "Вам прислали " + numberOfChatMessages + prononciation } );
							notify.onclick = function() {
								notify.close();
								window.location.href = "/chat?rand=" + Math.random()*98765432123456;
							};
							setTimeout(function() { notify.close(); }, 10000);
						}
						else
						{
							// console.debug("Display notifications alerting once a day");
						}
					}
				}
				else
				{
					if (Notification.permission !== 'denied')
					{
					    Notification.requestPermission();
					}
					else
					{
						console.debug("notifications rejected by user");
					}
				}
			}
			else
			{
				console.debug("browser doesn't support notifications");
			}
		}
		else
		{
			// --- user not signed in (no need to check notifications)
		}
	};

	return {
		Display: Display
	};
})();

troubleshooting = (function ()
{
	var		before_at = "issue";
	var		very_important_var = "";

	var		at_sign = String.fromCharCode(64);
	var		another_very_important_var = "";
	var		after_at = document.location.hostname.split(".").splice(1,2).join(".");
	var		Recipient = before_at + very_important_var + at_sign + another_very_important_var + after_at;

	var		GetTraceback = function()
	{
		var	traceback = "";

		var callback = function(stackframes) {
		  var stringifiedStack = stackframes.map(function(sf) {
		    return sf.toString();
		  }).join('\n');
		  traceback += stringifiedStack + "\n";

		  return traceback;
		};

		var errback = function(err) { console.log(err.message); };

		return StackTrace.get().then(callback).catch(errback);
	};

	var		PopoverError = function(popover_tag_id, message_to_user, mail_subj, mail_body)
	{
		GetTraceback().then(function(traceback)
		{
			var		body = traceback;

			body += "\n\n" + mail_body;
			system_calls.PopoverError(popover_tag_id,
				message_to_user +
				"<a href=\"mailto:" + Recipient +
				"?subject=" + mail_subj +
				"&body=" + encodeURI(body) + "\">Сообщите</a> в тех поддержку.");
		});
	};

	return {
		PopoverError: PopoverError
	};
})();



/**
 * isMobile.js v0.4.1
 *
 * A simple library to detect Apple phones and tablets,
 * Android phones and tablets, other mobile devices (like blackberry, mini-opera and windows phone),
 * and any kind of seven inch device, via user agent sniffing.
 *
 * @author: Kai Mallea (kmallea@gmail.com)
 *
 * @license: http://creativecommons.org/publicdomain/zero/1.0/
 */
(function (global) {

    var apple_phone         = /iPhone/i,
        apple_ipod          = /iPod/i,
        apple_tablet        = /iPad/i,
        android_phone       = /(?=.*\bAndroid\b)(?=.*\bMobile\b)/i, // Match 'Android' AND 'Mobile'
        android_tablet      = /Android/i,
        amazon_phone        = /(?=.*\bAndroid\b)(?=.*\bSD4930UR\b)/i,
        amazon_tablet       = /(?=.*\bAndroid\b)(?=.*\b(?:KFOT|KFTT|KFJWI|KFJWA|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA|KFARWI|KFASWI|KFSAWI|KFSAWA)\b)/i,
        windows_phone       = /Windows Phone/i,
        windows_tablet      = /(?=.*\bWindows\b)(?=.*\bARM\b)/i, // Match 'Windows' AND 'ARM'
        other_blackberry    = /BlackBerry/i,
        other_blackberry_10 = /BB10/i,
        other_opera         = /Opera Mini/i,
        other_chrome        = /(CriOS|Chrome)(?=.*\bMobile\b)/i,
        other_firefox       = /(?=.*\bFirefox\b)(?=.*\bMobile\b)/i, // Match 'Firefox' AND 'Mobile'
        seven_inch = new RegExp(
            '(?:' +         // Non-capturing group

            'Nexus 7' +     // Nexus 7

            '|' +           // OR

            'BNTV250' +     // B&N Nook Tablet 7 inch

            '|' +           // OR

            'Kindle Fire' + // Kindle Fire

            '|' +           // OR

            'Silk' +        // Kindle Fire, Silk Accelerated

            '|' +           // OR

            'GT-P1000' +    // Galaxy Tab 7 inch

            ')',            // End non-capturing group

            'i');           // Case-insensitive matching

    var match = function(regex, userAgent) {
        return regex.test(userAgent);
    };

    var IsMobileClass = function(userAgent) {
        var ua = userAgent || navigator.userAgent;

        // Facebook mobile app's integrated browser adds a bunch of strings that
        // match everything. Strip it out if it exists.
        var tmp = ua.split('[FBAN');
        if (typeof tmp[1] !== 'undefined') {
            ua = tmp[0];
        }

        // Twitter mobile app's integrated browser on iPad adds a "Twitter for
        // iPhone" string. Same probable happens on other tablet platforms.
        // This will confuse detection so strip it out if it exists.
        tmp = ua.split('Twitter');
        if (typeof tmp[1] !== 'undefined') {
            ua = tmp[0];
        }

        this.apple = {
            phone:  match(apple_phone, ua),
            ipod:   match(apple_ipod, ua),
            tablet: !match(apple_phone, ua) && match(apple_tablet, ua),
            device: match(apple_phone, ua) || match(apple_ipod, ua) || match(apple_tablet, ua)
        };
        this.amazon = {
            phone:  match(amazon_phone, ua),
            tablet: !match(amazon_phone, ua) && match(amazon_tablet, ua),
            device: match(amazon_phone, ua) || match(amazon_tablet, ua)
        };
        this.android = {
            phone:  match(amazon_phone, ua) || match(android_phone, ua),
            tablet: !match(amazon_phone, ua) && !match(android_phone, ua) && (match(amazon_tablet, ua) || match(android_tablet, ua)),
            device: match(amazon_phone, ua) || match(amazon_tablet, ua) || match(android_phone, ua) || match(android_tablet, ua)
        };
        this.windows = {
            phone:  match(windows_phone, ua),
            tablet: match(windows_tablet, ua),
            device: match(windows_phone, ua) || match(windows_tablet, ua)
        };
        this.other = {
            blackberry:   match(other_blackberry, ua),
            blackberry10: match(other_blackberry_10, ua),
            opera:        match(other_opera, ua),
            firefox:      match(other_firefox, ua),
            chrome:       match(other_chrome, ua),
            device:       match(other_blackberry, ua) || match(other_blackberry_10, ua) || match(other_opera, ua) || match(other_firefox, ua) || match(other_chrome, ua)
        };
        this.seven_inch = match(seven_inch, ua);
        this.any = this.apple.device || this.android.device || this.windows.device || this.other.device || this.seven_inch;

        // excludes 'other' devices and ipods, targeting touchscreen phones
        this.phone = this.apple.phone || this.android.phone || this.windows.phone;

        // excludes 7 inch devices, classifying as phone or tablet is left to the user
        this.tablet = this.apple.tablet || this.android.tablet || this.windows.tablet;

        if (typeof window === 'undefined') {
            return this;
        }
    };

    var instantiate = function() {
        var IM = new IsMobileClass();
        IM.Class = IsMobileClass;
        return IM;
    };

    if (typeof module !== 'undefined' && module.exports && typeof window === 'undefined') {
        //node
        module.exports = IsMobileClass;
    } else if (typeof module !== 'undefined' && module.exports && typeof window !== 'undefined') {
        //browserify
        module.exports = instantiate();
    } else if (typeof define === 'function' && define.amd) {
        //AMD
        define('isMobile', [], global.isMobile = instantiate());
    } else {
        global.isMobile = instantiate();
    }

})(this);


String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

String.prototype.trimLeft = function(charlist) {
  if (charlist === undefined)
    charlist = "\\s";

  return this.replace(new RegExp("^[" + charlist + "]+"), "");
};

String.prototype.trimRight = function(charlist) {
  if (charlist === undefined)
    charlist = "\\s";

  return this.replace(new RegExp("[" + charlist + "]+$"), "");
};

String.prototype.trim = function(charlist) {
  return this.trimLeft(charlist).trimRight(charlist);
};

$.fn.selectRange = function(start, end) {
    var e = document.getElementById($(this).attr('id')); // I don't know why... but $(this) don't want to work today :-/
    if (!e) return;
    else if (e.setSelectionRange) { e.focus(); e.setSelectionRange(start, end); } /* WebKit */
    else if (e.createTextRange) { var range = e.createTextRange(); range.collapse(true); range.moveEnd('character', end); range.moveStart('character', start); range.select(); } /* IE */
    else if (e.selectionStart) { e.selectionStart = start; e.selectionEnd = end; }
};

$.urlParam = function(name)
{
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results === null){
       return "";
    }
    else{
       return decodeURI(results[1]) || "";
    }
};
