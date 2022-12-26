---
layout: post
title: "Using dynamic overloading in C# for a more flexible architecture."
summary: "How to substitute big switch statements with classes, to keep our code independent and flexible to changes."
date: '2022-12-26'
category: C#
thumbnail: /assets/img/posts/c-sharp-logo.png
keywords:  ['C#', 'Dynamic', 'Overload']
permalink: /blog/Dynamic-Overloading/
usemathjax: true
excerpt_separator: <!--more-->
---

## C# and the dynamic keyword

C# is  mostly a statically typed language, that means that the compiler determines the facts about each type during compile time. This has several advantages:

* Errors are caught by the compiler so they never make it to runtime.
* Your code readability improves because it contains information about your types to anyone who reads it.
* The IDE can help you with information about your type and its available behaviors.
* Performance benefits, because runtime minimizes data verification and data conversion.
  
Dynamic objects though have some benefits. Because dynamic objects expose members of the type, like methods and properties at runtime, can help you work with types that do not match a static type. The dynamic keyword in C# is a static type, but an object of the type dynamic bypasses static type checking and in most cases functions like it is of the type object.

For example let's say we have the following:

```csharp
IEnemy orc = new Orc();
```

The orc object, is of type IEnemy at compile time, but at runtime is of type Orc. Let's also suppose that we have a Player class that has the public method ``` Hunt(IEnemy enemy) ```
and we want to use it, but the player needs to do different types of hunting depending on the enemy and also use specific methods of the Orc class that are not part of the IEnemy interface. <!--more-->

We can do something like this:

``` csharp
public void Hunt(IEnemy enemy)
{
    if(enemy is Orc)
    {
        // do some hunting specific on Orc class
        // use Orc methods
    }
}
```

but what if we have different types of IEnemy and for each type we want to use different player hunting methods and different methods that are enemy behaviors and not part of the IEnemy interface? Here's an example with three different types of enemies that implement the IEnemy interface:

```csharp
public interface IEnemy { }

public class Orc : IEnemy
{
    public string ThrowStone() => "The Orc throws a stone.";
}

public class Goblin : IEnemy
{
    public int RunningSpeed() => 20;
}

public class Dragon : IEnemy
{
    public void Angry() => Console.WriteLine("The dragon got angry.");
}
```

usually the solution is to create a switch statement inside the hunt method and define the different behaviors like this:

```csharp
public class Player
{
    public int PlayerSpeed { get; set; }
    public int MaxSpeed { get; } = 100;
    
    // some player code ...
    
    public void Hunt(IEnemy enemy)
    {
        switch (enemy)
        {
            case Orc orc:
                Console.WriteLine("Hunting stealthily");
                Console.WriteLine(orc.ThrowStone());
                break;
            case Goblin goblin:
                int speed = goblin.RunningSpeed();
                Console.WriteLine($"Goblin is running with speed of: {speed}");
                PlayerSpeed = speed;
                Console.WriteLine($"Player is now hunting with speed: {PlayerSpeed}");
                break;
            case Dragon dragon:
                dragon.Angry();
                PlayerSpeed = MaxSpeed;
                Console.WriteLine($"Player tries to get away with speed: {PlayerSpeed}");
                break;
            default:
                Console.WriteLine("Error unknown enemy type");
                break;
        }
    }
    
    // other player code ...
}
```

this may work for simple cases, but this method now doesn't do only one thing. It is responsible for different types of hunting that depend on the IEnemy type. If the requirements change, for example:

* We want to change the way the player hunts an enemy type.
* We want to change methods inside the enemy classes.
* We want to add/remove new types of enemies.

we have to go inside that switch statement and start changing things. Not only this is prone to bugs because of the switch statement which could reach eventually to be hundred's of lines of code, but also because of the Player class. The Player class will surely have other code too, and for each change we need to make to the Hunt method we risk breaking the Player class. At first let's find a way to take that method out.

