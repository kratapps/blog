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

**Ever tried to deserialize JSON into a custom Apex data class, only to give up and settle for the `JSON.deserializeUntyped` method with its generic `Map<String, Object>` result?
Well, you no longer have to! Say goodbye to those generic maps and hello to cleaner, more maintainable code!**

## The Problem

The other day I was integrating Salesforce with ServiceNow, just a simple REST integration.
As I prefer statically-typed structures, I immediately created an Apex class to store the case data returned from ServiceNow.
I hit the wall.

<!-- more -->

1. One of the variable names was supposed to be `number`, and that's a reserved keyword in Apex.
2. All the datetime values were integer numbers, in milliseconds, and not strings in the `yyyy-MM-ddTHH:mm:ssZ` format.
3. All the datetime values were in the `America/Los_Angeles` time zone. Even if parsed successfully, the Salesforce user had to be in the Pacific time zone, otherwise the time would be incorrect.
4. ServiceNow team is following `snake_case` naming conventions, whereas our team in Salesforce follows `camelCase`.
5. Some values would be just an empty string (`""`), even if my primitive type wasn't a string.

I checked the [Salesforce StackExchange], but the accepted answer to use `jsonString.replace('"currency":', '"currency_x":');` was not good enough for me.

Check out the [documentation].

## Contributing

Want to contribute and help add more features? Check the [source code] and let me know!

[source code]: https://github.com/kratapps/component-library/blob/main/src/library/classes/JsonPreprocessor.cls
[documentation]: https://docs.kratapps.com/component-library/json-preprocessor/
[Salesforce StackExchange]: https://salesforce.stackexchange.com/questions/2276/how-do-you-deserialize-json-properties-that-are-reserved-words-in-apex
