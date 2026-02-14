---
date: 2026-02-11
excerpt: Understand what Docker is and why it is important for modern
  development.
tags:
- docker
- containers
- beginner
title: What is Docker?
---

# What is Docker?

Docker is a platform that packages applications into containers.

Containers include:
- Application code
- Runtime
- Dependencies
- System libraries

## Why Docker?

It solves the "works on my machine" problem.

## Container vs VM

```plantuml
@startuml
rectangle "Host OS" {
  rectangle "Docker Engine" {
    rectangle "Container 1"
    rectangle "Container 2"
  }
}

rectangle "Hypervisor" {
  rectangle "VM 1"
  rectangle "VM 2"
}
@enduml
```

## Summary

Docker enables portable, consistent deployments.

------------------------------------------------------------------------

## References

- https://docs.docker.com/get-started/
