var	initial_wizard = initial_wizard || {};

var	initial_wizard = (function()
{
	"use strict";

	var		DATE_FORMAT_GLOBAL = "dd/mm/yy";

	var		current_tab_global = 0;
	var		submit_obj_global;
	var		company_arr_global = [];
	var		counties_obj_global;

	var		call_stack_global = [];
	var		call_stack_pointer_global = 0;

	var	Init = function()
	{
		$.ajaxSetup({ cache: false });

		if(session_pi.isCookieAndLocalStorageValid())
		{
			InitWizard();
		}
		else
		{
			window.location.href = "/autologin?rand=" + Math.random() * 1234567890;
		}
	};

	var	InitWizard = function()
	{
		$("#navigate_prev").on("click", function() { MakeStep($(".__tab[data-tab_id='" + current_tab_global + "']").attr("data-prev_tab_id")); });
		$("#navigate_next").on("click", function() { MakeStep($(".__tab[data-tab_id='" + current_tab_global + "']").attr("data-next_tab_id")); });

		$("#role_subc")				.on("click", function() { submit_obj_global.type = "subc"; MakeStep($(this).attr("data-next_tab_id")); });
		$("#role_approver")			.on("click", function() { submit_obj_global.type = "approver"; MakeStep($(this).attr("data-next_tab_id")); });
		$("#role_agency_owner")		.on("click", function() { submit_obj_global.type = "agency_owner"; MakeStep($(this).attr("data-next_tab_id")); });
		$("#role_agency_employee")	.on("click", function() { submit_obj_global.type = "agency_employee"; MakeStep($(this).attr("data-next_tab_id")); });

		$("[data-algorithm='check_company_by_tin'] button")	.on("click", CheckCompanyByTIN_ClickHandler);
		$("[data-algorithm='check_company_by_tin'] input")	.on("input", CheckCompanyByTIN_InputHandler);

		$(".__date_picker")
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

		$("input.__notify_agency_name")
							.autocomplete({
								source: "/cgi-bin/ajax_anyrole_1.cgi?action=AJAX_getAgencyAutocompleteList",
								select: AgencyName_Autocomplete_SelectHandler,
							});

		ResetDataStructureAndGUI();

		RenderTabsWithCompanyInfo();

		ShowTab(current_tab_global);
	};

	var	ResetDataStructureAndGUI = function()
	{
		submit_obj_global = {};
	};

	var	ShowTab = function(tab_id)
	{
		var	algorithm = $(".__tab[data-tab_id='" + tab_id + "']").attr("data-algorithm");

		setTimeout(function()
		{
			$(".__tab[data-tab_id='" + tab_id + "']").show(200);
		}, 100);

		if(current_tab_global === 0)
		{
			$(".__control_block").hide();
			$("#navigate_next").empty().append("Дальше");
		}
		else
		{
			HighlightStepIndicator(tab_id);
			$(".__control_block").show();
		}

		if($(".__tab[data-tab_id='" + tab_id + "']").attr("data-next_tab_id") == "-1")
		{
			$("#navigate_next").empty().append("Оправить");
		}
		else
		{
			$("#navigate_next").empty().append("Дальше");
		}
	};

	var	HideTab = function(tab_id)
	{
		DimStepIndicator(tab_id);
		$(".__tab[data-tab_id='" + tab_id + "']").hide(100);
	};

	var	MakeStep = function(tab_id)
	{
		var		result = false;

		tab_id = parseInt(tab_id);

		if((tab_id > current_tab_global) && (ValidateTab(current_tab_global) === false))
		{
			// --- keep result as false
		}
		else
		{
			result = true;

			if(tab_id < 0)
			{
				// --- submit it to server
				Build_CallStack_and_SubmitDataToBackend();
			}
			else
			{
				if(current_tab_global === 0) BuildStepIndicators(tab_id);

				HideTab(current_tab_global);
				current_tab_global = tab_id;
				ShowTab(current_tab_global);

				if(current_tab_global === 0) ResetDataStructureAndGUI();
			}

		}

		return result;
	};

	var	ValidateTab = function(tab_id)
	{
		var	result		= false;
		var	algorithm	= $(".__tab[data-tab_id='" + tab_id + "']").attr("data-algorithm");
		var	first_name_tag, last_name_tag, middle_name_tag, company_tin_tag;
		var	passport_series_tag, passport_number_tag, passport_issue_date_tag, passport_issue_authority_tag;
		var	i;

		if(algorithm)
		{
			if(algorithm == "personal_data")
			{
				first_name_tag = $(".__tab[data-tab_id='" + tab_id + "'] input.__first_name");
				last_name_tag = $(".__tab[data-tab_id='" + tab_id + "'] input.__last_name");

				if(first_name_tag.val() === "") system_calls.PopoverError(first_name_tag, "Заполните имя");
				else if(last_name_tag.val() === "") system_calls.PopoverError(last_name_tag, "Заполните фамилию");
				else result = true;
			}
			else if(algorithm == "check_company_by_tin")
			{
				company_tin_tag = $(".__tab[data-tab_id='" + tab_id + "'] input.__tin");

				if(company_tin_tag.attr("data-check_result") != "success") system_calls.PopoverError(company_tin_tag, "Выполните проверку ИНН компании");
				else result = true;
			}
			else if(algorithm == "company_info")
			{
				for(i = 0; i < company_arr_global.length; ++i)
				{
					if(company_arr_global[i].GetSuffix() == tab_id) break;
				}

				if(company_arr_global[i].isValid()) result = true;
			}
			else if(algorithm == "passport_data")
			{

/*				passport_series_tag = $(".__tab[data-tab_id='" + tab_id + "'] input.__passport_series");
				passport_number_tag = $(".__tab[data-tab_id='" + tab_id + "'] input.__passport_number");
				passport_issue_authority_tag = $(".__tab[data-tab_id='" + tab_id + "'] input.__passport_issue_authority");

				if(passport_series_tag.val() === "") system_calls.PopoverError(passport_series_tag, "Заполните серию паспорта");
				else if(passport_number_tag.val() === "") system_calls.PopoverError(passport_number_tag, "Заполните номер паспорта");
				else if(passport_issue_date_tag.val() === "") system_calls.PopoverError(passport_issue_date_tag, "Заполните дату выдачи паспорта");
				else if(passport_issue_authority_tag.val() === "") system_calls.PopoverError(passport_issue_authority_tag, "Заполните кем выдан паспорт");
				else result = true;
*/
				result = true; // --- passport is optional

				passport_issue_date_tag = $(".__tab[data-tab_id='" + tab_id + "'] input.__passport_issue_date");
				if(passport_issue_date_tag.val().length)
				{
					var	regexp_result = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*$/.exec(passport_issue_date_tag.val());
					if(regexp_result && (regexp_result.length == 4))
					{
						var temp_date = new Date(parseInt(regexp_result[3]), parseInt(regexp_result[2] - 1), parseInt(regexp_result[1]));

						if((parseInt(regexp_result[1]) == temp_date.getDate()) && (parseInt(regexp_result[2]) == temp_date.getMonth() + 1) && (parseInt(regexp_result[3]) == temp_date.getYear() + 1900))
						{
						}
						else
						{
							system_calls.PopoverError(passport_issue_date_tag, "Некорректный формат даты (дд/мм/гггг)");
							result = false;
						}
					}
					else
					{
						system_calls.PopoverError(passport_issue_date_tag, "Некорректный формат даты (дд/мм/гггг)");
						result = false;
					}
				}
			}
			else if(algorithm == "agency_notification")
			{
				result = true;
			}
			else if(algorithm == "eula")
			{
				if($("div[data-tab_id='" + tab_id + "'] .eula_acceptance").prop("checked"))
				{
					result = true;
				}
				else
				{
					system_calls.PopoverError($("#navigate_next"), "Нужно принять условия лицензионного соглашения");
				}
			}
			else
			{
				console.error("unknown algorithm(" + algorithm + ")");
			}
		}
		else
		{
			// --- if algorithm not defined, nothing to check
			result = true;
		}

		if(result) CompleteStepIndicator(tab_id);

		return result;
	};

	var	GetStepIndicators_DOM = function(start_tab_id)
	{
		var	result = $();
		var	tab_id = start_tab_id;

		while($(".__tab[data-tab_id='" + tab_id + "']").attr("data-next_tab_id"))
		{
			result = result.add(
								$("<span>").addClass("step").attr("data-tab_id", tab_id)
							);
			tab_id = $(".__tab[data-tab_id='" + tab_id + "']").attr("data-next_tab_id");
		}

		return result;
	};

	var BuildStepIndicators = function(start_tab_id)
	{
		$("#step_indicators").empty().append(GetStepIndicators_DOM(start_tab_id));

		return;
	};

	var	CompleteStepIndicator = function(tab_id)
	{
		$("#step_indicators .step[data-tab_id=\"" + tab_id + "\"]").addClass("complete");
	};

	var	HighlightStepIndicator = function(tab_id)
	{
		$("#step_indicators .step[data-tab_id=\"" + tab_id + "\"]").addClass("active");
	};

	var	DimStepIndicator = function(tab_id)
	{
		$("#step_indicators .step[data-tab_id=\"" + tab_id + "\"]").removeClass("active");
	};

	var	RenderTabsWithCompanyInfo = function()
	{
		$.getJSON("/cgi-bin/noauth.cgi",
			{
				action: "AJAX_getGeoCountryList",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					counties_obj_global = data.countries;

					$("[data-content=\"__company_info\"]").each(function() 
						{
							var		curr_tag = $(this);
							var		random = curr_tag.closest(".__tab").attr("data-tab_id");
							var		company_item;

							system_calls.SetCurrentScript("agency.cgi");
							company_item = new company_info_edit(random);
							company_item.Init(system_calls.UpdateInputFieldOnServer);
							company_item.SetCountriesObj(counties_obj_global);

							company_arr_global.push(company_item);

							curr_tag
								.attr("data-random", random)
								.append(company_item.GetDOM());
						});
				}
				else
				{
					console.error(curr_tag, "Ошибка: " + data.description);
				}
			})
			.fail(function(data)
			{
				console.error("fail to parse server response");
			});


	};

	var	CheckCompanyByTIN_InputHandler = function()
	{
		var		company_tin_tag = $(this);

		company_tin_tag.attr("data-check_result", "");
	};

	var	CheckCompanyByTIN_ClickHandler = function()
	{
		var		curr_tag = $(this);
		var		next_tab_id = curr_tag.closest(".__tab").attr("data-next_tab_id");
		var		company_tin_tag = curr_tag.closest(".row").find("input");
		var		company_tin_button = curr_tag.closest(".row").find("button");

		if(company_tin_tag.val().length)
		{
			company_tin_tag.attr("data-check_result", "");
			company_tin_button.button("loading");

			if(company_tin_tag.attr("data-company_type") && company_tin_tag.attr("data-company_type").length)
			{
				$.getJSON("/cgi-bin/ajax_anyrole_1.cgi",
					{
						action: "AJAX_isCompanyExists",
						tin: company_tin_tag.val(),
						// company_type: company_tin_tag.attr("data-company_type"),
					})
					.done(function(data)
					{
						if(data.result == "success")
						{
							if(data.isExists == "no")
							{
								company_tin_tag.attr("data-check_result", "success");
								system_calls.PopoverInfo(curr_tag, "Проверка успешна.");

								// --- pre-fill and disable TIN on the next tab
								$("#company_tin_" + next_tab_id)
									.val(company_tin_tag.val())
									.attr("disabled", "");
							}
							else
							{
								system_calls.PopoverError(curr_tag, "Компания с таким ИНН уже существует, Вам необходимо восстановить доступ к своей компании.");
							}
						}
						else
						{
							console.error(curr_tag, "Ошибка: " + data.description);
						}
					})
					.fail(function(data)
					{
						system_calls.PopoverError("Сервер вернул ошибку.");
					})
					.always(function()
					{
						setTimeout(function() { company_tin_button.button("reset"); }, 200);
					});
			}
			else
			{
				console.error("company_type attr is not defined");
			}


		}
		else
		{
			system_calls.PopoverError(company_tin_tag, "Заполните ИНН компании");
		}
	};

	var	AgencyName_Autocomplete_SelectHandler = function(event, ui)
	{
		var		id = ui.item.id;
		var 	label = ui.item.label;

		var		curr_tag = $(this);
		var		curr_action = curr_tag.attr("data-company_id", id);

	};

	var	Build_CallStack_and_SubmitDataToBackend = function()
	{
		var		tab_id = current_tab_global;

		call_stack_global = [];
		call_stack_pointer_global = 0;

		while(parseInt(tab_id) > 0)
		{
			call_stack_global.push(tab_id);
			tab_id = $("[data-tab_id='" + tab_id + "']").attr("data-prev_tab_id");
		}

		SubmitDataToBackend();
	};

	var	SubmitDataToBackend = function()
	{
		var		algorithm;
		var		tab_id;

		if(call_stack_global.length)
		{
			tab_id = call_stack_global.pop();
			algorithm = $("[data-tab_id='" + tab_id + "']").attr("data-algorithm");

			SubmitDataToBackendByAlgorithm(algorithm, tab_id);
		}
		else
		{
			// --- redirect to main screen
			// console.debug("WELL DONE ! REDIRECT TO /");
			window.location.href = "/?random=" + Math.random()*876543235789;
		}
	};

	var	SubmitDataToBackendByAlgorithm = function(algorithm, tab_id)
	{
		var		json_param = {};
		var		good2go = true;
		var		company_index;
		var		passport_series;
		var		passport_number;
		var		passport_issue_date;
		var		passport_issue_authority;

		if(algorithm)
		{
			if(algorithm == "personal_data")
			{
				json_param.action = "AJAX_updatePersonalData";
				json_param.type = submit_obj_global.type;
				json_param.first_name = $(".__tab[data-tab_id='" + tab_id + "'] input.__first_name").val();
				json_param.last_name = $(".__tab[data-tab_id='" + tab_id + "'] input.__last_name").val();
				json_param.middle_name = $(".__tab[data-tab_id='" + tab_id + "'] input.__middle_name").val();
			}
			else if(algorithm == "check_company_by_tin")
			{
			}
			else if(algorithm == "company_info")
			{
				// work - on it.
				for(company_index = 0; company_index < company_arr_global.length; ++company_index)
				{
					if(company_arr_global[company_index].GetSuffix() == tab_id)
					{
						if(submit_obj_global.type == "subc")			company_arr_global[company_index].SetType("subcontractor");
						if(submit_obj_global.type == "agency_owner")	company_arr_global[company_index].SetType("agency");

						company_arr_global[company_index].SubmitNewCompanyToServer()
							.then(
									function(result) {SubmitDataToBackend(); }, 
									function(err)
									{
										system_calls.PopoverError($("#navigate_next"), err);
										setTimeout(function() { $("#navigate_next").button("reset"); }, 3000);
										console.error("fail to create company"); 

										SubmitDataToBackend(); 
									}
								);

						// --- this block allows avoid repetitive calling recursive.
						// --- if it will be removed, then recursive func SubmitDataToBackend() will be called after loop
						// --- this may trigger window.redirect before workflow finish. (synchronous flow faster than async calls) 
						{
							good2go = false;
							json_param.action = "stub to avoid recursive call at the end";
						}

						break;
					}
				}
			}
			else if(algorithm == "passport_data")
			{
				passport_series = $(".__tab[data-tab_id='" + tab_id + "'] input.__passport_series").val();
				passport_number = $(".__tab[data-tab_id='" + tab_id + "'] input.__passport_number").val();
				passport_issue_date = $(".__tab[data-tab_id='" + tab_id + "'] input.__passport_issue_date").val();
				passport_issue_authority = $(".__tab[data-tab_id='" + tab_id + "'] input.__passport_issue_authority").val();

				if(
					passport_series				.length &&
					passport_number				.length &&
					passport_issue_date			.length &&
					passport_issue_authority	.length
					)
				{

					json_param.action						= "AJAX_updatePassportData";
					json_param.passport_series				= passport_series;
					json_param.passport_number				= passport_number;
					json_param.passport_issue_date			= passport_issue_date;
					json_param.passport_issue_authority		= passport_issue_authority;
				}
				else
				{
					good2go = false;
				}
			}
			else if(algorithm == "agency_notification")
			{
				json_param.agency_to_notify = $(".__tab[data-tab_id='" + tab_id + "'] input.__notify_agency_name").val();

				if(json_param.agency_to_notify.length)
				{
					if(submit_obj_global.type == "subc")
						json_param.action = "AJAX_notifyAgencyAboutSubcRegistration";
					else if(submit_obj_global.type == "approver")
						json_param.action = "AJAX_notifyAgencyAboutApproverRegistration";
					else if(submit_obj_global.type == "agency_employee")
						json_param.action = "AJAX_notifyAgencyAboutEmployeeRegistration";
					else
						console.error("unknown notification type: " + submit_obj_global.type);
				}
			}
			else
			{
				console.error("unknown algorithm(" + algorithm + ")");
				good2go = false;
			}

			if(good2go)
			{
				$("#navigate_next").button("loading");

				if((typeof json_param.action != "undefined") && (json_param.action.length))
				{
					$.getJSON("/cgi-bin/initial_wizard.cgi", json_param)
						.done(function(data)
						{
							if(data.result == "success")
							{
							}
							else
							{
								console.error(json_param.action + ": " + data.description);
							}
						})
						.fail(function(data)
						{
							console.error("fail to parse server response");
						})
						.always(function()
						{
							SubmitDataToBackend(); // --- call recursive until finish or algorithm will not be empty
						});
				}
			}
		}

		if(typeof json_param.action == "undefined")
		{
			SubmitDataToBackend(); // --- call recursive until finish or algorithm will not be empty
		}
	};

	return {
		Init: Init
	};

})();
