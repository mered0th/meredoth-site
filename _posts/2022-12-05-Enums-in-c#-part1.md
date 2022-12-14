---
layout: post
title: "A guide for better use of enums in c# part 1."
summary: "A variable should only be doing one thing."
date: '2022-12-5'
category: C#
thumbnail: /assets/img/posts/c-sharp-logo.png
keywords:  ['C#', 'Enums', 'Coding Principles']
permalink: /blog/Using-Enums-in-C-Sharp-Part1/
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
foreach(var dayName in Enum.GetNames<Day>())
{
    // do something with dayName
}


foreach(var dayValue in Enum.GetValues<Day>())
{
    //do something with dayValue
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
Then we have to change the enum, but also go looking around all of our code and change every variable that we have hardcoded as Sunday or Monday. This is obviously error prone, because we may forget to change a variable or because we may change by accident a variable that is initialized as Sunday or Monday but not because it represents the boundary of our enum.

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

or even better by using C# extension methods. Although extension methods usually are useful for external classes, because we can modify our own code with new methods, enums don't have their own methods but support extensions so:

```cs
public static class EnumExtensions
{
    public static Day Next(this Day day) => day == Day.Last ? Day.First : ++day;
}
```

now looping our enum gets easy by writing ```currentDay = currentDay.Next()```, but most importantly our code now, isn't dependent on the enum values. We can add, remove  or change the values of our enum, as long as we keep our First and Last values updated.

A thing to notice here is that by adding the First and Last entries in our enum the statement:

```cs
foreach(var dayValue in Enum.GetValues<Day>())
```

would give the values of 1 and 7 two times. If we would like to get each value only once the we should use the LINQ distinct method:

```cs
foreach(var dayValue in Enum.GetValues<Day>().Distinct()) {}
```

or even better cache the result in an array and use the array:

```cs
var days = Enum.GetValues<Day>().Distinct();
foreach(var day in days) {}
```

What about the  
```A variable should only be doing one thing```
principle ? Can enums help us with other situations where this principle is violated ?

Sure but first let's see another common use case where we could introduce a variable to avoid this. 

Many times we use an int to do two things, for example let's say that we make a method that returns the data from a save file:

```cs
public SaveData LoadGame(SaveFile file)
```

this method returns the data of a save file or -1 if something goes wrong. But what does wrong mean here ? It could mean any number of things and while we will be able to remember the context while we write our code, it will be difficult for another programmer to use our code without reading the documentation or a comment in our method, or even for us after we get back to this code after 6 months or more.

A better approach would be to explicitly create a boolean variable that we can check, or even better do it like many other libraries and write our method like this:

```cs
public bool TryLoadGame(SaveFile file, out SaveData data)
```

What this has to do with enums? Well sometimes we use a boolean that defaults to true when something succeeds but is false when something fails in a different number of ways. So in our example if we return false, that false could mean any number of things that we have to check like:

* The file was not found.
* The data was corrupted.
* This is an older version of our SaveFile and we need to transform it to our new version.

This is a good example where we should use an enum instead of a boolean, because our boolean value does two different things. It returns success or failure but also uses failure to imply different errors. 

A better way to write our method would be in a way that it returns an enum, so that the code documents itself.

```cs
enum LoadFileStatus
{
    Success,
    FileNotFound,
    CorruptedData,
    OlderVersion
}

public LoadFileStatus LoadGame(SaveFile file, out SaveData data)
```

if this returns anything other than ```LoadFileStatus.Success``` we don't have to care about our data and use SaveData values that are a convention to report the problem.

Instead by checking the return value of the method we know the problem and can act accordingly, but most importantly it is clear to anyone that uses our method what exactly has happened.

In the next part let's see how we can remove that horrible switch statement by using tables that get an enum as index to map data to logic.

I hope you find this useful in your projects. If you have any comments or questions use the comment section or don't hesitate to contact me directly by email.
