var	geo_zip_edit = function(suffix, spelling_title, action, callback_func)
{
	'use strict';

	var	callback_global = (typeof(callback_func) == "function" ? callback_func : undefined);
	var	suffix_global = suffix;
	var	countries_global;
	var	spelling_title_global = spelling_title;
	var	action_global = action;

	var	Init = function()
	{
	};

	var SetCountriesObj = function(obj)
	{
		countries_global = obj;

		countries_global.sort(function(a, b)
			{
				var		titleA = a.title;
				var		titleB = b.title;
				var		result;

				if(titleA == titleB) { result = 0; }
				if(titleA > titleB) { result = 1; }
				if(titleA < titleB) { result = -1; }

				return result;
			});
	};

	var	Render = function(geo_zip_obj, dom_model)
	{
		var		country_options = $();

		dom_model = dom_model || $("body");

		if(countries_global)
		{
			countries_global.forEach(function(item)
			{
				country_options = country_options.add($("<option>").append(item.title));
			});
		}
		else
		{
			console.error("country object is empty. Use SetCountriesObj before render.");
		}

		dom_model.find("#geo_country_"	+ suffix_global)
												.empty()
												.append(country_options);

		if(geo_zip_obj)
		{
			dom_model.find("#geo_zip_"		+ suffix_global)
													.val(geo_zip_obj.zip)
													.attr("data-db_value", geo_zip_obj.zip)
													.attr("data-id", geo_zip_obj.id);
			dom_model.find("#geo_locality_"	+ suffix_global)
													.val(geo_zip_obj.locality.title);
			dom_model.find("#geo_region_"	+ suffix_global)
													.val(geo_zip_obj.locality.region.title);
			dom_model.find("#geo_country_"	+ suffix_global)
													.val(geo_zip_obj.locality.region.country.title);

			BlockRegionAndCityFields(dom_model);
		}
		else
		{
			// --- geo_zip_obj is undefined, means "create new"
		}
	};

	var GetDOM = function(geo_zip_obj)
	{
		var		result = $();
		var		row_location			= $("<div>")	.addClass("row");
		var		col_location_title		= $("<div>")	.addClass("col-xs-4 col-md-2");
		var		col_location_country	= $("<div>")	.addClass("col-xs-4 col-md-2");
		var		col_location_zip		= $("<div>")	.addClass("col-xs-4 col-md-2");
		var		col_location_region		= $("<div>")	.addClass("col-xs-offset-4 col-xs-8  col-md-offset-0 col-md-3");
		var		col_location_locality	= $("<div>")	.addClass("col-xs-offset-4 col-xs-8  col-md-offset-0 col-md-3");
		var		select_country			= $("<select>")	.addClass("form-control transparent");
		var		input_zip				= $("<input>")	.addClass("form-control transparent");
		var		input_region			= $("<input>")	.addClass("form-control transparent");
		var		input_locality			= $("<input>")	.addClass("form-control transparent");

		var		country_options			= $();

		select_country	.attr("id", "geo_country_"	+ suffix_global);
		input_zip		.attr("id", "geo_zip_"		+ suffix_global)	.attr("placeholder", "Индекс");
		input_region	.attr("id", "geo_region_"	+ suffix_global)	.attr("placeholder", "Регион");
		input_locality	.attr("id", "geo_locality_"	+ suffix_global)	.attr("placeholder", "Город");

		input_zip		.attr("data-action", action_global);

		select_country	.on("change", Country_ChangeHandler);

		input_zip		.on("change", Zip_ChangeHandler);
		input_region	.on("change", Region_ChangeHandler)
						.on("input",  Region_InputHandler);
		input_locality	.on("change", Locality_ChangeHandler)
						.on("input",  Locality_InputHandler);

		col_location_title		.append(spelling_title_global);
		col_location_country	.append(select_country)	.append($("<label>"));
		col_location_zip		.append(input_zip)		.append($("<label>"));
		col_location_region		.append(input_region)	.append($("<label>"));
		col_location_locality	.append(input_locality)	.append($("<label>"));

		row_location
			.append(col_location_title)
			.append(col_location_country)
			.append(col_location_zip)
			.append(col_location_region)
			.append(col_location_locality);

		result = result
					.add(row_location);

		Render(geo_zip_obj, result);

		return result;
	};

	var BlockRegionAndCityFields = function(dom_model)
	{
		dom_model = dom_model || $("body");

		if(
			dom_model.find("#geo_zip_" + suffix_global).val().length &&
			dom_model.find("#geo_locality_" + suffix_global).val().length && 
			dom_model.find("#geo_region_" + suffix_global).val().length && 
			dom_model.find("#geo_country_" + suffix_global).val().length
		)
		{
			dom_model.find("#geo_region_" + suffix_global).attr("disabled", "");
			dom_model.find("#geo_locality_" + suffix_global).attr("disabled", "");
		}
		else
		{
			dom_model.find("#geo_region_" + suffix_global).removeAttr("disabled");
			dom_model.find("#geo_locality_" + suffix_global).removeAttr("disabled");
		}
	};

	var	Country_ChangeHandler = function(e)
	{
		$("#geo_zip_" + suffix_global).val("");
		$("#geo_region_" + suffix_global).val("");
		$("#geo_locality_" + suffix_global).val("");		

		BlockRegionAndCityFields();
	};

	var	Zip_ChangeHandler = function(e)
	{
		$("#geo_region_" + suffix_global).val("");
		$("#geo_locality_" + suffix_global).val("");		

		BlockRegionAndCityFields();
		MakeRegionAndCityAssumption();
	};

	var	Region_ChangeHandler = function(e)
	{
		SubmitNewIndex();
	};

	var	Locality_ChangeHandler = function(e)
	{
		SubmitNewIndex();
	};

	var	SubmitNewIndex = function()
	{
		var	country = $("#geo_country_" + suffix_global).val();
		var	region = $("#geo_region_" + suffix_global).val();
		var	locality = $("#geo_locality_" + suffix_global).val();
		var	zip 	= $("#geo_zip_" + suffix_global).val();

		if(country.length && region.length && locality.length && zip.length)
		{
			$.getJSON(
				'/cgi-bin/ajax_anyrole_1.cgi',
				{
					action: "AJAX_submitNewGeoZip",
					country: country,
					region: region,
					locality: locality,
					zip: zip,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						Render(data.geo_zip[0]);

						if(typeof(callback_global) == "function") callback_global($("#geo_zip_" + suffix_global));
					}
					else
					{
						// --- Some errors look weird in following cases
						// --- 1) if browser autocomplete your adress, you'll get ERROR zip already exists
						// --- 2) if you create new zip , you'll get ERROR zip doesn't exists
						// system_calls.PopoverError($("#geo_zip_" + suffix_global), "Ошибка: " + data.description);
					}
				})
				.fail(function(e)
				{
					system_calls.PopoverError($("#geo_zip_" + suffix_global), "Ошибка ответа сервера");
				});
		}
	};

	var	MakeRegionAndCityAssumption = function()
	{
		var	country = $("#geo_country_" + suffix_global).val();
		var	zip 	= $("#geo_zip_" + suffix_global).val();
		var	curr_tag = "geo_zip_" + suffix_global;

		if(zip.length && country.length)
		{
			$.getJSON(
				'/cgi-bin/ajax_anyrole_1.cgi',
				{
					action: "AJAX_getGeoRegionAndLocalityNames",
					country: country,
					zip: zip,
				})
				.done(function(data)
				{
					if(data.result == "success")
					{
						Render(data.geo_zip[0]);

						if(typeof(callback_global) == "function") callback_global($("#geo_zip_" + suffix_global));
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
	};

	var	Region_InputHandler = function(e)
	{
		var	curr_tag = $(this);
		var	currentValue = curr_tag.val();
		var	country = $("#geo_country_" + suffix_global).val();

		$.getJSON(
			'/cgi-bin/ajax_anyrole_1.cgi',
			{
				action: "AJAX_getRegionAutocompleteList",
				region: currentValue,
				country: country
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					system_calls.CreateAutocompleteWithSelectCallback(curr_tag, data.autocomplete_list, function() {});
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
	};

	var	Locality_InputHandler = function(e)
	{
		var	curr_tag = $(this);
		var	currentValue = curr_tag.val();
		var	country = $("#geo_country_" + suffix_global).val();
		var	region = $("#geo_region_" + suffix_global).val();

		$.getJSON(
			'/cgi-bin/ajax_anyrole_1.cgi',
			{
				action: "AJAX_getLocalityAutocompleteList",
				locality: currentValue,
				region: region,
				country: country
			})
			.done(function(data)
			{
				if(data.result == "success")
				{
					system_calls.CreateAutocompleteWithSelectCallback(curr_tag, data.autocomplete_list, function() {});
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
		
	};

	return {
		Init: Init,
		SetCountriesObj: SetCountriesObj,
		GetDOM: GetDOM,
	};

};
