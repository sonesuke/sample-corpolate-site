trigger CampaignTrigger on Campaign (after insert, after delete, after update) {
    WebHookTriggerHandler handler = new WebHookTriggerHandler();
    handler.handleWebHookTrigger();
}