What is this?
-------------

It's a talker implemented in javascript, designed to run on Node.js.

What's a talker?
----------------

A talker is a text based chat program, typically accessed with
telnet. They usually try to provide a sort of virtual world in which
people can talk, do things and move around. Think text based Second
Life. They were most popular in the 1990s and had pretty much died out
by 2000.

What state is this program in?
------------------------------

It's very minimal. There are no rooms, few commands and no facility to
register user names. There is enough to chat.

More importantly, it's designed to be easily extensible.

Why?
----

The core of a talker is an echo server. This is about the simplest
network program you can write so it's a good way to learn a new
platform like Node.js.

Actually though, the real reason is nostalgia.

How do I use it?
----------------

1. Install Node.js
2. node talker.js
3. telnet localhost 5555

Have fun!
