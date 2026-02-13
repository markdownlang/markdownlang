# main

**Welcome to the kitchen sink demo!**

**What is your name?**

> name

**Hello, {name}!**

**Enter a number:**

> num

[num](#classify)

[num, 0, 1](#sum-to)

[num](#square)

**Goodbye, {name}!**

# classify

1. n

## *n > 0*

**{n} is positive**

---

## *n == 0*

**{n} is zero**

---

**{n} is negative**

# sum-to

1. n
1. sum
1. i

## *i > n*

**Sum from 1 to {n} is {sum}**

---

sum += i

[n, sum, i + 1](#sum-to)

# square

1. n
- result = n \* n

**{n} squared is {result}**
