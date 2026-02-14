---
author: Ashok Kumar Bandige
date: 2026-02-14
excerpt: Step-by-step beginner guide to installing Docker.
tags:
- docker
- installation
title: Installing Docker
---

# Installing Docker

Docker can be installed easily.

## Mac / Windows

1.  Download Docker Desktop
2.  Install and start it
3.  Verify:

``` bash
docker --version
```

## Ubuntu Linux

``` bash
sudo apt update
sudo apt install docker.io
sudo systemctl start docker
docker run hello-world
```

If you see a success message, Docker is working.

------------------------------------------------------------------------

## References

-   https://docs.docker.com/desktop/
