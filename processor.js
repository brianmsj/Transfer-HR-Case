(function(_this) {
	//create script variables
	var title;
	var description;
	var assignmentGroup;
	var grNewTask;
	var grService;
	var grOriginalTask;
	var ignoredFields;
	var fieldName;
	var fields;
	var grAttachments;

	    grOriginalTask = new GlideRecord(task_table_name);
	if (!grOriginalTask.get(task_sys_id)) {
		gs.addErrorMessage(gs.getMessage("Could not find original case"));
		return;
	}
	    grService = new GlideRecord("sn_hr_core_service");
	if (!grService.get(selected_service)) {
		gs.addErrorMessage(gs.getMessage("Could not find selected service"));
		return;
	}

	// Create new case
	grNewTask = new GlideRecord(grService.topic_detail.topic_category.coe);
	grNewTask.setValue('hr_service',selected_service);
	grNewTask.setValue('task_sys_id');

	//set new field variables
    title = grOriginalTask.getValue('short_description');
	description = grOriginalTask.getValue('description');
	assignmentGroup = grOriginalTask.getValue('assignment_group');

	// set transfer fields from from old task to new task
	grNewTask.setValue('short_description',title);
	grNewTask.setValue('description',description);
	grNewTask.setValue('assignment_group',assignmentGroup);

	grNewTask.comments = gs.getMessage("Case was transferred from {0}", [grOriginalTask.number]);
	grOriginalTask.setValue('transferred_to',grNewTask.getUniqueValue());
	// Copy fields from original case
	ignoredFields = ["assigned_to", "employee_percent_complete", "fulfillment_instructions", "hr_service", "number", "payload", "pdf_template", "sla", "sla_suspended", "sla_suspended_for", "sla_suspended_on", "sla_suspended_reason", "state", "submitter_can_cancel", "task_percent_complete", "template", "template_invoked", "topic_category", "topic_detail", "transferred_from", "transferred_to", "workflow", "workflow_invoked","work_notes"]; // I put work notes back into ignored fields because HR can look at the case it was transferred from.
	    fields = grOriginalTask.getElements();
	for (var i = 0; i < fields.length; i++) {
		fieldName = fields[i].getName();
		if (!fieldName.startsWith("sys_") && ignoredFields.indexOf(fieldName) == -1 && grNewTask.isValidField(fieldName))
			grNewTask[fieldName] = grOriginalTask[fieldName];
	}
	if (!grNewTask.insert()) {
		gs.addErrorMessage(gs.getMessage("Failed to insert a new case"));
		return;
	}

	// Cancel original case
	grOriginalTask.setValue('state',7);
	grOriginalTask.comments = gs.getMessage("Case was cancelled and transferred to {0}", [grNewTask.number]);
	if (!grOriginalTask.update()) {
		gs.addErrorMessage(gs.getMessage("Failed to close original case"));
		return;
	}

	// Copy attachments from original case
	    grAttachments = new GlideSysAttachment().copy(task_table_name, task_sys_id, grNewTask.getRecordClassName(), grNewTask.getUniqueValue());
	if (grAttachments.length > 0) {
		grNewTask.get(grNewTask.getUniqueValue());
		grNewTask.comments = gs.getMessage("File attachments were copied from {0}", [grOriginalTask.number]);
		grNewTask.update();
	}

	gs.addInfoMessage(gs.getMessage("Case was transferred from {0}", [grOriginalTask.number]));
	response.sendRedirect(grNewTask.getRecordClassName() + ".do?sysparm_query=sys_id=" + grNewTask.getUniqueValue());
})(this);
