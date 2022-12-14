---
layout: post
title: "A guide for better use of enums in c# part 2."
summary: "Mapping data to logic."
date: '2022-12-12'
category: C#
thumbnail: /assets/img/posts/c-sharp-logo.png
keywords:  ['C#', 'Enums', 'Coding Principles']
permalink: /blog/Using-Enums-in-C-Sharp-Part2/
usemathjax: true
---
In the previous part we saw how to loop enums in a way that makes refactoring the program easier, by keeping the code that needs to change small and concentrated.

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

Still there is something that is annoying in our code. That switch statement in the Days example may work for small things, but can get ugly really fast.

```cs
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
```

What if our enum isn't composed by finite values, like the days of the week but is prone to change because of the requirements of our program, like an enum that holds names or titles etc.

Or what if in our enum, we need to add complicated logic, like different times for each day that run different things depending on that day.

For example let's suppose that each day has morning, afternoon, evening and night and the data or the logic of our code for that part of the day is different for each part of the day and for each day. Let's also suppose that all this logic is volatile, the requirements keep changing (ex. Let's have our NPC's Monday morning do this and Tuesday afternoon that, oh wait let's change and add Monday's morning logic to Wednesday night and Thursday morning, no let's change it again ...)

If we add boolean variables like ```isMorning``` and then add if statements for each of those boolean variables inside our switch statement, in a way that each if statement holds its own kind of logic (with its own if statements inside and variables) that would be a nightmare to maintain because the [cognitive complexity](https://www.sonarsource.com/docs/CognitiveComplexity.pdf) skyrockets.

We need a solution that gets rid of those if statements but also keeps the logic of each unique case concentrated, easy to find and easy to change so that every change affects only a small part of our code and any bugs won't 'bleed' to other parts of our program.

This would be a good case to use tables that the index maps to logic instead of data. Let's try that:

* First we create an enum like the one we have.
* Then we use polymorphism to create an interface for our day:
  
```cs
interface IDay
{
   void Morning();
   void Afternoon();
   void Evening();
   void Night();
}
```

and concrete implementations for each of our enum values like this:

```cs
public class Monday : IDay
{
   public void Morning()
   {
      Console.WriteLine("Doing Monday Morning things");
   }

   public void Afternoon()
   {
      Console.WriteLine("Doing Monday Afternoon things");
   }

   public void Evening()
   {
      Console.WriteLine("Doing Monday Evening things");
   }

   public void Night()
   {
      Console.WriteLine("Doing Monday Night things");
   }
}
```

* Lastly we create a Dictionary that maps our Day enum to our implementations:
  
```cs
Dictionary<Day, IDay> Schedule = new()
{
    {Day.Monday, new Monday()},
    {Day.Tuesday, new Tuesday()},
    {Day.Wednesday, new Wednesday()},
    {Day.Thursday, new Thursday()},
    {Day.Friday, new Friday()},
    {Day.Saturday, new Saturday()},
    {Day.Sunday, new Sunday()}
};
```

Now that might seem a lot of work and it is for simple cases, but when we have a complicated part of our code that we also expect to be volatile, (that is we expect it to change frequently), this will save us a lot of time and headaches in the long run. We can change our for statement now like this:

```cs
for(int i=0; i<10; i++)
{
    Schedule[currentDay].Morning();
    Schedule[currentDay].Afternoon();
    Schedule[currentDay].Evening();
    Schedule[currentDay].Night();
    
    currentDay = currentDay.Next();
}
```

and that part of our code works and we never have to touch it again. Changes are now easier because they are more contained:
  
* Want to add a day ? Just add it in the enum, implement the IDay interface in a new class and glue them together in the dictionary.

* Want to remove a day ? Remove it from the enum and delete the Dictionary entry. Keep the class, it won't be used but you don't know if the requirements will change in the future and you might need it again.

* Want to change a particular schedule, for example Thursday Afternoon ? Locate the Thursday class -> afternoon method and do whatever you like within. Even if a bug is introduced, it will be localized inside that method. It won't 'bleed' to other parts of the program.

* Even if we don't care about looping our enum, this architecture helps to easily get the logic we need without if statements or even worse nested if's. Do you want the logic that happens Sunday Evening ? Just call ```Schedule[Day.Sunday].Evening()```
  
It is useful to notice that the important part here is not the use of polymorphism, but the use of the Dictionary to map data to logic. If we had just used polymorphism we could have ended with something that still would be difficult to change, for example we may had found the need to do something like this:

```cs
if (currentDay is Monday)
{
    // code here
}
else if(currentDay is Tuesday) ...
```

or the corresponding switch statement, which is more prone to errors in every change, still adds all those if statements and obviously doesn't support automatic looping or enumeration of the days, because now currentDay would be an object of type IDay.

I hope you find these two articles about enums useful in your projects. Let me know in the comments if you use this or a similar technique and how it’s worked out for you!
