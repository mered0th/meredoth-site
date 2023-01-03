---
layout: post
title: "Happy(new Year())"
summary: "Why the new keyword can be bad for your code. A way to follow the DRY principle."
date: '2023-01-03'
category: C#
thumbnail: /assets/img/posts/c-sharp-logo.png
keywords:  ['C#', 'new', 'Clean Code']
permalink: /blog/Happy-New-Year/
usemathjax: true
excerpt_separator: <!--more-->
---

The new Keyword in C# has two uses. It can be used as a modifier that explicitly hides a member that is inherited from a base class or as an operator to create a new instance of a type. In the first case, the new modifier will be used like this:

```csharp
using System;

Enemy enemy = new Enemy();
Enemy goblin = new Goblin();
Goblin anotherGoblin = new();
enemy.Message();
goblin.Message();
anotherGoblin.Message();

public class Enemy
{
   public void Message() => Console.WriteLine("An enemy is coming.");
}

public class Goblin : Enemy
{
   public new void Message() => Console.WriteLine("A goblin approaches.");
}
```

this is pretty straightforward, here the new keyword in the Goblin Message class is used as a modifier in the Message method and isn't required but the compiler will issue a warning if it is not used. We use the new modifier to explicitly declare that we want the child class to hide a member of the parent class. The above code will have the following output:

```none
An enemy is coming.
An enemy is coming.
A goblin approaches.
```

we should be careful about hiding members of a class, but this article isn't about the new modifier. It is about the new operator that creates a new instance: the ``` Enemy goblin = new Goblin(); ``` and how it can make our code resistant to change and less flexible.
<!--more-->

Let's suppose that we have the following class:

```csharp
public class FireSpell
{
   public float Damage { get; }
   public float Duration { get; }

   public FireSpell(float damage, float duration)
   {
      Damage = damage;
      Duration = duration;
   }

   public void Description() => Console.WriteLine($"This spell does fire damage: {Damage}hp for {Duration} seconds.");
}
```

We can easily create an instance of that class and use it like this:

```csharp
FireSpell fireSpell = new FireSpell(10f, 1f);

Console.WriteLine($"Spell has a duration of: {fireSpell.Duration} and does {fireSpell.Damage} damage");

fireSpell.Description();
```

but this creation of the firespell will happen in different areas of our code: the enemies can create firespells, our towers will create firespells, the player character will create firespells etc. For example the player may create a firespell every time he attacks:

```csharp
public class Player
{
   public float SpellDamage { get; set; }
   public float SpellDuration { get; set; }

   public void Attack(FireSpell fireSpell)
   {
      Console.WriteLine($"The player does {fireSpell.Damage}hp damage");
   }
}

player.Attack(new FireSpell(player.SpellDamage, player.SpellDuration));
```

this approach, presents us with two problems for the future:

* What if we need to change the FireSpell with another type of spell for our objects, ex. the player.
* What if we need to change the FireSpell for some of our objects with another type of spell.

Let's suppose we decide that the player casts Ice Spells. We write the following class which is similar to the FireSpell class but has a different implementation:

<details>
<summary>Similar IceSPell class <mark>(click to expand)</mark></summary>

{% highlight csharp %}
public class IceSpell
{
   public float Damage { get; }
   public float Duration { get; }

   public IceSpell(float damage, float duration)
   {
      Damage = damage;
      Duration = duration;
   }

   public void Description() => Console.WriteLine($"This spell does ice damage: {Damage}hp for {Duration} seconds.");
}
{% endhighlight %}

</details><br>

Now we have to go to the Player class and change every occurrence of the FireSpell. This is tedious but can be solved by using interfaces. By creating the following interface:

```csharp
public interface ISpell
{
   float Damage { get; }
   float Duration { get; }
   void Description();
}
```

we can substitute the ```public void Attack(FireSpell fireSpell)``` with ```public void Attack(ISpell spell)```, but this doesn't solve all our problems. Although our Player class is now flexible to change and we don't need to change it every time the requirements for the player's attack change, we still have the problem that we have to find every occurrence of the new FireSpell and change that too, in all of our objects.

The real problem here actually, is that we are repeating ourselves every time we create an instance of the spell with the ```new``` operator. Instead we should add that statement in one place in our code:

```csharp
public static class CreateMagic
{
   public static ISpell Spell(float damage, float duration) => new FireSpell(damage, duration);
}
```

now we can substitute every occurrence of the ```new``` operator which creates a FireSpell instance, with ```CreateMagic.Spell```. We have created a class that is actually a static factory. Now every time we need to change the spell that is used, we don't have to hunt down the code that creates instances of FireSpell, instead the only change we need to make is in our static factory.

Isn't creating a class that has one method which has one statement an overkill? Actually if we see that we use the FireSpell instantiation all over our code and we expect that we may need to change it in the future no. There is no point in doing that for every time we create an object with the ```new``` operator in our code, but as soon we find that we start repeating ourselves, this is a good indication that in the future we will have a problem every time a change in our code in needed.

In addition, now we have a more clear path for solving the second problem: What if we need to change the FireSpell for **some** of our objects with another type of spell. By extending our static class like this:

```csharp
public static class CreateMagic
{
   public static ISpell FireSpell(float damage, float duration) => new FireSpell(damage, duration);

   public static ISpell IceSpell(float damage, float duration) => new IceSpell(damage, duration);
}
```

we give ourselves an easy way to have some objects create FireSpells and other objects create IceSpells.

If we ever need to change something in the implementation of a spell, for example the IceSpell, there is no need to touch the IceSpell class. We can keep it, because it may be needed in the future. Maybe we decide that the old implementation was better. All we have to do is create a new implementation as a new class (for example ColdSpell) and change the static IceSpell method to:

```csharp
public static ISpell IceSpell(float damage, float duration) => new ColdSpell(damage, duration);
```

our code continues to work as before and the old implementation is still there, if we ever need it.

Thanks for reading. As always if you have questions use the comments section, or contact me directly via the [contact form]({{ site.url }}{{ site.base_url }}/contact) or [email](mailto:contact@giannisakritidis.com).

**Happy(new Year()) !!!**
