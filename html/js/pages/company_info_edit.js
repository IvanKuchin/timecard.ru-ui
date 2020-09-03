var	company_info_edit = function(suffix_init)
{
	'use strict';

	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
	var	data_global;
	var	rand_global;
	// var	legal_zip_code_global;
	// var	mailing_zip_code_global;
	var	countries_obj_global; // --- this object is simple storage for legal and mailing objects
	var	bank_global;
	var	legal_zip_code_global;
	var	mailing_zip_code_global;
	var	update_tag_parent_callback_global;
	var	enable_tin_button_global = false;
	var	suffix_global = suffix_init || "";
	var	type_global = "cost_center";

	var	Init = function(func)
	{
		var		promise_legal, promise_mailing;

		update_tag_parent_callback_global = func;

		legal_zip_code_global = new geo_zip_edit(suffix_init + "_legal", "Юр. адрес", "AJAX_updateCompanyLegalZipID", UpdateGeoZip_Callback);
		mailing_zip_code_global = new geo_zip_edit(suffix_init + "_mailing", "Адрес доставки", "AJAX_updateCompanyMailingZipID", UpdateGeoZip_Callback);
		bank_global = new bank_edit(suffix_init + "_1", UpdateBIK_Callback);

		legal_zip_code_global.Init();
		mailing_zip_code_global.Init();

		bank_global.Init();
	};

	var	SetType	= function(param)	{ type_global = param; };
	var	GetType	= function()		{ return type_global; };
	var	GetSuffix= function() 		{ return suffix_global; };

	var	SetTINButtonStatus = function(status)
	{
		// --- status must be true or false
		enable_tin_button_global = status;
	};

	var	SetCountriesObj = function(obj)
	{
		countries_obj_global = obj;
		legal_zip_code_global.SetCountriesObj(countries_obj_global);
		mailing_zip_code_global.SetCountriesObj(countries_obj_global);
	};

	var	AddCompanyLogo_ChangeHandler = function(e)
	{
		var		currTag = $(this);
		if(e.target.files.length)
		{
			var		tmpURLObj = URL.createObjectURL(e.target.files[0]);
			var		target_element_id = currTag.attr("data-target_element_id");
			var		imgPreview = $("#" + target_element_id);
			// var		imgPreview = $("#" + target_element_id + suffix_global);
			var		formData = new FormData();

			imgPreview.attr("src", tmpURLObj);
			imgPreview.data("original_file", e.target.files[0]);

			formData.append("id", data_global.id);
			formData.append("type", "company_profile_logo");
			formData.append("cover", e.target.files[0], "cover.jpg");

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

					if(jsonObj && jsonObj.length)
					{
						if(jsonObj[0].result == "success")
						{
							$("#company_logo_" + suffix_global).attr("data-db_value", "/images/companies/" + jsonObj[0].logo_folder + "/" + jsonObj[0].logo_filename);
							console.debug("AddGeneralCoverUploadChangeHandler:upload:successHandler: URL /images/companies/" + jsonObj[0].logo_folder + "/" + jsonObj[0].logo_filename);
						}
						else
						{
							setTimeout(function() { RecoverOriginalImage(); }, 500);
							system_calls.PopoverError(currTag, "ОШИБКА: " + jsonObj.textStatus);
						}
					}
					else if(jsonObj && (typeof jsonObj == "object") && (typeof jsonObj.result != "undefined"))
					{
						if(jsonObj.result == "success")
						{
							system_calls.PopoverInfo("#company_logo_" + suffix_global, "Unexpected behavior");
						}
						else
						{
							setTimeout(function() { RecoverOriginalImage(); }, 500);
							system_calls.PopoverError(currTag, "ОШИБКА: " + jsonObj.textStatus);
						}
					}
					else
					{
						setTimeout(function() { RecoverOriginalImage(); }, 500);
						system_calls.PopoverError(currTag, "Ошибка ответа сервера");
					}

				},
				error: function(data, textStatus, errorThrown ) {
					var		jsonObj = JSON.parse(data);
					setTimeout(function() { RecoverOriginalImage(); }, 500);
				}
			});

			// system_calls.Exif_FixOrientation(imgPreview);
		}
		else
		{
			// --- "cancel" pressed in image upload window
		}
	};

	var UploadCompanyLogo_ClickHandler = function(e) 
	{
		var		currTag = $(this);

		$("#AddCompanyLogoButton_" + suffix_global)
			.attr("data-target_element_id", currTag.attr("id"))
			.click();
	};

	var	UploadCompanyLogo_LoadHandler = function(e)
	{
		var		currTag = $(this);

		if(currTag.attr("src").length)
		{
			if(currTag.attr("src").search("blob:") === 0)
			{
				// --- exif-js check if ".exifdata" exists and doesn't referesh it for new picture
				// --- you should remove it manually
				delete currTag[0].exifdata;
				system_calls.Exif_RemoveClasses(currTag);
				system_calls.Exif_FixOrientation(currTag);
			}
		}
	};

	var RecoverOriginalImage = function()
	{
		var	curr_tag = $("#company_logo_" + suffix_global);
		var	orig_image = curr_tag.attr("data-db_value");

		if(orig_image && orig_image.length)
		{
			curr_tag.attr("src", orig_image);
			system_calls.Exif_RemoveClasses(curr_tag);
		}
	};

	var	Render = function(company, dom_model)
	{
		dom_model = dom_model || $("body");

		data_global = company;

		dom_model.find("#legal_geo_address_placeholder_" + suffix_global)
			.empty().append(legal_zip_code_global	.GetDOM(company ? company.legal_geo_zip[0] : undefined));
		dom_model.find("#mailing_geo_address_placeholder_" + suffix_global)
			.empty().append(mailing_zip_code_global	.GetDOM(company ? company.mailing_geo_zip[0] : undefined));
		dom_model.find("#bank_bik_placeholder_" + suffix_global)
			.empty().append(bank_global				.GetDOM(company ? company.banks[0] : undefined));

		if(company)
		{
			if(company.logo_folder.length && company.logo_filename.length)
				dom_model.find("#company_logo_" + suffix_global)
										.attr("src", "/images/companies/" + company.logo_folder + "/" + company.logo_filename)
										.attr("data-db_value", "/images/companies/" + company.logo_folder + "/" + company.logo_filename);

			dom_model.find("#company_title_" + suffix_global)
										.val(system_calls.ConvertHTMLToText(company.name))
										.attr("data-db_value", system_calls.ConvertHTMLToText(company.name));
			dom_model.find("#company_description_" + suffix_global)
										.val(system_calls.ConvertHTMLToText(company.description))
										.attr("data-db_value", system_calls.ConvertHTMLToText(company.description));
			dom_model.find("#legal_address_" + suffix_global)
										.val(system_calls.ConvertHTMLToText(company.legal_address))
										.attr("data-db_value", system_calls.ConvertHTMLToText(company.legal_address));
			dom_model.find("#mailing_address_" + suffix_global)
										.val(system_calls.ConvertHTMLToText(company.mailing_address))
										.attr("data-db_value", system_calls.ConvertHTMLToText(company.mailing_address));
			dom_model.find("#company_link_" + suffix_global)
										.val(system_calls.ConvertHTMLToText(company.webSite))
										.attr("data-db_value", system_calls.ConvertHTMLToText(company.webSite));
			dom_model.find("#company_act_number_prefix_" + suffix_global)
										.val(system_calls.ConvertHTMLToText(company.act_number_prefix))
										.attr("data-db_value", system_calls.ConvertHTMLToText(company.act_number_prefix));
			dom_model.find("#company_act_number_" + suffix_global)
										.val(system_calls.ConvertHTMLToText(company.act_number))
										.attr("data-db_value", system_calls.ConvertHTMLToText(company.act_number));
			dom_model.find("#company_act_number_postfix_" + suffix_global)
										.val(system_calls.ConvertHTMLToText(company.act_number_postfix))
										.attr("data-db_value", system_calls.ConvertHTMLToText(company.act_number_postfix));
			dom_model.find("#company_account_" + suffix_global)
										.val(system_calls.ConvertHTMLToText(company.account))
										.attr("data-db_value", system_calls.ConvertHTMLToText(company.account));
			dom_model.find("#company_tin_" + suffix_global)
										.val(system_calls.ConvertHTMLToText(company.tin))
										.attr("data-db_value", system_calls.ConvertHTMLToText(company.tin));
			dom_model.find("#company_ogrn_" + suffix_global)
										.val(system_calls.ConvertHTMLToText(company.ogrn))
										.attr("data-db_value", system_calls.ConvertHTMLToText(company.ogrn));
			dom_model.find("#company_kpp_" + suffix_global)
										.val(system_calls.ConvertHTMLToText(company.kpp))
										.attr("data-db_value", system_calls.ConvertHTMLToText(company.kpp));
			dom_model.find("#company_vat_" + suffix_global)
										.prop("checked", (company.vat == "Y" ? "checked": ""))
										.attr("data-db_value", system_calls.ConvertHTMLToText(company.vat));
			dom_model.find("#company_vat_calculation_type_" + suffix_global)
										.prop("checked", (company.vat_calculation_type == "sum_by_row" ? "checked": ""))
										.attr("data-db_value", system_calls.ConvertHTMLToText(company.vat));

			dom_model.find("input")		.attr("data-company_id", company.id);
			dom_model.find("textarea")	.attr("data-company_id", company.id);

			if(typeof(update_tag_parent_callback_global) == "function")
			{
				dom_model.find("#company_title_"				+ suffix_global)
										.on("change", update_tag_parent_callback_global);
				dom_model.find("#company_description_"			+ suffix_global)
										.on("change", update_tag_parent_callback_global);
				dom_model.find("#company_link_"					+ suffix_global)
										.on("change", update_tag_parent_callback_global);
				dom_model.find("#company_act_number_prefix_"	+ suffix_global)
										.on("change", update_tag_parent_callback_global);
				dom_model.find("#company_act_number_"			+ suffix_global)
										.on("change", update_tag_parent_callback_global);
				dom_model.find("#company_act_number_postfix_"	+ suffix_global)
										.on("change", update_tag_parent_callback_global);
				dom_model.find("#legal_address_"				+ suffix_global)
										.on("change", update_tag_parent_callback_global);
				dom_model.find("#mailing_address_"				+ suffix_global)
										.on("change", update_tag_parent_callback_global);
				dom_model.find("#company_tin_"					+ suffix_global)
										.on("change", update_tag_parent_callback_global);
				dom_model.find("#company_account_"				+ suffix_global)
										.on("change", update_tag_parent_callback_global);
				dom_model.find("#company_ogrn_"					+ suffix_global)
										.on("change", update_tag_parent_callback_global);
				dom_model.find("#company_kpp_"					+ suffix_global)
										.on("change", update_tag_parent_callback_global);
				dom_model.find("#company_vat_"					+ suffix_global)
										.on("change", update_tag_parent_callback_global);
				dom_model.find("#company_vat_calculation_type_"	+ suffix_global)
										.on("change", update_tag_parent_callback_global);
			}

			dom_model.find("#AddCompanyLogoButton_"		+ suffix_global)
										.on("change", AddCompanyLogo_ChangeHandler);
			dom_model.find("#company_logo_"				+ suffix_global)
										.on("click", UploadCompanyLogo_ClickHandler)
										.on("load", UploadCompanyLogo_LoadHandler);
		}
		else
		{
			// --- company is undefined, means "create new"
		}
	};

	var	GetDOM = function(company) // --- company could be empty, if adding new company
	{
		var		result = $();

		// var		container				= $("<div>")	.addClass("container single_block __company_" + suffix_global);
		var		container					= $("<div>")	.addClass("__company_" + suffix_global);
		var		row_main_info				= $("<div>")	.addClass("row form-group");
		var		row_link					= $("<div>")	.addClass("row form-group");
		var		row_act_number				= $("<div>")	.addClass("row form-group");
		var		row_legal_address			= $("<div>")	.addClass("row form-group");
		var		row_mailing_address			= $("<div>")	.addClass("row form-group");
		var		row_tin						= $("<div>")	.addClass("row form-group");
		var		row_vat						= $("<div>")	.addClass("row form-group");
		var		row_vat_calculation_type_description
											= $("<div>")	.addClass("row form-group");
		var		row_vat_calculation_type_container
											= $("<div>")	.addClass("__row_vat_calculation_type collapse");
		var		row_vat_calculation_type_text
											= $("<div>")	.addClass("row form-group");
		var		row_vat_calculation_type	= $("<div>")	.addClass("row form-group");
		var		row_vat_calculation_type_top_shadow_div
											= $("<div>")	.addClass("col-xs-12 collapse-top-shadow margin_bottom_20")
															.append("<p></p>");
		var		row_vat_calculation_type_bottom_shadow_div 
											= $("<div>")	.addClass("col-xs-12 collapse-bottom-shadow margin_top_20")
															.append("<p></p>");
		var		row_account					= $("<div>")	.addClass("row form-group");
		var		row_ogrn					= $("<div>")	.addClass("row form-group");
		var		row_kpp						= $("<div>")	.addClass("row form-group");
		var		row_custom_field_title		= $("<div>")	.addClass("row form-group");

		var		legal_address_placeholder
											= $("<div>");
		var		mailing_address_placeholder
											= $("<div>");
		var		bank_bik_placeholder		= $("<div>");

		var		col_company_title			= $("<div>")	.addClass("col-xs-12 form-group");
		var		col_company_logo			= $("<div>")	.addClass("col-xs-4 col-md-2");
		var		col_company_description		= $("<div>")	.addClass("col-xs-8 col-md-10");

		var		col_link_title				= $("<div>")	.addClass("col-xs-4 col-md-2");
		var		col_link					= $("<div>")	.addClass("col-xs-8 col-md-10");

		var		col_act_number_title		= $("<div>")	.addClass("col-xs-4 col-md-2");
		var		col_act_number_prefix		= $("<div>")	.addClass("hidden-xs hidden-sm col-md-2");
		var		col_act_number				= $("<div>")	.addClass("col-xs-8 col-md-2");
		var		col_act_number_postfix		= $("<div>")	.addClass("hidden-xs hidden-sm col-md-2");

		var		col_legal_address			= $("<div>")	.addClass("col-xs-offset-4 col-xs-8  col-md-offset-2 col-md-10");
		var		col_mailing_address			= $("<div>")	.addClass("col-xs-offset-4 col-xs-8  col-md-offset-2 col-md-10");

		var		col_tin_title				= $("<div>")	.addClass("col-xs-4 col-md-2");
		var		col_tin						= $("<div>")	.addClass("col-xs-8 col-md-2");
		var		col_tin_button				= $("<div>")	.addClass("col-xs-offset-4 col-xs-8 col-md-offset-5 col-md-3");
		var		col_vat_title1				= $("<div>")	.addClass("col-xs-4 col-md-2");
		var		col_vat						= $("<div>")	.addClass("col-xs-4 col-md-2 form-switcher");
		var		col_vat_title2				= $("<div>")	.addClass("col-xs-4 col-md-2");
		var		col_vat_calculation_type_title1	= $("<div>")	.addClass("col-xs-4 col-md-2");
		var		col_vat_calculation_type		= $("<div>")	.addClass("col-xs-4 col-md-2 form-switcher");
		var		col_vat_calculation_type_title2	= $("<div>")	.addClass("col-xs-4 col-md-2");

		var		col_vat_calculation_type_description
											= $("<div>")	.addClass("col-xs-12");
		var		col_vat_calculation_type_text
											= $("<div>")	.addClass("col-xs-12");


		var		col_account_title			= $("<div>")	.addClass("col-xs-4 col-md-2");
		var		col_account					= $("<div>")	.addClass("col-xs-8 col-md-10");


		var		col_ogrn_title				= $("<div>")	.addClass("col-xs-4 col-md-2");
		var		col_ogrn					= $("<div>")	.addClass("col-xs-8 col-md-10");

		// var		row_ogrn_info				= $("<div>")	.addClass("row form-group").hide();
		// var		col_ogrn_info				= $("<div>")	.addClass("col-xs-12 alert alert-info");
		// var		row_kpp_info				= $("<div>")	.addClass("row form-group").hide();
		// var		ogrn_info_button			= $("<i>")		.addClass("fa fa-question-circle cursor_pointer").attr("aria-hidden", "true");
		// var		col_kpp_info				= $("<div>")	.addClass("col-xs-12 alert alert-info");
		// var		kpp_info_button				= $("<i>")		.addClass("fa fa-question-circle cursor_pointer").attr("aria-hidden", "true");

		var		col_custom_field_title		= $("<div>")	.addClass("col-xs-12 form-group");

		var		col_kpp_title				= $("<div>")	.addClass("col-xs-4 col-md-2");
		var		col_kpp						= $("<div>")	.addClass("col-xs-8 col-md-10");

		var		company_logo				= $("<img>")	.addClass("max_100px cursor_pointer");

		var		input_company_title			= $("<input>")	.addClass("form-control transparent text_align_center").css("font-size", "inherit");
		var		input_company_logo			= $("<input>")	.addClass("visibility_hidden width_0_height_0");
		var		textarea_company_desc		= $("<textarea>").addClass("form-control transparent");

		var		input_act_number_prefix		= $("<input>")	.addClass("form-control transparent");
		var		input_act_number			= $("<input>")	.addClass("form-control transparent")	.attr("type", "number");
		var		input_act_number_postfix	= $("<input>")	.addClass("form-control transparent");
		var		input_link					= $("<input>")	.addClass("form-control transparent");
		var		input_legal_address			= $("<input>")	.addClass("form-control transparent");
		var		input_mailing_address		= $("<input>")	.addClass("form-control transparent");
		var		input_tin					= $("<input>")	.addClass("form-control transparent");
		var		button_tin					= $("<button>")	.addClass("form-control btn btn-primary");
		var		input_account				= $("<input>")	.addClass("form-control transparent");
		var		input_ogrn					= $("<input>")	.addClass("form-control transparent");
		var		input_kpp					= $("<input>")	.addClass("form-control transparent");
		var		input_vat					= $("<input>");
		var		label_vat					= $("<label>")	.addClass("switcher");
		var		input_vat_calculation_type	= $("<input>");
		var		label_vat_calculation_type	= $("<label>")	.addClass("switcher");

		var		span_vat_calculation_type_description
											= $("<span>")	.addClass("link");
		var		span_vat_calculation_type_text
											= $("<span>");


		var		info_obj2					= new InfoObj();
		var		info_obj3					= new InfoObj();
		var		ogrn_obj					= info_obj2.GetDOM("OGRN", "#company_ogrn_");
		var		kpp_obj						= info_obj3.GetDOM("KPP", "#company_kpp_");

		var		custom_field_dom			= $();

		col_link_title				.append("Ссылка:");
		col_act_number_title		.append("Следующий номер выставляемых счетов:");
		col_tin_title				.append("ИНН:");
		col_vat_title1				.append("без НДС");
		col_vat_title2				.append("c НДС");

		span_vat_calculation_type_description
									.append("способ расчета НДС")
									.attr("data-toggle", "collapse")
									.attr("data-target", "div.__row_vat_calculation_type");

		col_vat_calculation_type_title1.append("ставка НДС от Итого");
		col_vat_calculation_type_title2.append("по сумме строк");
		col_account_title			.append("Расчетный счет:");
		col_ogrn_title				.append("ОГРН/ОГРНИП: ")	.append(ogrn_obj.button);
		col_kpp_title				.append("КПП: ")			.append(kpp_obj.button);
		// col_ogrn_title				.append("ОГРН/ОГРНИП: ")	.append(ogrn_info_button);
		// col_kpp_title				.append("КПП: ")			.append(kpp_info_button);
		button_tin					.append("Получить данные компании");
		col_custom_field_title		.append($("<center>").append($("<h4>").append("Дополнительная информация")));
		span_vat_calculation_type_text
									.append("Суммарный расчет НДС варьируется в зависимости от способа вычисления, по причине округления (см. пример). <span class='color_red'>Если не уверены - оставьте значение по умолчанию.</span><br><br> <img src='/images/pages/edit_company/vat_calculation_modes.PNG' class='width_100percent'>")


		company_logo				.attr("src", "/images/pages/common/empty_2.png");
		input_company_logo			.attr("type", "file");
		input_company_logo			.attr("accept", "image/*");

		input_vat					.attr("type", "checkbox");
		input_vat_calculation_type	.attr("type", "checkbox");

		legal_address_placeholder	.attr("id", "legal_geo_address_placeholder_"	+ suffix_global);
		mailing_address_placeholder	.attr("id", "mailing_geo_address_placeholder_"	+ suffix_global);
		bank_bik_placeholder		.attr("id", "bank_bik_placeholder_"				+ suffix_global);
		input_company_title			.attr("id", "company_title_"					+ suffix_global);
		company_logo				.attr("id", "company_logo_"						+ suffix_global);
		input_company_logo			.attr("id", "AddCompanyLogoButton_"				+ suffix_global);
		textarea_company_desc		.attr("id", "company_description_"				+ suffix_global);
		input_act_number_prefix		.attr("id", "company_act_number_prefix_"		+ suffix_global);
		input_act_number			.attr("id", "company_act_number_"				+ suffix_global);
		input_act_number_postfix	.attr("id", "company_act_number_postfix_"		+ suffix_global);
		input_link					.attr("id", "company_link_"						+ suffix_global);
		input_legal_address			.attr("id", "legal_address_"					+ suffix_global);
		input_mailing_address		.attr("id", "mailing_address_"					+ suffix_global);
		input_tin					.attr("id", "company_tin_"						+ suffix_global);
		input_account				.attr("id", "company_account_"					+ suffix_global);
		// row_ogrn_info				.attr("id", "company_ogrn_info_row_"			+ suffix_global);
		// col_ogrn_info				.attr("id", "company_ogrn_info_col_"			+ suffix_global);
		input_ogrn					.attr("id", "company_ogrn_"						+ suffix_global);
		// row_kpp_info				.attr("id", "company_kpp_info_row_"				+ suffix_global);
		// col_kpp_info				.attr("id", "company_kpp_info_col_"				+ suffix_global);
		input_kpp					.attr("id", "company_kpp_"						+ suffix_global);
		input_vat					.attr("id", "company_vat_"						+ suffix_global);
		label_vat					.attr("id", "company_vat_label_"				+ suffix_global);
		input_vat_calculation_type	.attr("id", "company_vat_calculation_type_"		+ suffix_global);
		label_vat_calculation_type	.attr("id", "company_vat_calculation_type_label_"+ suffix_global);

		input_vat					.attr("name", "company_vat_"					+ suffix_global);
		label_vat					.attr("for",  "company_vat_"					+ suffix_global);
		input_vat_calculation_type	.attr("name", "company_vat_calculation_type_"	+ suffix_global);
		label_vat_calculation_type	.attr("for",  "company_vat_calculation_type_"	+ suffix_global);

		input_company_title			.attr("placeholder", "Название компании");
		textarea_company_desc		.attr("placeholder", "Описание компании");
		input_act_number_prefix		.attr("placeholder", "Префикс счета (необязательно)");
		input_act_number			.attr("placeholder", "Номер выставляемого счета");
		input_act_number_postfix	.attr("placeholder", "Постфикс счета (необязательно)");
		input_link					.attr("placeholder", "Ссылка на сайт компании");
		input_legal_address			.attr("placeholder", "Юр. адрес");
		input_mailing_address		.attr("placeholder", "Адрес доставки");
		input_tin					.attr("placeholder", "ИНН");
		input_account				.attr("placeholder", "Расчетный счет");
		input_ogrn					.attr("placeholder", "ОГРН/ОГРНИП");
		input_kpp					.attr("placeholder", "КПП");

		input_company_title			.attr("data-action", "AJAX_updateCompanyTitle");
		textarea_company_desc		.attr("data-action", "AJAX_updateCompanyDescription");
		input_act_number_prefix		.attr("data-action", "AJAX_updateCompanyActNumberPrefix");
		input_act_number			.attr("data-action", "AJAX_updateCompanyActNumber");
		input_act_number_postfix	.attr("data-action", "AJAX_updateCompanyActNumberPostfix");
		input_link					.attr("data-action", "AJAX_updateCompanyWebSite");
		input_legal_address			.attr("data-action", "AJAX_updateCompanyLegalAddress");
		input_mailing_address		.attr("data-action", "AJAX_updateCompanyMailingAddress");
		input_tin					.attr("data-action", "AJAX_updateCompanyTIN");
		input_account				.attr("data-action", "AJAX_updateCompanyAccount");
		input_ogrn					.attr("data-action", "AJAX_updateCompanyOGRN");
		input_kpp					.attr("data-action", "AJAX_updateCompanyKPP");
		input_vat					.attr("data-action", "AJAX_updateCompanyVAT");
		label_vat					.attr("data-action", "AJAX_updateCompanyVAT");
		input_vat_calculation_type	.attr("data-action", "AJAX_updateCompanyVATCalculationType");
		label_vat_calculation_type	.attr("data-action", "AJAX_updateCompanyVATCalculationType");

		// ogrn_info_button			.on("click", OGRNInfo_ClickHandler);
		// kpp_info_button				.on("click", KPPInfo_ClickHandler);
		button_tin					.on("click", GetCompanyInfo_ClickHandler);

		col_company_title			.append($("<h4>").append($("<center>").append(input_company_title).append($("<label>"))));
		col_company_logo			.append(company_logo)			.append(input_company_logo);
		col_company_description		.append(textarea_company_desc);
		col_act_number_prefix		.append(input_act_number_prefix).append($("<label>"));
		col_act_number				.append(input_act_number)		.append($("<label>"));
		col_act_number_postfix		.append(input_act_number_postfix).append($("<label>"));
		col_link					.append(input_link)				.append($("<label>"));
		col_legal_address			.append(input_legal_address)	.append($("<label>"));
		col_mailing_address			.append(input_mailing_address)	.append($("<label>"));
		col_tin						.append(input_tin)				.append($("<label>"));
		col_tin_button				.append(button_tin);
		col_account					.append(input_account)			.append($("<label>"));
		col_ogrn					.append(input_ogrn)				.append($("<label>"));
		col_kpp						.append(input_kpp)				.append($("<label>"));
		col_vat						.append(input_vat)				.append(label_vat);
		col_vat_calculation_type	.append(input_vat_calculation_type).append(label_vat_calculation_type);

		container
			.append(row_main_info			.append(col_company_title)	.append(col_company_logo).append(col_company_description))
			.append(row_link				.append(col_link_title)		.append(col_link))
			.append(legal_address_placeholder)
			.append(row_legal_address		.append(col_legal_address))
			.append(mailing_address_placeholder)
			.append(row_mailing_address		.append(col_mailing_address))
			.append(row_tin					.append(col_tin_title)		.append(col_tin))
			.append(row_vat					.append(col_vat_title1)		.append(col_vat)		.append(col_vat_title2))

			.append(row_vat_calculation_type_description.append(col_vat_calculation_type_description.append(span_vat_calculation_type_description)))
			.append(row_vat_calculation_type_container
						.append(row_vat_calculation_type_top_shadow_div)
						.append(row_vat_calculation_type_text.append(col_vat_calculation_type_text.append(span_vat_calculation_type_text)))
						.append(row_vat_calculation_type.append(col_vat_calculation_type_title1).append(col_vat_calculation_type).append(col_vat_calculation_type_title2))
						.append(row_vat_calculation_type_bottom_shadow_div)
					)
			.append(bank_bik_placeholder)
			.append(row_account				.append(col_account_title)	.append(col_account))
			// .append(row_ogrn_info			.append(col_ogrn_info))
			.append(ogrn_obj.info)
			.append(row_ogrn				.append(col_ogrn_title)		.append(col_ogrn))
			// .append(row_kpp_info			.append(col_kpp_info))
			.append(kpp_obj.info)
			.append(row_kpp					.append(col_kpp_title)		.append(col_kpp))
			.append(row_act_number			.append(col_act_number_title).append(col_act_number_prefix).append(col_act_number).append(col_act_number_postfix));

		if((typeof company != "undefined") && (typeof company.custom_fields != "undefined") && company.custom_fields.length)
		{
			company.custom_fields.forEach(function(custom_field)
				{
					custom_field_dom = custom_field_dom.add(system_calls.GetEditableCompanyCustomField_DOM(custom_field));
				});

			container
				.append(row_custom_field_title	.append(col_custom_field_title))
				.append(custom_field_dom);
		}

		if(enable_tin_button_global)
		{
			row_tin.append(col_tin_button);
		}

		if(company)
		{
			// --- keep logo shown
		}
		else
		{
			company_logo.hide();
		}

		result = result.add(container);

		Render(company, result);

		return result;
	};

	var	UpdateOGRNAlert = function(text)
	{
		$("#company_ogrn_info_col_" + suffix_global).empty().append(text);
	};

	var	UpdateKPPAlert = function(text)
	{
		$("#company_kpp_info_col_" + suffix_global).empty().append(text);
	};
