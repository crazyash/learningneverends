---
author: Ashok Kumar Bandige
date: 2026-02-14
excerpt: Understand images and containers with simple examples.
tags:
- docker
- images
- containers
title: Docker Images and Containers
---

# Docker Images and Containers

## Image

An image is a blueprint. It contains instructions to create a container.

Example:

``` bash
docker pull nginx
```

## Container

A container is a running instance of an image.

``` bash
docker run nginx
```

``` plantuml
@startuml
rectangle "Docker Image"
rectangle "Container 1"
rectangle "Container 2"
"Docker Image" --> "Container 1"
"Docker Image" --> "Container 2"
@enduml
```

One image can create multiple containers.

------------------------------------------------------------------------

## References

-   https://docs.docker.com/get-started/
