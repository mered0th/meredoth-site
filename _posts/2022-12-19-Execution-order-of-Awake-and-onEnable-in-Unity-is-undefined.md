---
layout: post
title: "Execution order of Awake and onEnable in Unity is undefined."
summary:  > 
  <center> - Tok tok. <center>
  <center> - Race condition. <center>
  <center> - Who's there? <center>
  <br>
  In different scripts OnEnable might run before Awake. A solution to avoid a nasty bug from this undefined behavior.
date: '2022-12-19'
category: Unity
thumbnail: /assets/img/posts/Unity_Technologies_logo.png
keywords:  ['Unity', 'C#']
permalink: /blog/Execution-order-of-Awake-and-onEnable-in-Unity-is-undefined/
usemathjax: true
excerpt_separator: <!--more-->
---

In Unity when we load a scene we expect Unity's event functions to execute at a certain order.  
More specifically we expect this order to be true: Awake -> onEnable -> Start  
as is described in <https://docs.unity3d.com/Manual/ExecutionOrder.html> and actually it is, but with an asterisk.

This execution order is true only for individual scripts, but not for all your scripts. Let me make this clearer: As you cannot depend on the order of the calls for your Awakes in different scripts you cannot depend that onEnable in a single script will run after all Awakes have finished running in you other scripts.
<!--more-->

For example let's say that we have ScriptA and ScriptB, both of which have the Awake, onEnable and Start event functions. When a scene is loaded Unity guarantees that Start in both of those scripts will start running after all Awakes and onEnables have completed, it also guarantees that Awake will run before onEnable for the same script, but there is no guarantee that onEnable will start running before after all Awakes have finished. That means that any of the following execution orders could be true:

* AwakeA -> AwakeB -> onEnableA -> onEnableB
* AwakeB -> AwakeA -> onEnableA -> onEnableB
* AwakeA -> onEnableA -> AwakeB -> onEnableB
* AwakeB -> onEnableB -> AwakeA -> onEnableA
* AwakeA -> AwakeB -> onEnableB -> onEnableA
* AwakeB -> AwakeA -> onEnableB -> onEnableA

Now testing if our code works, is not helpful here. Because if our code works in Editor doesn't mean that it will work in a build. Even if it works in our build it doesn't mean that it will keep working for different builds, hardware or operating systems. It actually doesn't mean that it will work for the same build every single time or for every Unity version.

While testing this, before writing this article, i coded some scripts till i get this behavior, after a while i managed to get a null reference exception because of the execution order. Still the next day when i opened my project, with the same Unity version, everything was working fine...

In Unity forums, this behavior is mentioned every once in a while, when someone encounters a bug. For reference you can check:

* <https://forum.unity.com/threads/execution-order-of-awake-vs-onenable-should-be-trivial-alas.253238/>
* <https://forum.unity.com/threads/onenable-before-awake.361429/>
* <https://forum.unity.com/threads/order-of-execution-is-awake-before-onenable-in-group-or-for-each-individual-script.521734/>
* <https://forum.unity.com/threads/be-careful-about-run-order-of-awake-functions.513892/>
* <https://forum.unity.com/threads/execution-order-of-scripts-awake-and-onenable.763688/>

but what are the solutions?

One solution could be to change the [Script Execution Order settings](https://docs.unity3d.com/Manual/class-MonoManager.html) but that can get complicated especially if you have a lot of scripts that need information in onEnable when the scene loads that gets initialized in Awake. This solution will also be a problem if you write a script that uses in onEnable a script that you haven't created, but will be created by someone else in a different project.

For example let us suppose that you write a script that mimics the toggle behavior: when it is enabled someone can hook a method in your Unity event. That script will have code that looks something like this:

```cs
public UnityEvent objectEnabled = new();

// some initialization code

private void OnEnable()
{
    // some code
    objectEnabled?.Invoke();
    // some other code 
}

// rest of your code in Start,Update etc
```

Do you see the bug?

It might happen, or it might not but we can't depend on undefined behavior.

If you don't see the bug, consider this example, someone writes a script like this:

```cs
public class Subscriber : MonoBehaviour
{
   private SpriteRenderer _spriteRenderer;

   private void Awake()
   {
      _spriteRenderer = GetComponent<SpriteRenderer>();
      _spriteRenderer.color = Color.blue;
   }
   
   public void ColorChange() =>
      _spriteRenderer.color = _spriteRenderer.color == Color.blue ? 
         Color.green : Color.blue;
}
```

and then adds the ColorChange method in the UnityEvent in the editor.

Because of the undefined behavior in the execution order this is a scenario that can happen:

Your script onEnable invokes the event -> this calls the ColorChange method -> the ColorChangeMethod tries to use the _spriteRenderer but because the Awake hasn't been executed yet, the _spriteRenderer variable is null. This will throw a null reference exception.

Obviously someone should be responsible and have null checks in his code, but this will not solve the underlying problem: the color won't change at the start of the scene and this is not a problem that the author of the Subscriber is responsible, in fact the author of the Subscriber is not responsible for changing the [Script Execution Order settings](https://docs.unity3d.com/Manual/class-MonoManager.html) because of your code and you may not be able to change it too if you don't know where you script will be used. For example you may have written this code to be used by other people in their own projects.

The worst part in all this, is that ***it might not happen***. It might not happen while testing at a specific environment or at a specific time, but because of [Murphy's law](https://en.wikipedia.org/wiki/Murphy%27s_law) we know that ***it will happen at the worst possible moment.***

The solution i use is pretty simple, i execute the onEnable behavior that might be a problem in Start when the scene loads. After that i let it execute in onEnable. My code looks something like this:

```cs
public UnityEvent objectEnabled = new();
private bool _hasStartRun;
    
private void OnEnable()
{
    if(_hasStartRun)
        objectEnabled?.Invoke();
}

private void Start()
{
    objectEnabled?.Invoke();
    _hasStartRun = true;
}
```

by introducing a boolean variable that becomes true in Start, the code will only run in onEnable when the object gets disabled/enabled, but when the scene loads it will run from Start, which is guaranteed to be executed after all Awake and onEnable have finished.

Even if the code that is dependent on other object's Awake function, is not a single invoke, but multiple statements, i create a method called Init, which is called in Start when the scene loads and in onEnable afterwards. I have found that method to be especially useful when using object pooling, where you need to do Initialization in onEnable after the object is returned from the pool, but also you need the same code to run when the scene loads.

What about you? have you ever encountered this problem? If yes what solution did you use?

I would love to hear you opinions on this article and especially different kinds of solution for this behavior in Unity's execution order, which can be a headache if you haven't heard about it before.
