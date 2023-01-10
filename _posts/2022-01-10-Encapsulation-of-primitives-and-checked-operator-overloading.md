---
layout: post
title: "Encapsulation of primitive types and checked operator overloading in C# 11."
summary: "How to encapsulate primitive types to leverage static type safety and overload checked operators to catch bugs faster in development build."
date: '2023-01-10'
category: C#
thumbnail: /assets/img/posts/c-sharp-logo.png
keywords:  ['C#', 'Clean Code']
permalink: /blog/Encapsulation-of-primitive-types-and-checked-operator-overloading/
usemathjax: true
excerpt_separator: <!--more-->
---

## The problem with primitive types

When we code, many times we use one of the primitive types because it is easier, without thinking of creating one of our own. Let's suppose that we are making a game where we have to think of damage. Our player does damage, the NPC's do damage, the enemies do damage, traps, towers, spells etc. Everybody damages everybody and we have different ways of calculating that damage: Abilities, buffs, debuffs, armor, resistances plus a thousand different ways to calculate the final damage on many different situations. Usually we declare a variable as int or float called damage or something like that on every script and we never think twice about that.

This may present a problem, if damage is used in many places. The reason is that damage isn't actually a float. It may be represented by a float type, but has to follow certain rules. For example, damage cannot be negative. Sometimes we may imply a rule that negative damage is actually healing, but this is a whole new problem. What we are actually saying then, is that we have a variable called damage, which if it is positive represents damage and if it is negative represents healing. That violates an important rule:  
<mark> A variable should only be doing one thing.</mark>.  
What if later, we decide that in a level there is no healing, or when a certain buff is applied the healing is doubled. Suddenly we are in a bad situation, because we have to go search all of our code and change it in a hacky way. For example we may find ourselves writing code that says:

```none
if(buff.IsApplied && damage < 0) 
    health = health - 2*damage;
else 
    health = health - damage;
```

This is coding horror, difficult to understand for anyone that doesn't know our implied rule and really prone to bugs. The better way is to have different variables for damage and healing, but that means that we have to enforce some rules to our damage that are always to be followed. For example our damage cannot be less than zero or that we cannot divide a number by damage as this wouldn't make any sense. Even simple assignments to damage could be error prone: writing something as ```damage = health - damage``` is a simple typing mistake, but could take us a lot of time to find it and only after we observe that something doesn't work right during runtime.

Obviously this article isn't only about damage, but for any type that can be represented by a primitive type but has to obey certain rules and have certain limitations. These rules can be enforced with encapsulation during compile time and our limitations can easily be found at runtime with a new feature in C# 11: Now we can overload the checked operators. But let's start from the beginning:
<!--more-->
## Encapsulating the damage

Instead of having the damage as of type float let's create our own damage type and overload the operators that only make sense for our type:

```csharp
public readonly record struct Damage
{
    public required readonly float Value { private get; init; }

    [SetsRequiredMembers]
    public Damage(float StartingValue) => Value = StartingValue;

    public static explicit operator float(Damage damage) => damage.Value;
    public static explicit operator Damage(float value) => new(value);

    public static Damage operator -(Damage left, float right) => new(left.Value - right);
    public static Damage operator +(Damage left, float right) => new(left.Value + right);
    public static Damage operator +(float left, Damage right) => new(left + right.Value);
    public static Damage operator +(Damage left, Damage right) => new(left.Value + right.Value);
    public static Damage operator *(Damage left, float right) => new(left.Value * right);
    public static Damage operator *(float left, Damage right) => new(left * right.Value);
    public static bool operator >(Damage left, Damage right) => left.Value > right.Value;
    public static bool operator <(Damage left, Damage right) => left.Value < right.Value;
    public static bool operator >=(Damage left, Damage right) => left.Value >= right.Value;
    public static bool operator <=(Damage left, Damage right) => left.Value <= right.Value;
    public static Damage operator /(Damage left, float right)
    {
        if (right == 0f)
            throw new DivideByZeroException("Error! Division by zero.");

        return new(left.Value / right);
    }

    public static Damage operator --(Damage Damage)
    {
        var result = Damage.Value - 1;
        return new(result);
    }

    public static Damage operator ++(Damage Damage)
    {
        var result = Damage.Value + 1;
        return new(result);
    }
}
```

What is happening here? I can hear some people complain that this may be unnecessary complicated. Let me explain why i have made certain decisions about the way the Damage struct is implemented.

* The readonly modifier in the struct enforces immutability, as structs are value types this will save us from careless bugs in the future, by passing the struct as a parameter in a method.
  
* The record modifier in the struct gives us "pre-defined" implementations of Equals, ToString() and GetHashcode. The equals method and the automatically implemented ```IEquatable<T>``` especially, are super useful here.

* The Value variable here, has a private getter and init as a setter.
There is no point in making this variable exposed to the consumer of Damage, as this would defeat the purpose of not exposing the float variable. Now Value is initialized at the construction of Damage and thats it. Every external operation is being done from now on to the Damage type and not on the float type.

