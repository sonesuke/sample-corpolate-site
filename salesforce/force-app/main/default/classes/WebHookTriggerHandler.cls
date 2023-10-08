public with sharing class WebHookTriggerHandler {
    public WebHookTriggerHandler() {

    }

    public void handleWebHookTrigger() {
        List<Campaign> campaigns = [SELECT Id, Name, Status, StartDate, EndDate FROM Campaign WHERE IsDeleted = false];

        // convert camapgins to JSON
        String jsonCampaigns = JSON.serialize(campaigns);

        // send JSON to external system
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:WebHookTrigger/sync');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(jsonCampaigns);

        Http http = new Http();
        HTTPResponse res = http.send(req);
        System.debug(res.getBody());
    }
}