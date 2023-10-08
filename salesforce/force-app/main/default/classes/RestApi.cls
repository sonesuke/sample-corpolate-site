@RestResource(urlMapping='/campaign-register/*')
global with sharing class RestApi {
    public RestApi() {

    }

    @HttpPost
    global static void doPost(
        String firstName,
        String lastName,
        String company,
        String email,
        String campaignId
        ) {
            RestResponse res = RestContext.response;
            res.addHeader('Content-Type', 'application/json');

            email = email.trim().toLowerCase();

            try {
                List<Contact> contacts = [SELECT Id, Name FROM Contact WHERE email = :email];
                if (contacts.size() > 0) {
                    CampaignMember campaignMember = new CampaignMember();
                    campaignMember.ContactId = contacts[0].Id;
                    campaignMember.CampaignId = campaignId;
                    insert campaignMember;

                    res.statusCode = 200;
                    res.responseBody = Blob.valueOf('{"message": "A Contact has been added to the campaign."}');
                    return;
                }
    
                List<Lead> leads = [SELECT Id, Name FROM Lead WHERE email = :email];
                if (leads.size() > 0) {
                    CampaignMember campaignMember = new CampaignMember();
                    campaignMember.LeadId = leads[0].Id;
                    campaignMember.CampaignId = campaignId;
                    insert campaignMember;

                    res.statusCode = 200;
                    res.responseBody = Blob.valueOf('{"message": "A Lead has been added to the campaign."}');
                    return;
                } else {
                    Lead lead = new Lead();
                    lead.FirstName = firstName;
                    lead.LastName = lastName;
                    lead.Email = email;
                    lead.Company = company;
                    insert lead;
    
                    CampaignMember campaignMember = new CampaignMember();
                    campaignMember.LeadId = lead.Id;
                    campaignMember.CampaignId = campaignId;
                    insert campaignMember;

                    res.statusCode = 200;
                    res.responseBody = Blob.valueOf('{"message": "New Lead has been added to the campaign."}');
                    return;
                }
            } catch (Exception e) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf('{"message": "' + e.getMessage() +'"}');
                return;
            }            
    }
}