* The Value variable is required and not a parameter to the struct. This is because structs have a default parameterless constructor. If Value was a parameter then someone could initialize the struct like this: ```Damage damage = new()```, that would give the fields of the struct their default value, in our case the Value field would be zero, but i think it's better to enforce creating the struct by explicitly initializing it with a value.

* The constructor has a parameter so the initialization has to be done like this: ``` Damage damage = new(5) ```, but that is not very convenient, so to replicate the float behavior the explicit operator is overloaded (see below).

* The operators that are overloaded are only the ones that make sense for the Damage type. For example division by Damage is not defined, or Damage - Damage is also not defined. (What damage minus damage would represent? ).

The reasons i preferred overloading the explicit operator and not the implicit are two:

* First, i want the whoever uses the Damage type to be conscious about the casting. When you have to write ``` damage = (Damage)health ``` you make a choice that for some reason you give the damage a value that equals health, instead of writing code on autopilot.

* Second, there is not a checked implicit operator, only checked explicit operator and that will enforce our type to be inside certain boundaries.
  
Now we can write expressions with the Damage type like this:

```csharp
Damage damage = (Damage)20f;
Damage damage2 = (Damage)5f;
float health = 20;

health = (float)damage;
damage = (Damage)health;
damage -= 1f;
damage = 1f + damage2;
damage = damage2 + damage2;
damage2 = (Damage)health;
damage2 = (Damage)5f - 2f;


if(damage > (Damage)2f)
    Console.WriteLine(damage);
```

Notice the explicit casting every time we have a float value. If that bothers you you can use the implicit operator, but as i said before there is not a checked implicit operator. 

But what are checked operators ?

## Overloading the checked operators in C# 11

Checked operators existed before C# 11, but now we can overload them. The checked operators are used to check the boundaries of our variables. For example the int primitive type can get values between int.MinValue and int.MaxValue. 

If we do

```csharp
int i = int.MaxValue;
i++;
```

there will be an overflow and the result will be that i now is equal to int.MinValue. But if we run that code in checked context we will get a System Overflow Exception. How we run code in checked or unchecked context?

Either we use the checked/unchecked keywords and put that code inside brackets, like this:

```csharp
int i = int.MaxValue;
checked
{
    i++;
}
```

or even better we add it as an option to our project file, like this:

```none
<PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Debug|AnyCPU'">
    <CheckForOverflowUnderflow>True</CheckForOverflowUnderflow>
</PropertyGroup>

<PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Release|AnyCPU'">
    <CheckForOverflowUnderflow>False</CheckForOverflowUnderflow>
</PropertyGroup>
```

As we see, we can have different options for our debug and release builds. Here we run our code in debug mode using the checked operators and in release mode we use the unchecked operators.

Because we want to enforce boundaries for our Damage type, we can overload the checked operators. For example as i mentioned before we don't want our Damage type to be negative. Obviously our code should be made in a way that checks the damage every time so it will never be negative. Checked operators aren't there to replace our code logic but to catch any mistakes that may result in bugs. If we have made a mistake and a bug exists that results in damage having a negative value our tests may not catch it, but the runtime will.

Checked operators are slow because they have to make the check every time they are used, but in a Debug build where we check our code for bugs and we don't care about performance, they can be really useful. That's why i made the options above to use the checked operators in the Debug build and the normal operators in the Release.

Let's see how they are used in code:

```csharp
public static explicit operator checked Damage(float value) => new(GetResult(value));
public static Damage operator checked -(Damage left, float right) => new(GetResult(left.Value - right));
public static Damage operator checked +(Damage left, float right) => new(GetResult(left.Value + right));
public static Damage operator checked +(float left, Damage right) => new(GetResult(left + right.Value));                                                          
public static Damage operator checked +(Damage left, Damage right) => new(GetResult(left.Value + right.Value));                                                          
public static Damage operator checked *(Damage left, float right) => new(GetResult(left.Value * right));                                                              
public static Damage operator checked *(float left, Damage right) => new(GetResult(left * right.Value));
public static Damage operator checked /(Damage left, float right)
{
    if (right == 0f)
        throw new DivideByZeroException("Error! Division by zero.");

    return new(GetResult(left.Value / right));
}

private static float GetResult(float result)
{
    if (result < 0)
        throw new ArgumentOutOfRangeException(nameof(result)," is less than Minimum Allowed Damage.");

    return result;
}
```

That's pretty simple, everything is the same as normal operator overloading, only this time we put the word checked right before the operator. In this example obviously only the checked minus and the checked explicit operators need checking, but like this we can easily change the boundaries by changing only the GetResult method if the requirements ever change, for example we may decide that we  will never have the damage go above 1000 and we want to check that our code works correctly after we implement that logic.

As i said before only the explicit operator has a checked version, the implicit does not, so by defining the explicit operator we cannot do something like this now:

```csharp
float foo = -10;
damage = (Damage)foo;
```