This easy: a class doesn't only represent an object of the real world, but can also represent a behavior. So we create a PlayerHunt class and add that Hunt method inside, so the Player class will now look like this:

```csharp
public class Player
{
    public int PlayerSpeed { get; set; }
    public int MaxSpeed { get; } = 100;
    
    private readonly PlayerHunt _playerHunt = new();
    
    // some player code ...
    public void Hunt(IEnemy enemy) => _playerHunt.Hunt(this, enemy);
    // other player code ...
}
```

Notice that we changed the Hunt method's signature because we need a way to have access to the Player's methods and properties. This solves our problem with the changes in the Player class, when we want to make a change in the different hunting methods, but doesn't solve our problem with that giant switch statement. Now that switch statement is inside the hunt method of the PlayerHunt class.

## Dynamic overloading

Here is where the dynamic overloading of C# can help us. We create the Hunt method in a way that will call the appropriate hunting method of each enemy type dynamically, depending on the enemy type at runtime rather than the type at compile time:

```csharp
public void Hunt(Player player, IEnemy enemy) => 
    DynamicHunt(player, (dynamic) enemy);
```

After that we can separate each behavior in its own method. Now instead of that switch statement we will have the equivalent PlayerHunt class that will look like this:

```csharp
public class PlayerHunt
{
    public void Hunt(Player player, IEnemy enemy) => DynamicHunt(player, (dynamic) enemy);

    private void DynamicHunt(Player player, Orc orc)
    {
        Console.WriteLine("Hunting stealthily");
        Console.WriteLine(orc.ThrowStone());
    }

    private void DynamicHunt(Player player, Goblin goblin)
    {
        int speed = goblin.RunningSpeed();
        Console.WriteLine($"Goblin is running with speed of: {speed}");
        player.PlayerSpeed = speed;
        Console.WriteLine($"Player is now hunting with speed: {player.PlayerSpeed}");
    }

    private void DynamicHunt(Player player, Dragon dragon)
    {
        player.PlayerSpeed = player.MaxSpeed;
        dragon.Angry();
        Console.WriteLine($"Player tries to get away with speed: {player.PlayerSpeed}");
    }

    private void DynamicHunt(Player player, IEnemy unknownEnemy)
    {
        Console.WriteLine("Error unknown enemy type");
    }
}
```

The runtime here will know which overload of the DynamicHunt method to call, depending on the type of our enemy at runtime (which could be Orc, Goblin or Dragon), instead of the type at compile time which is IEnemy. This gives us the flexibility of polymorphism through the IEnemy interface but also the flexibility to make changes easily.

Each different behavior of hunting for the player is inside its own method. Changes will affect only this method by using its local variables. Whenever we need to make a change, we can locate the appropriate method and if we need to add a new enemy, we can just add a new method without worrying (like in the switch statement) if we break something by using variables that are global to the Player class.

## Performance considerations

The only concern here is the performance, which is not much of a concern really. In my testing using the [Benchmarkdotnet](https://github.com/dotnet/BenchmarkDotNet) configured for the mono runtime, the dynamic overloading is about 12x-13x times slower in empty methods. This might seem a lot, but we are talking nanoseconds here. Generally:

* if my program doesn't meet the performance requirements and
* if the code with the dynamic overloading is in a hot path and
* if this part of the code is the bottleneck and
* if the time of the code that executes inside those methods is not orders of magnitude greater, but is also in the nanoseconds duration
  
then i would still use this method during development and when i have reached a point where i know that changes in the code won't happen anymore, i will copy/paste the code in a giant switch statement. Still, those four if's are pretty rare and i think flexibility during development is always better than performance gains that make your code more rigid.

Do you use dynamic overloading in you projects? If yes have you found a different way that can improve you code's flexibility? If no, why? do you have other considerations or didn't know about this use case? I would love to hear other opinions on this subject.

As always thank you for reading this article and if you have any questions or comments you can use the comment section or contact me directly via [email](mailto:contact@giannisakritidis.com).
