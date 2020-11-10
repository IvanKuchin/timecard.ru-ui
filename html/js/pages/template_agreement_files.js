var	template_agreement_files = function(suffix_init)
{
	'use strict';

	var	DATE_FORMAT_GLOBAL = "dd/mm/yy";
	var	data_global;
	var	type_global = "company";
	var	id_global = "";
	var	suffix_global = "suffix";
	var	hosting_tag_global;
	var	update_tag_parent_callback_global;

	var	Init = function(param)
	{
		update_tag_parent_callback_global = param;
		$("#new_template_agreement_submit").on("click", AddNewTemplate_ClickHandler)
		$("#AreYouSureRemoveTemplateAgreement .submit").on("click", Remove_AreYouSure_Submit_ClickHandler)
	};

	var	GetType			= function()		{ return type_global; };
	var	GetID			= function()		{ return id_global; };
	var	SetType			= function(param)	{ type_global			= param; };
	var	SetID			= function(param)	{ id_global				= param; };
	var	SetHostingTag	= function(param)	{ hosting_tag_global	= param; };

	var	GetDOM = function()
	{
		var		result = $();

		if((typeof data_global != "undefined") && (typeof data_global.template_agreement_files != "undefined"))

		data_global.template_agreement_files.forEach(function(template_agreement_file)
			{
				var		row				= $("<div>")	.addClass("row zebra_painting __template_agreement_file_" + template_agreement_file.id);
				var		col_title		= $("<div>")	.addClass("col-xs-4 col-md-3");
				var		col_file		= $("<div>")	.addClass("col-xs-6 col-md-8");
				var		col_remove		= $("<div>")	.addClass("col-xs-2 col-md-1");
				var		input_title		= $("<input>")	.addClass("transparent __template_agreement_file_" + template_agreement_file.id);
				var		input_file		= $("<input>")	.addClass("transparent");
				var		curr_value		= $("<a>");
				var		remove_tag		= $("<i>")		.addClass("fa fa-times-circle padding_close float_right cursor_pointer animate_close_onhover");

				remove_tag
					.attr("data-id", template_agreement_file.id)
					.on("click", Remove_AreYouSure_ClickHandler);
				input_title
					.attr("data-db_value", template_agreement_file.title)
					.attr("data-script", "agency.cgi")
					.attr("data-id", template_agreement_file.id)
					.attr("data-action", "AJAX_updateTemplateAgreement_" + GetType() + "_Title")
					.on("change", update_tag_parent_callback_global)
					.val(template_agreement_file.title);
				input_file
					.attr("type", "file")
					.attr("data-id", template_agreement_file.id)
					.attr("data-db_value", template_agreement_file.filename)
					.attr("data-item_type", "template_agreement_" + GetType())
					.on("change", system_calls.SoWFileUploader_ChangeHandler)
				curr_value.attr("href", "/template_agreement_" + GetType() + "/" + template_agreement_file.filename);
				if(template_agreement_file.filename.length)
					curr_value.append("Текущий фаил");

				row
					.append(col_title)
					.append(col_file)
					.append(col_remove);
				col_title
					.append(input_title)
					.append($("<label>"));
				col_file
					.append(input_file)
					.append(curr_value);
				col_remove
					.append(remove_tag);

				result = result.add(row);
			});

		return result;
	};

	var	Render = function()
	{
		return GetTemplateAgreementListFromServer().then(
				function()
				{
					// --- success
					hosting_tag_global.empty().append(GetDOM());
				},
				function(data)
				{
					// --- fail
					system_calls.PopoverError(hosting_tag_global, data);
				}
			);
	};

	var	GetTemplateAgreementListFromServer = function()
	{
		return	new Promise( 
			function(resolve, reject)
			{
				if(GetID().length)
				{
					if(GetType().length)
					{

						$.getJSON(
							'/cgi-bin/agency.cgi',
							{
								action: 	"AJAX_getTemplateAgreementFiles",
								type:		GetType(),
								id:			GetID(),
							})
							.done(function(data)
							{
								if(data.result == "success")
								{
									data_global = data;
									resolve();
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
						reject("тип не определен");
					}
				}
				else
				{
					reject("id не определен");
				}
			});
	};

	var	isValid = function(title)
	{
		var error_message = "";

		if(title.length) {}
		else error_message = "Заполните название документа";

		return error_message;
	}

	var	AddNewTemplate_ClickHandler = function()
	{
		var	curr_tag		= $(this);
		var	title_tag		= $(".new_template_agreement");
		var error_message	= isValid(title_tag.val());
		var	elem_id;

		if(error_message === "")
		{
			SubmitNewTemplateToServer(title_tag.val())
				.then(
					function(data)
					{
						curr_tag.closest(".collapse").collapse("hide");
						title_tag.val("");
						elem_id = data.id;

						// --- success
						return Render();
					},
					function(data)
					{
						// --- fail
						system_calls.PopoverError(curr_tag, data);
					})
				.then(
					function(data)
					{
						system_calls.ScrollToAndHighlight(".row.__template_agreement_file_" + elem_id, "input.__template_agreement_file_" + elem_id);
					},
					function(data)
					{
						// --- fail
						system_calls.PopoverError(curr_tag, data);
					});
		}
		else
		{
			system_calls.PopoverError(curr_tag, error_message);
		}

	};

	var	SubmitNewTemplateToServer = function(title)
	{
		return	new Promise( 
			function(resolve, reject)
			{
				var		dom_model = $("body");

				$.getJSON(
					'/cgi-bin/agency.cgi',
					{
						action: 	"AJAX_addTemplateAgreementFile",
						id:			GetID(),
						type:		GetType(),
						title:		title,
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
			});
	};

	var Remove_AreYouSure_Submit_ClickHandler = function(e)
	{
		var	curr_tag = $(this);
		var	elem_id = $("#AreYouSureRemoveTemplateAgreement .submit").attr("data-id");

		$.getJSON(
			'/cgi-bin/agency.cgi',
			{
				action: 	"AJAX_deleteTemplateAgreement_" + GetType(),
				id:			elem_id,
				value:	"fake value",
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					$("#AreYouSureRemoveTemplateAgreement").modal("hide");
					setTimeout(function() { $(".row.__template_agreement_file_" + elem_id).hide(250); }, 250);
				}
				else
				{
					system_calls.PopoverError(curr_tag, "Ошибка: " + data.description);
				}
			})
			.fail(function(data)
			{
				system_calls.PopoverError(curr_tag, "Ошибка ответа сервера");
			});
	};

	var	Remove_AreYouSure_ClickHandler = function(e)
	{
		var		curr_tag = $(this);

		$("#AreYouSureRemoveTemplateAgreement .submit").attr("data-id", curr_tag.attr("data-id"));
		$("#AreYouSureRemoveTemplateAgreement").modal("show");
	};

	return {
		Init: Init,
		SetType: SetType,
		SetID: SetID,
		SetHostingTag: SetHostingTag,
		Render: Render,
	};

};