but with the implicit operator the following will be valid:

```csharp
float foo = -10;
damage = foo;
```

One final thing to notice here is that C# doesn't enforce throwing inside the body of checked operators. Instead of throw, our GetResult method could just be logging a message be like this:

```csharp
private static float GetResult(float result)
{
    if (result < MinimumAllowedDamage)        
        Console.WriteLine($" {nameof(result)} is less than Minimum Allowed Damage. Value is {result}, minimum allowed damage is {MinimumAllowedDamage}.");

    return result;
}
```

or have a completely different implementation, even one that does something different from the non checked operator. For example maybe a situation could exist that addition has different meaning in checked and unchecked context, but i find that a situation like this would be confusing for the programmers and can't think of any reason to make a program that behaves differently between checked and unchecked versions.

## Conclusion

I wrote this article to describe both the benefits of encapsulation of primitives and the new overload of checked operators in C# 11. Someone could notice that because we return a new struct after each operation, instead of overloading the checked operators this would be sufficient:

```csharp
#if DEBUG
    public Damage(float StartingValue) => Value = GetResult(StartingValue);
#else
    public Damage(float StartingValue) => Value = StartingValue;
#endif
```

and he would be right :)

Still when we create our own classes that can easily have more data and the operations between them can be a lot more complicated checked operators are a nice addition to our toolbox.

<details>
<summary>Here is the complete Damage struct for reference <mark>(click to expand)</mark></summary>

{% highlight csharp %}
using System.Diagnostics.CodeAnalysis;

public readonly record struct Damage
{
    public required readonly float Value { private get; init; }

    private const float MinimumAllowedDamage = 0;

    [SetsRequiredMembers]
//#if DEBUG
    //public Damage(float StartingValue) => Value = GetResult(StartingValue);
//#else
    public Damage(float StartingValue) => Value = StartingValue;
//#endif

    // We could have implicit conversions but explicit is better in my opinion because
    // it allows us to think about our code instead of writing on autopilot. 
    //public static implicit operator float(Damage damage) => damage.Value;
    //public static implicit operator Damage(float value) => new(value);

    public static explicit operator float(Damage damage) => damage.Value;
    public static explicit operator Damage(float value) => new(value);

    public static Damage operator -(Damage left, float right) => new(left.Value - right);
    public static Damage operator +(Damage left, float right) => new(left.Value + right);
    public static Damage operator +(float left, Damage right) => new(left + right.Value);
    public static Damage operator +(Damage left, Damage right) => new(left.Value + right.Value);
    public static Damage operator *(Damage left, float right) => new(left.Value * right);
    public static Damage operator *(float left, Damage right) => new(left * right.Value);
    public static bool operator >(Damage left, Damage right) => left.Value > right.Value;
    public static bool operator <(Damage left, Damage right) => left.Value < right.Value;
    public static bool operator >=(Damage left, Damage right) => left.Value >= right.Value;
    public static bool operator <=(Damage left, Damage right) => left.Value <= right.Value;
    public static Damage operator /(Damage left, float right)
    {
        if (right == 0f)
            throw new DivideByZeroException("Error! Division by zero.");

        return new(left.Value / right);
    }

    public static Damage operator --(Damage Damage)
    {
        var result = Damage.Value - 1;
        return new(result);
    }
    
    public static Damage operator ++(Damage Damage)
    {
        var result = Damage.Value + 1;
        return new(result);
    }

    public static explicit operator checked Damage(float value) => new(GetResult(value));
    public static Damage operator checked -(Damage left, float right) => new(GetResult(left.Value - right));
    public static Damage operator checked +(Damage left, float right) => new(GetResult(left.Value + right));
    public static Damage operator checked +(float left, Damage right) => new(GetResult(left + right.Value));
    public static Damage operator checked +(Damage left, Damage right) => new(GetResult(left.Value + right.Value));
    public static Damage operator checked *(Damage left, float right) => new(GetResult(left.Value * right));
    public static Damage operator checked *(float left, Damage right) => new(GetResult(left * right.Value));
    public static Damage operator checked /(Damage left, float right)
    {
        if (right == 0f)
            throw new DivideByZeroException("Error! Division by zero.");

        return new(GetResult(left.Value / right));
    }

    private static float GetResult(float result)
    {
        if (result < MinimumAllowedDamage)
              throw new ArgumentOutOfRangeException(nameof(result)," is less than Minimum Allowed Damage");

        // Throwing is not enforced for checked operators. Instead we could log a message.
        //Console.WriteLine($" {nameof(result)} is less than Minimum Allowed Damage. Value is {result}, minimum allowed damage is {MinimumAllowedDamage}.");

        return result;
    }
}

{% endhighlight %}

</details><br>
This article got a little bigger than what i was expecting. If you managed to read it till the end thank you and as always if you have questions, use the comments section, or contact me directly via the [contact form]({{ site.url }}{{ site.base_url }}/contact) or [email](mailto:contact@giannisakritidis.com).
