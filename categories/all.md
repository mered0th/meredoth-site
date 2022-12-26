---
layout: page
permalink: /blog/categories/
---


<h3>  {{ page.title }} </h3>

<div id="categories">
{% for category in site.categories %}
  <div class="category-box" >
    {% capture category_name %}{{ category | first }}{% endcapture %}
    <div id="#{{ category_name | slugize }}"></div>
    <h4 class="category-head"><p></p>
    {% if category_name == 'C#' %}
        {% assign url_name = "Csharp" %}
      {% else %}
        {% assign url_name = category_name %}
      {% endif %}
    <a href="{{ site.baseurl }}/blog/categories/{{ url_name }}">Category: {{ category_name }}</a></h4>
    <a name="{{ category_name | slugize }}"></a>
     {% for post in site.categories[category_name] %}
    <article class="center">
      <h6 ><a href="{{ site.baseurl }}{{ post.url }}">{{post.title}}</a></h6>
    </article>


    {% endfor %}

  </div>
{% endfor %}
</div>


