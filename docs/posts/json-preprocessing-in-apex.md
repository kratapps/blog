---
title: JSON Preprocessing in Apex
date: 2024-06-22
authors: [kratoon]
description: Preprocess JSON to easily transform the data.
comments: true
categories:
    - Apex
    - JSON
---

# JSON Preprocessing in Apex

**Ever tried to deserialize JSON into a custom Apex data class, only to give up
and settle for the JSON.deserializeUntyped method with its generic
Map&lt;String, Object> result? Well, you no longer have to! Say goodbye to those
generic maps and hello to cleaner, more maintainable code!**

The other day I was integrating Salesforce with ServiceNow, just a simple REST
integration. As I prefer statically-typed structures, I started with creating an
Apex class to store the incident data returned from ServiceNow. I hit the wall.

<!-- more -->

## Deserialization Problems

Quickly I realized I won't be able to simply deserialize the response into my
Apex class, moreover I won't even be able to deploy such class.

1. One of the variable names was supposed to be `number`, and that's a reserved
   keyword in Apex.
2. All the datetime values were integer numbers, in milliseconds, and Salesforce
   works best with strings in the `yyyy-MM-ddTHH:mm:ssZ` format.
3. All the datetime values were in the `America/Los_Angeles` time zone. Even if
   parsed successfully, the Salesforce user had to be in the Pacific time zone,
   otherwise the time would be incorrect.
4. ServiceNow team is following `snake_case` naming conventions, whereas our
   team in Salesforce follows `camelCase` for Apex variables.
5. Some values would be just an empty string (`""`), even if my variable's type
   wasn't a string.

I checked [salesforce.stackexchange.com], but the accepted answer to use
`jsonString.replace('"currency":', '"currency_x":');` was not something I would
be happy about. The second recommended approach, as I was afraid, was to use the
[JSON Parser].

## Generic Solution

So I had to use the standard JSON Parser class to transform the JSON before
deserialization. Why not make the solution generic and reusable?

I came up with [JSON Preprocessor] implementation which is now open source.
Instead of using the JSON Parser directly, I'm using JSON Preprocessor, which is
much easier.

Let's have a look how such preprocessor could be used for ServiceNow incident
integration.

### Preprocessor Configuration

First we define our preprocessor and the rules for the transformation.

```apex
// JSON Preprocessor custom class configuration
public class ServiceNowIncidentPreprocessor extends JsonPreprocessor {
    public ServiceNowIncidentPreprocessor() {
        // Problem (1)
        // 'number' is a reserved keyword in Apex,
        // so let's use 'ticketNumber' instead.
        replaceFieldNamesMap.put('number', 'ticketNumber');
        // Problem (2)
        // Following datetimes are Longs,
        // but it's convenient to work with Datetime.
        datetimeFieldsToReformat.addAll(new Set<String>{
                'sysCreatedOn', 'closedAt', 'resolvedAt'
        });
        // Problem (3)
        // Let's convert the datetimes defined above
        // from 'America/Los_Angeles' to UTC.
        // UTC is default, we don't have to change the 'targetTimeZone' variable.
        sourceTimeZone = TimeZone.getTimeZone('America/Los_Angeles');
        // Problem (4)
        // snake_case would be inconsistent and our PMD rules would scream.
        // Let's use camelCase.
        // See that this conversion happens before datetime conversion,
        // so above we used 'sysCreatedOn' instead of 'sys_created_on'.
        snakeCaseToCamelCase = true;
        // Problem (5)
        // If for example 'closedAt' was not populated,
        // ServiceNow would return a String,
        // which would cause the deserialization to fail.
        replaceEmptyStringsWithNull = true;
    }
}
```

Note that you don't need a new Apex class to create a JsonPreprocessor, you
could also just initialize the JsonPreprocessor and set its variables directly.

```apex
// JSON Preprocessor direct configuration
JsonPreprocessor preprocessor = new JsonPreprocessor();
preprocessor.replaceFieldNamesMap.put('number', 'ticketNumber');
preprocessor.datetimeFieldsToReformat.addAll(new Set<String>{
        'sysCreatedOn', 'closedAt', 'resolvedAt'
});
// ...
```

### Deserialization

Now we can create an Apex data class which can be used for a reliable
deserialization.

```apex
public class ServiceNowIncident {
    // 'number' in the original JSON
    public String ticketNumber;
    // 'sys_created_on' from Long to Datetime in correct time zone.
    public Datetime sysCreatedOn;
    // 'closed_at' no empty strings, but nulls instead
    public Datetime closedAt;
    // 'resolved_at' from Long to Datetime in correct time zone.
    public Datetime resolvedAt;
    // ...
}
```

And finally we can deserialize with properly defined types.

```apex
public List<ServiceNowIncident> deserializeResponse(HttpResponse response) {
    // Preprocess response data.
    ServiceNowIncidentPreprocessor preprocessor = new ServiceNowIncidentPreprocessor();
    String incidentJson = preprocessor.process(response.getBody());
    // Deserialize the preprocessed JSON.
    return (List<ServiceNowIncident>) JSON.deserialize(
            incidentJson, List<ServiceNowIncident>.class
    );
}
```

See the [docs] for all the currently supported features.

## Contributing

Want to contribute and help add more features? Check [source code] and let me
know!

[source code]:
    https://github.com/kratapps/component-library/blob/main/src/library/classes/JsonPreprocessor.cls
[JSON Preprocessor]:
    https://github.com/kratapps/component-library/blob/main/src/library/classes/JsonPreprocessor.cls
[docs]: https://docs.kratapps.com/component-library/json-preprocessor/
[salesforce.stackexchange.com]:
    https://salesforce.stackexchange.com/questions/2276/how-do-you-deserialize-json-properties-that-are-reserved-words-in-apex
[JSON Parser]:
    https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_class_System_JsonParser.htm
