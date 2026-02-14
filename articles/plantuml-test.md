---
title: "Testing PlantUML Diagrams"
date: "2026-02-14"
excerpt: "A test article demonstrating PlantUML diagram generation"
---

# Testing PlantUML Diagrams

This article demonstrates how PlantUML diagrams are automatically generated when building the site.

## Sequence Diagram

Here's a simple sequence diagram:

```plantuml
@startuml
actor User
participant "Web Browser" as Browser
participant "Web Server" as Server
database "Database" as DB

User -> Browser: Opens URL
Browser -> Server: HTTP Request
Server -> DB: Query Data
DB -> Server: Return Data
Server -> Browser: HTTP Response
Browser -> User: Display Page
@enduml
```

## Class Diagram

And here's a class diagram:

```puml
@startuml
class User {
  +String name
  +String email
  +login()
  +logout()
}

class Article {
  +String title
  +Date date
  +String content
  +publish()
  +unpublish()
}

class Blog {
  +List<Article> articles
  +User author
  +addArticle()
  +removeArticle()
}

User ||--o{ Blog
Blog ||--o{ Article
@enduml
```

## Component Diagram

Finally, a component diagram showing the blog architecture:

```plantuml
@startuml
package "Blog System" {
  [Markdown Files] --> [Build Script]
  [Build Script] --> [HTML Generator]
  [HTML Generator] --> [Static Site]
  [PlantUML Processor] --> [Build Script]
}

[User] --> [Static Site] : reads
[Author] --> [Markdown Files] : writes
@enduml
```

The diagrams above are automatically generated from PlantUML code blocks during the build process!
