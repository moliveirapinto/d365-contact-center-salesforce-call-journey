/**
 * Maps a Dynamics 365 customer (contact or account) to the matching Salesforce record,
 * so the Edge widget can pop the right Salesforce page when a call is accepted.
 */
public with sharing class D365ScreenPopResolver {

    public class Match {
        @AuraEnabled public String objectApiName;
        @AuraEnabled public String recordId;
    }

    @AuraEnabled
    public static Match resolve(String phone, String mobile, String email, String name, String d365Type) {
        List<String> digits = new List<String>();
        for (String p : new List<String>{ mobile, phone }) {
            String d = lastDigits(p);
            if (d != null && !digits.contains(d)) {
                digits.add(d);
            }
        }

        for (String d : digits) {
            List<List<SObject>> r = [FIND :d IN PHONE FIELDS RETURNING Contact(Id), Account(Id) LIMIT 5];
            if (!((List<Contact>) r[0]).isEmpty()) {
                return build('Contact', ((List<Contact>) r[0])[0].Id);
            }
            if (!((List<Account>) r[1]).isEmpty()) {
                return build('Account', ((List<Account>) r[1])[0].Id);
            }
        }

        if (String.isNotBlank(email)) {
            List<Contact> byMail = [SELECT Id FROM Contact WHERE Email = :email LIMIT 1];
            if (!byMail.isEmpty()) {
                return build('Contact', byMail[0].Id);
            }
        }

        if (String.isNotBlank(name)) {
            if (d365Type == 'account') {
                List<Account> a = [SELECT Id FROM Account WHERE Name = :name LIMIT 2];
                if (a.size() == 1) {
                    return build('Account', a[0].Id);
                }
            } else {
                List<Contact> c = [SELECT Id FROM Contact WHERE Name = :name LIMIT 2];
                if (c.size() == 1) {
                    return build('Contact', c[0].Id);
                }
            }
        }
        return null;
    }

    private static String lastDigits(String phone) {
        if (String.isBlank(phone)) {
            return null;
        }
        String d = phone.replaceAll('[^0-9]', '');
        if (d.length() < 7) {
            return null;
        }
        return d.length() > 10 ? d.substring(d.length() - 10) : d;
    }

    private static Match build(String objectApiName, Id recordId) {
        Match m = new Match();
        m.objectApiName = objectApiName;
        m.recordId = recordId;
        return m;
    }
}
