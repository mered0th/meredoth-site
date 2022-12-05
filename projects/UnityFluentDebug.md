---
layout: single_project
title: Unity Fluent Debug
---

{% include project_layout.html project=site.data.projects.UnityFluentDebug %}

* A wrapper over Unity Debug with some additional functionality. Using fluent syntax supports infinite chaining of debug conditions and statements to display different messages in the console log depending on the state of your game.

* Supports creating different debuggers and enabling/disabling them depending on your situation (for example you may want to keep you debug logs for your AI enabled but have you debug logs for your stat system disabled).

* Uses conditions to log debug information and increase performance by not calling debug logs when conditions are false, not calculating expensive boolean logic returned by methods or logging any debug messages when your debug is disabled.
  
* Supports a global preprocessor directive to exclude all debug calls from your builds instead of having to comment them out or erase them each time you make a production build to gain performance.

* Comes with extra extension methods besides the usual Unity's debug methods, like support for speech for windows x64 systems, null checking statements and Execute a method extension after a condition is true.

* Supports complex condition chaining like If -> statement -> Andif -> statement and statement.

Check it on github!

{% include github_star_button_UnityFluentDebug.html %} {% include github_fork_button_UnityFluentDebug.html %}
