var	timecard_autocomplete = timecard_autocomplete || {};

var	timecard_autocomplete = (function()
{
	'use strict';

	var		data_global;
	var		current_sow_global;
	var		CallbackAfterTaskSelection_global;

	var	Init = function(data, current_sow, CallbackAfterTaskSelection)
	{
		data_global = data;
		current_sow_global = current_sow;
		CallbackAfterTaskSelection_global = CallbackAfterTaskSelection;
	};


	var	GetProjectTitleByTaskID = function(activeTaskID)
	{
		var		result = "0";

		data_global.sow.forEach(function(sow)
		{
			if(sow.id == current_sow_global)
			{
				sow.tasks.forEach(function(task)
				{
					if(task.id == activeTaskID) result = task.projects[0].title;
				});
			}
		});

		return result;
	};

	var	GetCustomerTitleByTaskID = function(activeTaskID)
	{
		var		result = "0";

		data_global.sow.forEach(function(sow)
		{
			if(sow.id == current_sow_global)
			{
				sow.tasks.forEach(function(task)
				{
					if(task.id == activeTaskID) result = task.projects[0].customers[0].title;
				});
			}
		});

		return result;
	};

	var	GetCustomerTitleByProjectID = function(activeProjectID)
	{
		var		result = "0";

		data_global.sow.forEach(function(sow)
		{
			if(sow.id == current_sow_global)
			{
				sow.tasks.forEach(function(task)
				{
					task.projects.forEach(function(project)
					{
						if(project.id == activeProjectID) result = project.customers[0].title;
					});
				});
			}
		});

		return result;
	};



	// --- Autocomplete_handlers
	// --- create autocomplete
	// --- input:
	// ---       elem - element required autocomplete
	// --- 		 srcData - array of {id:"id", label:"label"}
	// ---       selectCallback - function(event, ui)

	var	Autocomplete_Customer_SelectHandler = function(event, ui)
	{
		var		userID = ui.item.id;
		var 	userLabel = ui.item.label;
		var		random = $(this).data("random");

		$("input#project" + random).val("");
		$("input#task" + random).val("");
	};

	var	Autocomplete_Customer_InputHandler = function()
	{
		var	currentTag = $(this);
		var	currentValue = currentTag.val();

		// if(currentValue.length == 3)
		{
			var	AutocompleteList = Autocomplete_GetCustomersList("", "", "");
			system_calls.CreateAutocompleteWithSelectCallback(currentTag, AutocompleteList, Autocomplete_Customer_SelectHandler);
		}
	};

	var	Autocomplete_GetCustomersList = function(activeCustomerTitle, activeProjectTitle, activeTaskTitle)
	{
		var	result = [];

		data_global.sow.forEach(function(sow)
		{
			if(sow.id == current_sow_global)
			{
				for (var i = 0; i < sow.tasks.length; ++i)
				{
					var	task = sow.tasks[i];

					for (var j = 0; j < sow.tasks[i].projects.length; ++j)
					{
						var	project = sow.tasks[i].projects[j];

						for (var k = 0; k < sow.tasks[i].projects[j].customers.length; ++k)
						{
							var	customer = sow.tasks[i].projects[j].customers[k];

							if(system_calls.isElementInList(customer.id, result))
							{}
							else
							{
								result.push({id: customer.id, label: customer.title});
							}
						}
					}
				}

			}
		});

		return result;
	};

	var	Autocomplete_Project_SelectHandler = function(event, ui)
	{
		var		project_id = ui.item.id;
		var 	project_label = ui.item.label;
		var		random = $(this).data("random");

		$("input#customer" + random).val(GetCustomerTitleByProjectID(project_id));
		$("input#task" + random).val("");
	};

	var	Autocomplete_Project_InputHandler = function()
	{
		var	currentTag = $(this);
		var	currentValue = currentTag.val();

		// if(currentValue.length == 3)
		{
			var	random = currentTag.data("random");
			var	AutocompleteList = Autocomplete_GetProjectsList($("input#customer" + random).val(), "", "");
			system_calls.CreateAutocompleteWithSelectCallback(currentTag, AutocompleteList, Autocomplete_Project_SelectHandler);
		}
	};

	var	Autocomplete_GetProjectsList = function(activeCustomerTitle, activeProjectTitle, activeTaskTitle)
	{
		var	result = [];

		data_global.sow.forEach(function(sow)
		{
			if(sow.id == current_sow_global)
			{
				var		isValid = false;

				for (var i = 0; i < sow.tasks.length; ++i)
				{
					var	task = sow.tasks[i];

					for (var j = 0; j < sow.tasks[i].projects.length; ++j)
					{
						var	project = sow.tasks[i].projects[j];

						for (var k = 0; k < sow.tasks[i].projects[j].customers.length; ++k)
						{
							var	customer = sow.tasks[i].projects[j].customers[k];

							if(activeCustomerTitle === "") isValid = true;
							else if(customer.title == activeCustomerTitle) isValid = true;
						}

						if(isValid)
						{
							if(system_calls.isElementInList(project.id, result))
							{}
							else
							{
								result.push({id: project.id, label: project.title});
							}
						}

						isValid = false;
					}
				}

			}
		});

		return result;
	};

	var	Autocomplete_Task_SelectHandler = function(event, ui)
	{
		var		task_id = ui.item.id;
		var 	task_label = ui.item.label;
		var		random = $(this).data("random");

		$("input#customer" + random).val(GetCustomerTitleByTaskID(task_id));
		$("input#project" + random).val(GetProjectTitleByTaskID(task_id));

		CallbackAfterTaskSelection_global(random, task_id);

/*
		UpdateTimeRowEntriesDisableStatus(random, task_id);

		dontResetInputFieldsFlag = true;
		setTimeout(function(){ dontResetInputFieldsFlag = false; }, 100);
*/
	};

	var	Autocomplete_Task_InputHandler = function()
	{
		var	currentTag = $(this);
		var	currentValue = currentTag.val();

		// if(currentValue.length == 3)
		{
			var	random = currentTag.data("random");
			var	AutocompleteList = Autocomplete_GetTasksList($("input#customer" + random).val(), $("input#project" + random).val(), "");
			system_calls.CreateAutocompleteWithSelectCallback(currentTag, AutocompleteList, Autocomplete_Task_SelectHandler);
		}
	};

	var	Autocomplete_GetTasksList = function(activeCustomerTitle, activeProjectTitle, activeTaskTitle)
	{
		var	result = [];

		data_global.sow.forEach(function(sow)
		{
			if(sow.id == current_sow_global)
			{
				var		isValid = false;

				for (var i = 0; i < sow.tasks.length; ++i)
				{
					var	task = sow.tasks[i];

					for (var j = 0; j < sow.tasks[i].projects.length; ++j)
					{
						var	project = sow.tasks[i].projects[j];

						for (var k = 0; k < sow.tasks[i].projects[j].customers.length; ++k)
						{
							var	customer = sow.tasks[i].projects[j].customers[k];

							if(activeCustomerTitle === "") isValid = true;
							else if(customer.title == activeCustomerTitle) isValid = true;
						}

						if(isValid)
						{
							if(activeProjectTitle === "") {}
							else if(project.title == activeProjectTitle) {}
							else isValid = false;
						}

					}
					if(isValid)
					{
						if(system_calls.isElementInList(task.id, result))
						{}
						else
						{
							result.push({id: task.id, label: task.title});
						}
					}

					isValid = false;
				}

			}
		});

		return result;
	};

	return {
		Init: Init,
		Autocomplete_Customer_SelectHandler: Autocomplete_Customer_SelectHandler,
		Autocomplete_Project_SelectHandler: Autocomplete_Project_SelectHandler,
		Autocomplete_Task_SelectHandler: Autocomplete_Task_SelectHandler,
		Autocomplete_Customer_InputHandler: Autocomplete_Customer_InputHandler,
		Autocomplete_Project_InputHandler: Autocomplete_Project_InputHandler,
		Autocomplete_Task_InputHandler: Autocomplete_Task_InputHandler,
	};

})();