/*
	var	OGRNInfo_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	ogrn = $("#company_ogrn_" + suffix_global).val();

		system_calls.GetOGRNInfo_DOM(ogrn, UpdateOGRNAlert, curr_tag);

		$("#company_ogrn_info_row_" + suffix_global).show(200);
		setTimeout(function() { $("#company_ogrn_info_row_" + suffix_global).hide(200); }, 5000);
	};

	var	KPPInfo_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	kpp = $("#company_kpp_" + suffix_global).val();

		system_calls.GetKPPInfo_DOM(kpp, UpdateKPPAlert, curr_tag);

		$("#company_kpp_info_row_" + suffix_global).show(200);
		setTimeout(function() { $("#company_kpp_info_row_" + suffix_global).hide(200); }, 5000);
	};
*/
	var	GetCompanyInfo_ClickHandler = function()
	{
		var	curr_tag = $(this);
		var	new_company_tin = $("#company_tin_" + suffix_global).val();

		if(new_company_tin.length)
		{

			$.getJSON(
				'/cgi-bin/ajax_anyrole_1.cgi',
				{
					action: "AJAX_getCompanyInfo",
					tin: new_company_tin,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						data_global = data;

						if((typeof(data) != "undefined") && (typeof(data.companies) != "undefined") && data.companies.length)
						{
							Render(data.companies[0]);
						}
						else
						{
							system_calls.PopoverError(curr_tag, "Ошибка в объекте companies");
						}
					}
					else
					{
						system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
					}
				})
				.fail(function(data)
				{
					system_calls.PopoverError(curr_tag.attr("id"), "Ошибка ответа сервера");
				});
		}
		else
		{
			system_calls.PopoverError(curr_tag, "Заполните ИНН");
		}
	};

	var UpdateGeoZip_Callback = function(curr_tag)
	{
		console.debug(curr_tag.attr("data-action") + " " + curr_tag.attr("data-id"));
		if(typeof(update_tag_parent_callback_global) == "function") 
		{
			if(curr_tag.attr("data-company_id"))
				update_tag_parent_callback_global({currentTarget:curr_tag});
		}
	};

	var UpdateBIK_Callback = function(curr_tag)
	{
		console.debug(curr_tag.attr("data-action") + " " + curr_tag.attr("data-id"));
		if(typeof(update_tag_parent_callback_global) == "function") 
		{
			if(curr_tag.attr("data-company_id"))
				update_tag_parent_callback_global({currentTarget:curr_tag});
		}
	};

	var	isValid = function(dom_model)
	{
		var		result = true;

		dom_model = dom_model || $("body");

		if(dom_model.find("#company_title_" + suffix_global).val().length === 0)
		{
			system_calls.PopoverError("company_title_" + suffix_global, "Заполните название");
			result = false;
		}
		if(dom_model.find("#geo_zip_" + suffix_global + "_legal").val().length === 0)
		{
			system_calls.PopoverError("geo_zip_" + suffix_global + "_legal", "Заполните индекс");
			result = false;
		}
		if(dom_model.find("#legal_address_" + suffix_global).val().length === 0)
		{
			system_calls.PopoverError("legal_address_" + suffix_global, "Заполните юр. адрес");
			result = false;
		}
		if(dom_model.find("#bank_bik_" + suffix_global + "_1").val().length === 0)
		{
			system_calls.PopoverError("bank_bik_" + suffix_global + "_1", "Заполните БИК");
			result = false;
		}
		if(dom_model.find("#company_account_" + suffix_global).val().length === 0)
		{
			system_calls.PopoverError("company_account_" + suffix_global, "Заполните счет");
			result = false;
		}
		if(dom_model.find("#company_tin_" + suffix_global).val().length === 0)
		{
			system_calls.PopoverError("company_tin_" + suffix_global, "Заполните ИНН");
			result = false;
		}
		if(dom_model.find("#company_ogrn_" + suffix_global).val().length === 0)
		{
			system_calls.PopoverError("company_ogrn_" + suffix_global, "Заполните ОГРН");
			result = false;
		}
		if(dom_model.find("#bank_name_" + suffix_global + "_1").is(":disabled") == false)
		{
			system_calls.PopoverError("bank_bik_" + suffix_global + "_1", "Некорректный БИК");
			result = false;
		}
/*
		// --- optional to Individual Entrepreneurs
		if(dom_model.find("#company_kpp_" + suffix_global).val().length === 0)
		{
			system_calls.PopoverError("company_kpp_" + suffix_global, "Заполните КПП");
			result = false;
		}
*/
		return result;
	};

	var	SubmitNewCompanyToServer = function()
	{
		return	new Promise( 
			function(resolve, reject)
			{
				var		dom_model = $("body");

				if(isValid())
				{

					$.getJSON(
						'/cgi-bin/ajax_anyrole_1.cgi',
						{
							action: 						"AJAX_addNewCompany",
							type:		 					GetType(),
							company_title: 					dom_model.find("#company_title_" + suffix_global).val(),
							geo_zip_legal:					dom_model.find("#geo_zip_" + suffix_global + "_legal").val(),
							legal_address: 					dom_model.find("#legal_address_" + suffix_global).val(),
							geo_zip_mailing:				dom_model.find("#geo_zip_" + suffix_global + "_mailing").val(),
							bank_bik: 						dom_model.find("#bank_bik_" + suffix_global + "_1").val(),
							mailing_address: 				dom_model.find("#mailing_address_" + suffix_global).val(),
							company_account: 				dom_model.find("#company_account_" + suffix_global).val(),
							company_tin: 					dom_model.find("#company_tin_" + suffix_global).val(),
							company_vat: 					(dom_model.find("#company_vat_" + suffix_global).prop("checked") ? "Y" : "N"),
							company_vat_calculation_type: 	(dom_model.find("#company_vat_calculation_type_" + suffix_global).prop("checked") ? "Y" : "N"),
							company_ogrn: 					dom_model.find("#company_ogrn_" + suffix_global).val(),
							company_kpp: 					dom_model.find("#company_kpp_" + suffix_global).val()
						})
						.done(function(data)
						{
							if(data.result == "success")
							{
								resolve(data);
							}
							else
							{
								reject("Ошибка: " + data.description);
							}
						})
						.fail(function(data)
						{
							reject("Ошибка ответа сервера");
						});
				}
				else
				{
					reject("Заполните данные компании");
				}
			});
	};

	return {
		Init: Init,
		GetDOM: GetDOM,
		SetTINButtonStatus: SetTINButtonStatus,
		SetCountriesObj: SetCountriesObj,
		UpdateGeoZip_Callback: UpdateGeoZip_Callback,
		isValid: isValid,
		GetSuffix: GetSuffix,
		SetType: SetType,
		GetType: GetType,
		SubmitNewCompanyToServer: SubmitNewCompanyToServer,
	};

};
