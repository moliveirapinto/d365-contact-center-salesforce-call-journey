@IsTest
private class D365ScreenPopResolverTest {
    @IsTest
    static void matchesContactByPhone() {
        Contact c = new Contact(LastName = 'Resolver', Phone = '(512) 555-0142');
        insert c;
        Test.setFixedSearchResults(new List<Id>{ c.Id });
        D365ScreenPopResolver.Match m = D365ScreenPopResolver.resolve('+1 512 555 0142', null, null, null, 'contact');
        System.assertNotEquals(null, m);
        System.assertEquals('Contact', m.objectApiName);
    }

    @IsTest
    static void matchesContactByEmail() {
        insert new Contact(LastName = 'Resolver', Email = 'resolver@example.com');
        D365ScreenPopResolver.Match m = D365ScreenPopResolver.resolve(null, null, 'resolver@example.com', null, 'contact');
        System.assertNotEquals(null, m);
    }

    @IsTest
    static void returnsNullWhenNothingMatches() {
        System.assertEquals(null, D365ScreenPopResolver.resolve('123', null, null, null, 'contact'));
    }
}
