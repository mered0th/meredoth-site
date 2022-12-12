---
layout: post
title:  "A variable should only be doing one thing."
summary: "A guide for better use of enums in c#"
date: '2022-12-12'
category: C#
thumbnail: 
keywords:  ['C#', 'Enums', 'Coding Principles']
permalink: /blog/Using-Enums-in-C-Sharp/
usemathjax: true
---

Usually in C# when someone declares an enum writes something like this:

```csharp
public enum Day
{
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
    Sunday
}
```

and then starts using the enum in his code to represent the days of the week. But this is error prone and not easily extensible. Sure you can enumerate the enum names or values in a foreach statement by using:

```csharp
foreach(string dayName in Enum.GetNames<Day>())
{
    Console.WriteLine(dayName);
}


foreach(int dayValue in Enum.GetValues<Day>())
{
    Console.WriteLine(dayValue);
}
```

respectively, but what about getting the next 10 days after the current day?
Usually we do something like this:

```csharp
Day startingDay = Day.Wednesday;
Day currentDay = startingDay;

for(int i=0; i<10; i++)
{
    switch (currentDay)
    {
        case Day.Monday:
            //do Monday things
            break;
        case Day.Tuesday:
            //do Tuesday things
            break;
        case Day.Wednesday:
            //do Wednesday things
            break;
        case Day.Thursday:
            //do Thursday things
            break;
        case Day.Friday:
            //do Friday things
            break;
        case Day.Saturday:
            //do Saturday things
            break;
        case Day.Sunday:
            //do Sunday things
            break;
        default:
            throw new ArgumentOutOfRangeException();
    }

    if(currentDay == Day.Sunday)
    {
        currentDay= Day.Monday;
    }
    else
    {
        currentDay++;
    }
}
```

or better we create a method that gets us the next day:

```cs
Day GetNextDay(Day day)
{
    return day == Day.Sunday ? Day.Monday : ++day;
}
```

but this still doesn't solve the underlying problem, our program is dependent on our definition of the enum.

What if the requirements change and the week starts from Sunday or Saturday ?
Then we have to change the enum, but also go looking around all of our code and change every variable that we have hardcoded as Sunday or Monday. This is obviously error prone, because we may forget to change a variable but also because we may change by accident a variable that is initialized as Sunday or Monday but not because it represents the boundary of our enum.

The boundary is our actual problem. Monday and Sunday in our enum have two purposes: They represent days but they also represent the boundaries of our enum, this is a violation of a very important principle that is true for methods, but also for variables:

<mark> A variable should only be doing one thing.</mark>

By understanding the problem, it is very easy to find a solution:

```cs
public enum Day
{
    First = 1,
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3,
    Thursday = 4,
    Friday = 5,
    Saturday = 6,
    Sunday = 7,
    Last = 7
}

Day GetNextDay(Day day) => day == Day.Last ? Day.First : ++day;
```


